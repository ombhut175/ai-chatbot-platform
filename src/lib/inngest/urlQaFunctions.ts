import { inngest } from './client'
import { createClient } from '@/lib/supabase/server'
import { pineconeService } from '@/lib/services/pinecone'
import { createDataSourceService } from '@/lib/services/dataSource'
import { DataSourceStatus } from '@/helpers/string_const/dataSource'

/**
 * Process URL scraping content and upload to Pinecone
 */
export const processUrlFunction = inngest.createFunction(
  { id: 'process-url' },
  { event: 'url/process' },
  async ({ event, step }) => {
    const { dataSourceId, companyId, url, title, content, type } = event.data

    console.log(`🚀 Starting URL content processing for ${url} (${dataSourceId})`)

    // Step 1: Validate content
    const validatedContent = await step.run('validate-content', async () => {
      console.log('✅ Validating scraped content...')
      
      if (!content || content.trim().length === 0) {
        throw new Error('No content provided for processing')
      }

      if (content.trim().length < 50) {
        throw new Error(`Content too short (${content.length} chars). May be empty or corrupted.`)
      }

      console.log(`✅ Content validation successful: ${content.length} characters`)
      console.log(`📝 First 200 chars: ${content.substring(0, 200)}...`)
      
      return content.trim()
    })

    // Step 2: Process text into chunks and create embeddings
    const embeddingResult = await step.run('create-embeddings', async () => {
      console.log('🧠 Processing URL content into chunks and creating embeddings...')
      
      // Process text into chunks
      const chunks = pineconeService.processTextContent(validatedContent, 1000, 200)
      console.log(`📝 Created ${chunks.length} text chunks from URL content`)

      // Create namespace for this document (consistent with file processing)
      const namespace = `company_${companyId}`

      // Upload to Pinecone
      const uploadResult = await pineconeService.uploadDocument(
        dataSourceId,
        chunks,
        namespace
      )

      if (!uploadResult.success) {
        throw new Error(`Failed to upload URL content to Pinecone: ${uploadResult.error}`)
      }

      console.log(`✅ Successfully uploaded ${chunks.length} chunks from URL to Pinecone`)
      
      return {
        chunksCount: chunks.length,
        namespace
      }
    })

    // Step 3: Update database status
    const updateResult = await step.run('update-database', async () => {
      console.log('💾 Updating database status for URL content...')
      
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      const result = await dataSourceService.updateDataSource(dataSourceId, {
        status: DataSourceStatus.READY,
        pinecone_namespace: embeddingResult.namespace
      })

      if (!result.success) {
        throw new Error(`Failed to update database: ${result.error}`)
      }

      console.log('✅ Database updated successfully for URL content')
      return result.data
    })

    console.log(`🎉 URL content processing completed successfully for ${url}`)
    
    return {
      success: true,
      dataSourceId,
      url,
      title,
      chunksCount: embeddingResult.chunksCount,
      namespace: embeddingResult.namespace,
      processedAt: new Date().toISOString()
    }
  }
)

/**
 * Process Q&A pairs and upload to Pinecone
 */
