import { Pinecone } from '@pinecone-database/pinecone'
import { apiRequest } from '@/helpers/request'

export class PineconeService {
  private pinecone: Pinecone
  private indexName: string
  private dimension: number

  constructor() {
    // Validate environment variables
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required')
    }
    if (!process.env.HUGGING_FACE_API_URL || !process.env.HUGGING_FACE_API_TOKEN) {
      throw new Error('Hugging Face API configuration missing')
    }

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    })
    
    //TODO: temporary hardcoded index name
    const indexName = 'ai-chatbot-index-2';
    
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME environment variable is required')
    }

    this.indexName = indexName;

    
    
    // Read embedding dimension from env var, default to 768 for most sentence-transformer models
    this.dimension = parseInt('384', 10)
    
    console.log(`🔧 PineconeService initialized with index: ${this.indexName}, dimension: ${this.dimension}`)
  }

  /**
   * Initialize Pinecone index if it doesn't exist
   */
  async initializeIndex(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if index exists
      const indexList = await this.pinecone.listIndexes()
      const existingIndex = indexList?.indexes?.find(index => index.name === this.indexName)

      if (existingIndex) {
        // Check if dimension matches
        if (existingIndex.dimension !== this.dimension) {
          console.warn(`⚠️  WARNING: Existing Pinecone index '${this.indexName}' has dimension ${existingIndex.dimension}, but the configured embedding dimension is ${this.dimension}.`)
          console.warn(`⚠️  Skipping index creation to avoid runtime failure.`)
          console.warn(`📝 MIGRATION NOTE: To use a different embedding dimension, you need to:`)
          console.warn(`   1. Create a new index with the desired dimension`)
          console.warn(`   2. Re-embed all your documents with the new model`)
          console.warn(`   3. Migrate the data to the new index`)
          console.warn(`   4. Update PINECONE_INDEX_NAME to point to the new index`)
          console.warn(`⚠️  Current operations will continue with the existing index dimension.`)
        }
        // Index exists, no need to create
        return { success: true }
      }

      // Create index if it doesn't exist
      console.log(`🆕 Creating new Pinecone index '${this.indexName}' with dimension ${this.dimension}...`)
      await this.pinecone.createIndex({
        name: this.indexName,
        dimension: this.dimension, // Use configured embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      })
      
      // Wait for index to be ready
      console.log(`⏳ Waiting for index to be ready...`)
      await new Promise(resolve => setTimeout(resolve, 10000))
      console.log(`✅ Index '${this.indexName}' created successfully with dimension ${this.dimension}`)

      return { success: true }
    } catch (error) {
      console.error('Pinecone initialization error:', error)
      return { success: false, error: 'Failed to initialize Pinecone index' }
    }
  }

  /**
   * Create embeddings for text using Hugging Face API
   */
  async createEmbeddings(text: string): Promise<{ success: boolean; embeddings?: number[]; error?: string }> {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Empty text provided' }
      }

      // Check Hugging Face configuration
      if (!process.env.HUGGING_FACE_API_URL || !process.env.HUGGING_FACE_API_TOKEN) {
        return { success: false, error: 'Hugging Face API not configured' }
      }

      console.log(`🔑 Creating embedding for text (${text.length} chars) using Hugging Face...`)

      // Call Hugging Face API with custom config
      const response = await apiRequest.postWithConfig<number[]>(
        process.env.HUGGING_FACE_API_URL!,
        { inputs: text.trim() },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGING_FACE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          suppressToast: true
        }
      )

      // Hugging Face API returns raw array directly
      if (!response || !Array.isArray(response) || response.length === 0) {
        return { success: false, error: 'No embeddings generated by Hugging Face' }
      }

      console.log(`✅ Created embedding with ${response.length} dimensions`)
      return { success: true, embeddings: response }
    } catch (error) {
      console.error('Embedding creation error:', error)
      
      // Provide specific error messages for common issues
      let errorMessage = 'Failed to create embeddings'
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        if (axiosError.response?.status === 401) {
          errorMessage = 'Invalid Hugging Face API token'
        } else if (axiosError.response?.status === 429) {
          errorMessage = 'Hugging Face API rate limit exceeded'
        } else if (axiosError.response?.status === 503) {
          errorMessage = 'Hugging Face model is loading, please try again'
        } else if (axiosError.response?.data?.error) {
          errorMessage = `Hugging Face API error: ${axiosError.response.data.error}`
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as Error).message
      }

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Upload document chunks to Pinecone
   */
  async uploadDocument(
    documentId: string,
    chunks: Array<{ id: string; text: string; metadata?: any }>,
    namespace: string
  ): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log(`🔧 Initializing Pinecone for document ${documentId}...`)
      const initResult = await this.initializeIndex()
      if (!initResult.success) {
        return { success: false, error: `Pinecone initialization failed: ${initResult.error}` }
      }

      const index = this.pinecone.index(this.indexName)
      console.log(`📝 Processing ${chunks.length} chunks for embeddings...`)

      // Create embeddings for all chunks
      const vectors = []
      const failedChunks = []
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        console.log(`🧠 Creating embedding for chunk ${i + 1}/${chunks.length} (${chunk.text.length} chars)...`)
        
        // Validate chunk text
        if (!chunk.text || chunk.text.trim().length === 0) {
          console.warn(`⚠️ Skipping empty chunk ${chunk.id}`)
          failedChunks.push({ id: chunk.id, reason: 'Empty text' })
          continue
        }

        // Limit chunk size for Hugging Face API (varies by model, but generally safe at 512 tokens ≈ 2k chars)
        // You may adjust this based on your specific model's max sequence length
        const limitedText = chunk.text.length > 2000 ? chunk.text.substring(0, 2000) : chunk.text

        const embeddingResult = await this.createEmbeddings(limitedText)
        
        if (!embeddingResult.success || !embeddingResult.embeddings) {
          console.error(`❌ Failed to create embedding for chunk ${chunk.id}: ${embeddingResult.error}`)
          failedChunks.push({ id: chunk.id, reason: embeddingResult.error })
          continue
        }

        vectors.push({
          id: `${documentId}_${chunk.id}`,
          values: embeddingResult.embeddings,
          metadata: {
            documentId,
            chunkId: chunk.id,
            text: limitedText,
            originalLength: chunk.text.length,
            ...chunk.metadata
          }
        })

        console.log(`✅ Created embedding for chunk ${chunk.id} (${embeddingResult.embeddings.length} dimensions)`)
      }

      console.log(`📊 Vector creation summary: ${vectors.length} successful, ${failedChunks.length} failed`)

      if (vectors.length === 0) {
        const errorDetails = {
          totalChunks: chunks.length,
          failedChunks,
          reason: 'All embedding creations failed'
        }
        return { 
          success: false, 
          error: 'No vectors created for document', 
          details: errorDetails 
        }
      }

      // Upload vectors to Pinecone in batches to avoid timeouts
      console.log(`🚀 Uploading ${vectors.length} vectors to Pinecone namespace: ${namespace}...`)
      
      // Batch size for Pinecone uploads (50 is conservative to avoid timeouts)
      const BATCH_SIZE = 50;
      const batches = [];
      
      for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        batches.push(vectors.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Split into ${batches.length} batches of up to ${BATCH_SIZE} vectors each`);
      
      // Upload each batch with retry logic
      let successfulUploads = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📤 Uploading batch ${i + 1}/${batches.length} (${batch.length} vectors)...`);
        
        // Retry logic for batch upload
        let retryCount = 0;
        const maxRetries = 3;
        let uploadSuccess = false;
        
        while (retryCount < maxRetries && !uploadSuccess) {
          try {
            await index.namespace(namespace).upsert(batch);
            console.log(`✅ Batch ${i + 1} uploaded successfully`);
            successfulUploads += batch.length;
            uploadSuccess = true;
            
            // Small delay between batches to avoid rate limiting
            if (i < batches.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (batchError) {
            retryCount++;
            const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
            
            // Check if error is retryable (timeout or rate limit)
            if ((errorMessage.includes('timeout') || errorMessage.includes('504') || errorMessage.includes('429')) && retryCount < maxRetries) {
              const delay = 1000 * Math.pow(2, retryCount - 1); // Exponential backoff: 1s, 2s, 4s
              console.warn(`⚠️ Batch ${i + 1} failed (attempt ${retryCount}/${maxRetries}), retrying in ${delay}ms...`);
              console.warn(`   Error: ${errorMessage}`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              console.error(`❌ Failed to upload batch ${i + 1} after ${retryCount} attempts:`, batchError);
              throw new Error(`Failed to upload batch ${i + 1} of ${batches.length}: ${errorMessage}`);
            }
          }
        }
        
        if (!uploadSuccess) {
          throw new Error(`Failed to upload batch ${i + 1} after ${maxRetries} retries`);
        }
      }
      
      console.log(`🎉 Successfully uploaded ${successfulUploads} vectors to Pinecone`)

      return { 
        success: true, 
        details: {
          vectorsCreated: vectors.length,
          failedChunks: failedChunks.length,
          namespace
        }
      }
    } catch (error) {
      console.error('Document upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return { 
        success: false, 
        error: `Failed to upload document to Pinecone: ${errorMessage}`,
        details: { originalError: error instanceof Error ? error : String(error) }
      }
    }
  }

  /**
   * Get all vectors from a namespace for a specific document using a more reliable approach
   */
  async getVectorsByDocumentId(
    namespace: string,
    documentId: string
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const index = this.pinecone.index(this.indexName)

      // Use a simple query with filter to get vectors for the specific document
      // Create a dummy embedding - the filter will do the actual work
      const embeddingResult = await this.createEmbeddings('query')
      
      if (!embeddingResult.success || !embeddingResult.embeddings) {
        return { success: false, error: 'Failed to create dummy embedding for search' }
      }

      console.log(`🔍 Searching for vectors with documentId: ${documentId} in namespace: ${namespace}`)

      // Search with filter for the specific document
      const searchResult = await index.namespace(namespace).query({
        vector: embeddingResult.embeddings,
        topK: 10000, // High limit to get all vectors for this document
        includeMetadata: true,
        filter: { documentId: documentId }
      })

      console.log(`✅ Retrieved ${searchResult.matches?.length || 0} vectors for document ${documentId}`)
      
      return { success: true, results: searchResult.matches || [] }
    } catch (error) {
      console.error('Get vectors by document ID error:', error)
      return { success: false, error: 'Failed to get vectors for document' }
    }
  }

  /**
   * Get all vectors from a namespace using a generic query approach (deprecated)
   * @deprecated Use getVectorsByDocumentId for better reliability
   */
  async getAllVectorsFromNamespace(
    namespace: string,
    filter?: any
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const index = this.pinecone.index(this.indexName)

      // Use a generic query that should match most content
      // We'll use a simple word that's likely to appear in most documents
      const genericQueries = ['information', 'data', 'content', 'txt', 'document','text']
      
      let allResults: any[] = []
      
      for (const genericQuery of genericQueries) {
        try {
          const embeddingResult = await this.createEmbeddings(genericQuery)
          
          if (embeddingResult.success && embeddingResult.embeddings) {
            // Search with a high topK to get many results
            const searchResult = await index.namespace(namespace).query({
              vector: embeddingResult.embeddings,
              topK: 1000, // Get many vectors
              includeMetadata: true,
              filter
            })

            if (searchResult.matches) {
              // Add results that we haven't seen before (based on ID)
              const existingIds = new Set(allResults.map(r => r.id))
              const newResults = searchResult.matches.filter(match => !existingIds.has(match.id))
              allResults.push(...newResults)
            }
          }
        } catch (queryError) {
          console.warn(`Failed to query with "${genericQuery}":`, queryError)
          continue
        }
      }

      // Remove duplicates and sort by score
      const uniqueResults = Array.from(
        new Map(allResults.map(item => [item.id, item])).values()
      ).sort((a, b) => (b.score || 0) - (a.score || 0))

      console.log(`✅ Retrieved ${uniqueResults.length} vectors from namespace ${namespace}`)
      
      return { success: true, results: uniqueResults }
    } catch (error) {
      console.error('Get all vectors error:', error)
      return { success: false, error: 'Failed to get vectors from namespace' }
    }
  }

  /**
   * Search for similar documents with pre-computed embeddings
   */
  async searchSimilarWithEmbeddings(
    embeddings: number[],
    namespace: string,
    topK: number = 10,
    filter?: any
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const index = this.pinecone.index(this.indexName)

      console.log(`🔍 Searching in namespace "${namespace}" with topK=${topK} using provided embeddings`)
      const searchResult = await index.namespace(namespace).query({
        vector: embeddings,
        topK,
        includeMetadata: true,
        filter
      })

      console.log(`✅ Search completed. Found ${searchResult.matches?.length || 0} matches`)
      return { success: true, results: searchResult.matches }
    } catch (error) {
      console.error('Search error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `Failed to search documents: ${errorMessage}` }
    }
  }

  /**
   * Search for similar documents
   */
  async searchSimilar(
    query: string,
    namespace: string,
    topK: number = 10,
    filter?: any
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      // Handle empty or whitespace-only queries
      if (!query || query.trim().length === 0) {
        console.log('Empty query provided, using getAllVectorsFromNamespace instead')
        return this.getAllVectorsFromNamespace(namespace, filter)
      }

      const index = this.pinecone.index(this.indexName)

      // Create embedding for query
      console.log(`🔍 Creating embeddings for query: "${query.substring(0, 50)}..." in namespace: ${namespace}`)
      const embeddingResult = await this.createEmbeddings(query.trim())
      
      if (!embeddingResult.success || !embeddingResult.embeddings) {
        console.error('❌ Embedding creation failed:', embeddingResult.error)
        return { success: false, error: 'Failed to create query embedding' }
      }

      console.log(`✅ Query embedding created with ${embeddingResult.embeddings.length} dimensions`)

      // Use the new function with embeddings
      return this.searchSimilarWithEmbeddings(embeddingResult.embeddings, namespace, topK, filter)
    } catch (error) {
      console.error('Search error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: `Failed to search documents: ${errorMessage}` }
    }
  }

  /**
   * Delete document from Pinecone
   */
  async deleteDocument(
    documentId: string,
    namespace: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const index = this.pinecone.index(this.indexName)

      // Delete all vectors for this document
      await index.namespace(namespace).deleteMany({
        filter: { documentId }
      })

      return { success: true }
    } catch (error) {
      console.error('Document deletion error:', error)
      return { success: false, error: 'Failed to delete document from Pinecone' }
    }
  }

  /**
   * Process text content and split into chunks
   */
  processTextContent(content: string, chunkSize: number = 1000, overlap: number = 200): Array<{ id: string; text: string }> {
    const chunks = []
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    let currentChunk = ''
    let chunkIndex = 0

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      
      if (currentChunk.length + trimmedSentence.length + 1 <= chunkSize) {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence
      } else {
        if (currentChunk) {
          chunks.push({
            id: `chunk_${chunkIndex}`,
            text: currentChunk + '.'
          })
          chunkIndex++
        }
        
        // Start new chunk with overlap
        const words = currentChunk.split(' ')
        const overlapWords = words.slice(-Math.floor(overlap / 6)) // Rough word count for overlap
        currentChunk = overlapWords.join(' ') + (overlapWords.length > 0 ? '. ' : '') + trimmedSentence
      }
    }

    // Add the last chunk
    if (currentChunk) {
      chunks.push({
        id: `chunk_${chunkIndex}`,
        text: currentChunk + '.'
      })
    }

    return chunks
  }
}

export const pineconeService = new PineconeService() 