export const processQaFunction = inngest.createFunction(
  { id: 'process-qa' },
  { event: 'qa/process' },
  async ({ event, step }) => {
    const { dataSourceId, companyId, question, answer, content, type } = event.data

    console.log(`🚀 Starting Q&A pair processing for question: "${question.substring(0, 50)}..." (${dataSourceId})`)

    // Step 1: Validate Q&A content
    const validatedContent = await step.run('validate-qa-content', async () => {
      console.log('✅ Validating Q&A content...')
      
      if (!question || question.trim().length === 0) {
        throw new Error('Question is empty or invalid')
      }

      if (!answer || answer.trim().length === 0) {
        throw new Error('Answer is empty or invalid')
      }

      if (!content || content.trim().length === 0) {
        throw new Error('Formatted Q&A content is empty')
      }

      console.log(`✅ Q&A validation successful:`)
      console.log(`   Question: ${question.length} chars`)
      console.log(`   Answer: ${answer.length} chars`)
      console.log(`   Total content: ${content.length} chars`)
      
      return content.trim()
    })

    // Step 2: Process Q&A content into chunks and create embeddings
    const embeddingResult = await step.run('create-qa-embeddings', async () => {
      console.log('🧠 Processing Q&A content into chunks and creating embeddings...')
      
      // For Q&A pairs, we'll create a single chunk or split if content is very long
      let chunks
      
      if (validatedContent.length <= 1000) {
        // Single chunk for shorter Q&A pairs
        chunks = [{
          id: 'qa_chunk_0',
          text: validatedContent,
          metadata: {
            type: 'qa_pair',
            question: question.trim(),
            answer: answer.trim()
          }
        }]
        console.log(`📝 Created single chunk for Q&A pair`)
      } else {
        // Multiple chunks for longer content
        chunks = pineconeService.processTextContent(validatedContent, 800, 100)
        // Add Q&A metadata to all chunks
        chunks = chunks.map(chunk => ({
          ...chunk,
          metadata: {
            type: 'qa_pair',
            question: question.trim(),
            answer: answer.trim()
          }
        }))
        console.log(`📝 Created ${chunks.length} chunks for long Q&A content`)
      }

      // Create namespace for this document (consistent with file processing)
      const namespace = `company_${companyId}`

      // Upload to Pinecone
      const uploadResult = await pineconeService.uploadDocument(
        dataSourceId,
        chunks,
        namespace
      )

      if (!uploadResult.success) {
        throw new Error(`Failed to upload Q&A content to Pinecone: ${uploadResult.error}`)
      }

      console.log(`✅ Successfully uploaded ${chunks.length} Q&A chunks to Pinecone`)
      
      return {
        chunksCount: chunks.length,
        namespace
      }
    })

    // Step 3: Update database status
    const updateResult = await step.run('update-qa-database', async () => {
      console.log('💾 Updating database status for Q&A pair...')
      
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      const result = await dataSourceService.updateDataSource(dataSourceId, {
        status: DataSourceStatus.READY,
        pinecone_namespace: embeddingResult.namespace
      })

      if (!result.success) {
        throw new Error(`Failed to update database: ${result.error}`)
      }

      console.log('✅ Database updated successfully for Q&A pair')
      return result.data
    })

    console.log(`🎉 Q&A pair processing completed successfully`)
    
    return {
      success: true,
      dataSourceId,
      question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
      chunksCount: embeddingResult.chunksCount,
      namespace: embeddingResult.namespace,
      processedAt: new Date().toISOString()
    }
  }
)

/**
 * Handle URL processing errors
 */
export const handleUrlProcessingError = inngest.createFunction(
  { id: 'handle-url-processing-error' },
  { event: 'url/process.failed' },
  async ({ event, step }) => {
    const { dataSourceId, error: errorMessage, url } = event.data

    console.log(`❌ Handling URL processing error for ${dataSourceId} (${url}): ${errorMessage}`)

    await step.run('update-url-error-status', async () => {
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      await dataSourceService.updateDataSource(dataSourceId, {
        status: DataSourceStatus.ERROR
      })

      console.log('💾 Updated URL processing status to error in database')
    })

    return {
      success: true,
      dataSourceId,
      url,
      errorHandled: true
    }
  }
)

/**
 * Handle Q&A processing errors
 */
export const handleQaProcessingError = inngest.createFunction(
  { id: 'handle-qa-processing-error' },
  { event: 'qa/process.failed' },
  async ({ event, step }) => {
    const { dataSourceId, error: errorMessage, question } = event.data

    console.log(`❌ Handling Q&A processing error for ${dataSourceId}: ${errorMessage}`)

    await step.run('update-qa-error-status', async () => {
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      await dataSourceService.updateDataSource(dataSourceId, {
        status: DataSourceStatus.ERROR
      })

      console.log('💾 Updated Q&A processing status to error in database')
    })

    return {
      success: true,
      dataSourceId,
      question: question?.substring(0, 50) + (question?.length > 50 ? '...' : ''),
      errorHandled: true
    }
  }
)

// Export all URL and Q&A functions
export const urlQaFunctions = [
  processUrlFunction,
  processQaFunction,
  handleUrlProcessingError,
  handleQaProcessingError
] 