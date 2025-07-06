import { inngest } from './client'
import { createClient } from '@/lib/supabase/server'
import { pineconeService } from '@/lib/services/pinecone'
import { createDataSourceService } from '@/lib/services/dataSource'
import { createStorageService } from '@/lib/services/storage'
import { Supabase } from '@/helpers/string_const/supabase'
import { DataSourceStatus } from '@/helpers/string_const/dataSource'
import { urlQaFunctions } from './urlQaFunctions'

export const processFileFunction = inngest.createFunction(
  { id: 'process-file' },
  { event: 'file/process' },
  async ({ event, step }) => {
    const { dataSourceId, companyId, fileName, fileType, storagePath } = event.data

    console.log(`🚀 Starting file processing for ${fileName} (${dataSourceId})`)

    // Step 1: Download file from Supabase storage
    const fileContent = await step.run('download-file', async () => {
      console.log('📥 Downloading file from storage...')
      
      const supabase = await createClient()
      const storageService = createStorageService(supabase)
      
      // Get file from storage using storage service
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(Supabase.BUCKETS.DATA_SOURCES)
        .download(storagePath)

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`)
      }

      // Convert blob to Buffer for processing (Buffers serialize better than ArrayBuffer)
      const arrayBuffer = await fileData.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)
      
      console.log(`📁 File downloaded: ${fileBuffer.length} bytes`)
      
      return {
        buffer: fileBuffer,
        size: fileBuffer.length
      }
    }, {
      // 2 minute timeout for file download
      timeout: '2m'
    })

    // Step 2: Extract text content based on file type
    const extractedText = await step.run('extract-text', async () => {
      console.log(`📄 Extracting text content from ${fileType} file...`)
      
      let textContent = ''
      
      try {
        switch (fileType) {
          case 'txt':
          case 'json':
            // Convert buffer to string for text files
            if (Buffer.isBuffer(fileContent.buffer)) {
              textContent = fileContent.buffer.toString('utf-8')
            } else if (fileContent.buffer && typeof fileContent.buffer === 'object') {
              // Handle serialized buffer from Inngest
              const bufferObj = fileContent.buffer as any
              if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
                textContent = Buffer.from(bufferObj.data).toString('utf-8')
              } else {
                throw new Error('Invalid buffer format for text file')
              }
            } else {
              throw new Error(`Invalid buffer format: ${typeof fileContent.buffer}`)
            }
            console.log(`✅ Text file decoded: ${textContent.length} characters`)
            break
            
          case 'csv':
            // Basic CSV text extraction (you'd want proper CSV parsing)
            if (Buffer.isBuffer(fileContent.buffer)) {
              textContent = fileContent.buffer.toString('utf-8')
            } else if (fileContent.buffer && typeof fileContent.buffer === 'object') {
              // Handle serialized buffer from Inngest
              const bufferObj = fileContent.buffer as any
              if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
                textContent = Buffer.from(bufferObj.data).toString('utf-8')
              } else {
                throw new Error('Invalid buffer format for CSV file')
              }
            } else {
              throw new Error(`Invalid buffer format: ${typeof fileContent.buffer}`)
            }
            console.log(`✅ CSV file decoded: ${textContent.length} characters`)
            break
            
          case 'pdf':
            // Extract text from PDF using pdf2json
            try {
              // Handle buffer properly - it should already be a Buffer from download step
              let pdfBuffer: Buffer
              if (Buffer.isBuffer(fileContent.buffer)) {
                pdfBuffer = fileContent.buffer
                console.log(`✅ Using Buffer: ${pdfBuffer.length} bytes`)
              } else if (fileContent.buffer && typeof fileContent.buffer === 'object') {
                // Handle serialized buffer from Inngest
                const bufferObj = fileContent.buffer as any
                if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
                  pdfBuffer = Buffer.from(bufferObj.data)
                  console.log(`✅ Converted serialized Buffer: ${pdfBuffer.length} bytes`)
                } else {
                  throw new Error('Invalid buffer format received from Inngest')
                }
              } else {
                throw new Error(`Invalid buffer format: ${typeof fileContent.buffer}`)
              }
              
              // Import pdf2json for PDF parsing
              const PDFParser = await import('pdf2json')
              
              // Create a promise-based wrapper for the PDF parser
              const parsePdfPromise = new Promise<string>((resolve, reject) => {
                const pdfParser = new (PDFParser.default as any)(null, 1)
                
                pdfParser.on("pdfParser_dataError", (errData: any) => {
                  console.error('❌ PDF parsing error:', errData.parserError)
                  reject(new Error(`PDF parsing failed: ${errData.parserError}`))
                })

                pdfParser.on("pdfParser_dataReady", () => {
                  try {
                    const extractedText = (pdfParser as any).getRawTextContent()
                    console.log(`📄 PDF text extracted: ${extractedText.length} characters`)
                    resolve(extractedText)
                  } catch (error) {
                    reject(new Error(`Failed to extract text content: ${error instanceof Error ? error.message : 'Unknown error'}`))
                  }
                })

                // Parse PDF from buffer
                try {
                  pdfParser.parseBuffer(pdfBuffer)
                } catch (parseError) {
                  reject(new Error(`Failed to parse PDF buffer: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`))
                }
              })
              
              textContent = await parsePdfPromise
              
              if (!textContent || textContent.trim().length === 0) {
                throw new Error('No text content found in PDF file. The PDF may be image-based or empty.')
              }
              
              console.log(`📄 PDF text extraction successful: ${textContent.length} characters`)
            } catch (pdfError) {
              console.error('❌ PDF parsing error:', pdfError)
              const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error'
              throw new Error(`Failed to extract text from PDF: ${errorMessage}`)
            }
            break
            
          case 'docx':
            // Extract text from DOCX using mammoth
            try {
              // Handle buffer properly - it should already be a Buffer from download step
              let docxBuffer: Buffer
              if (Buffer.isBuffer(fileContent.buffer)) {
                docxBuffer = fileContent.buffer
              } else if (fileContent.buffer && typeof fileContent.buffer === 'object') {
                // Handle serialized buffer from Inngest
                const bufferObj = fileContent.buffer as any
                if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
                  docxBuffer = Buffer.from(bufferObj.data)
                } else {
                  throw new Error('Invalid buffer format received from Inngest')
                }
              } else {
                throw new Error(`Invalid buffer format: ${typeof fileContent.buffer}`)
              }
              
              // Dynamically import mammoth only when needed
              const mammoth = await import('mammoth')
              const result = await mammoth.extractRawText({ buffer: docxBuffer })
              textContent = result.value
              
              if (!textContent || textContent.trim().length === 0) {
                throw new Error('No text content found in DOCX file. The document may be empty or contain only images.')
              }
              
              // Log any warnings from mammoth
              if (result.messages.length > 0) {
                console.log('⚠️ DOCX parsing warnings:', result.messages)
              }
              
              console.log(`📄 DOCX text extracted: ${textContent.length} characters`)
            } catch (docxError) {
              console.error('❌ DOCX parsing error:', docxError)
              const errorMessage = docxError instanceof Error ? docxError.message : 'Unknown DOCX parsing error'
              throw new Error(`Failed to extract text from DOCX: ${errorMessage}`)
            }
            break
            
          case 'xlsx':
            // Extract text from XLSX using xlsx library
            try {
              // Handle buffer properly - it should already be a Buffer from download step
              let xlsxBuffer: Buffer
              if (Buffer.isBuffer(fileContent.buffer)) {
                xlsxBuffer = fileContent.buffer
              } else if (fileContent.buffer && typeof fileContent.buffer === 'object') {
                // Handle serialized buffer from Inngest
                const bufferObj = fileContent.buffer as any
                if (bufferObj.type === 'Buffer' && Array.isArray(bufferObj.data)) {
                  xlsxBuffer = Buffer.from(bufferObj.data)
                } else {
                  throw new Error('Invalid buffer format received from Inngest')
                }
              } else {
                throw new Error(`Invalid buffer format: ${typeof fileContent.buffer}`)
              }
              
              // Dynamically import XLSX only when needed
              const XLSX = await import('xlsx')
              const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' })
              
              let allText = []
              
              // Process all sheets in the workbook
              for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName]
                
                // Convert sheet to JSON to extract all cell values
                const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
                
                // Add sheet name as a header
                allText.push(`Sheet: ${sheetName}`)
                
                // Extract all cell values and format them
                for (const row of sheetData) {
                  const rowArray = row as any[]
                  const rowText = rowArray
                    .filter(cell => cell !== null && cell !== undefined && cell !== '')
                    .map(cell => String(cell).trim())
                    .filter(cell => cell.length > 0)
                    .join(' | ')
                  
                  if (rowText.length > 0) {
                    allText.push(rowText)
                  }
                }
                
                allText.push('') // Add empty line between sheets
              }
              
              textContent = allText.join('\n')
              
              if (!textContent || textContent.trim().length === 0) {
                throw new Error('No text content found in XLSX file. The spreadsheet may be empty or contain only formatting.')
              }
              
              console.log(`📊 XLSX text extracted from ${workbook.SheetNames.length} sheets: ${textContent.length} characters`)
            } catch (xlsxError) {
              console.error('❌ XLSX parsing error:', xlsxError)
              const errorMessage = xlsxError instanceof Error ? xlsxError.message : 'Unknown XLSX parsing error'
              throw new Error(`Failed to extract text from XLSX: ${errorMessage}`)
            }
            break
            
          default:
            throw new Error(`Unsupported file type: ${fileType}`)
        }
      } catch (decodeError) {
        console.error(`❌ Error extracting text from ${fileType}:`, decodeError)
        const errorMessage = decodeError instanceof Error ? decodeError.message : 'Unknown decode error'
        throw new Error(`Failed to extract text from ${fileType} file: ${errorMessage}`)
      }

      // Validate extracted content
      if (!textContent || textContent.trim().length === 0) {
        throw new Error(`No text content could be extracted from the ${fileType} file`)
      }

      if (textContent.trim().length < 10) {
        throw new Error(`Extracted text too short (${textContent.length} chars). File may be empty or corrupted.`)
      }

      console.log(`✅ Text extraction successful: ${textContent.length} characters`)
      console.log(`📝 First 200 chars: ${textContent.substring(0, 200)}...`)
      
      return textContent
    }, {
      // 3 minute timeout for text extraction (PDF/DOCX can be slow)
      timeout: '3m'
    })

    // Step 3: Process text into chunks and create embeddings
    const embeddingResult = await step.run('create-embeddings', async () => {
      
      console.log('🧠 Processing text into chunks and creating embeddings...')
      
      // Process text into chunks
      const chunks = pineconeService.processTextContent(extractedText, 1000, 200)
      console.log(`📝 Created ${chunks.length} text chunks`)

      // Create namespace for this document
      const namespace = `company_${companyId}`

      // Upload to Pinecone with dataSourceId as metadata
      const uploadResult = await pineconeService.uploadDocument(
        dataSourceId,
        chunks,
        namespace
      )

      if (!uploadResult.success) {
        throw new Error(`Failed to upload to Pinecone: ${uploadResult.error}`)
      }

      console.log(`✅ Successfully uploaded ${chunks.length} chunks to Pinecone`)
      
      return {
        chunksCount: chunks.length,
        namespace
      }
    }, {
      // Increase timeout to 5 minutes for embedding creation and upload
      // This prevents Inngest from timing out during large file processing
      timeout: '5m'
    })

    // Step 4: Update database status
    const updateResult = await step.run('update-database', async () => {
      console.log('💾 Updating database status...')
      
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      const result = await dataSourceService.updateDataSource(dataSourceId, {
        status: DataSourceStatus.READY,
        pinecone_namespace: embeddingResult.namespace
      })

      if (!result.success) {
        throw new Error(`Failed to update database: ${result.error}`)
      }

      console.log('✅ Database updated successfully')
      return result.data
    })

    console.log(`🎉 File processing completed successfully for ${fileName}`)
    
    return {
      success: true,
      dataSourceId,
      fileName,
      chunksCount: embeddingResult.chunksCount,
      namespace: embeddingResult.namespace,
      processedAt: new Date().toISOString()
    }
  }
)

// Handle processing errors
export const handleProcessingError = inngest.createFunction(
  { id: 'handle-processing-error' },
  { event: 'file/process.failed' },
  async ({ event, step }) => {
    const { dataSourceId, error: errorMessage } = event.data

    console.log(`❌ Handling processing error for ${dataSourceId}: ${errorMessage}`)

    await step.run('update-error-status', async () => {
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      await dataSourceService.updateDataSource(dataSourceId, {
        status: DataSourceStatus.ERROR
      })

      console.log('💾 Updated status to error in database')
    })

    return {
      success: true,
      dataSourceId,
      errorHandled: true
    }
  }
)

// Add the chatbot training function
export const trainChatbotFunction = inngest.createFunction(
  { id: 'train-chatbot' },
  { event: 'chatbot/train' },
  async ({ event, step }) => {
    const { chatbotId, companyId, dataSourceIds, chatbotName } = event.data

    console.log(`🤖 Starting chatbot training for ${chatbotName} (${chatbotId})`)
    console.log(`📚 Training on ${dataSourceIds.length} data sources`)

    // Step 1: Get chatbot information and validate it exists
    const chatbotInfo = await step.run('validate-chatbot', async () => {
      console.log('🔍 Validating chatbot exists...')
      
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      // Get chatbot details (we'll add this to chatbot service later if needed)
      const { data: chatbot, error } = await supabase
        .from('chatbots')
        .select('*')
        .eq('id', chatbotId)
        .eq('company_id', companyId)
        .single()

      if (error || !chatbot) {
        throw new Error(`Chatbot not found: ${error?.message}`)
      }

      console.log(`✅ Chatbot validated: ${chatbot.name}`)
      return chatbot
    })

    // Step 2: Get data sources associated with this chatbot
    const dataSources = await step.run('fetch-chatbot-data-sources', async () => {
      console.log('📥 Fetching data sources associated with chatbot...')
      
      const supabase = await createClient()
      const dataSourceService = createDataSourceService(supabase)
      
      // Get data source IDs from the junction table
      const { data: associations, error: associationError } = await supabase
        .from('chatbot_data_sources')
        .select('data_source_id')
        .eq('chatbot_id', chatbotId)
      
      if (associationError) {
        console.error('❌ Failed to fetch chatbot data source associations:', associationError)
        throw new Error(`Failed to fetch data source associations: ${associationError.message}`)
      }
      
      if (!associations || associations.length === 0) {
        console.warn('⚠️ No data sources associated with this chatbot')
        return []
      }
      
      const associatedDataSourceIds = associations.map(a => a.data_source_id)
      console.log(`🔗 Found ${associatedDataSourceIds.length} associated data sources`)
      
      const sources = []
      
      for (const dataSourceId of associatedDataSourceIds) {
        const result = await dataSourceService.getDataSourceById(dataSourceId)
        
        if (result.success && result.data) {
          // Ensure the data source belongs to the same company
          if (result.data.companyId === companyId) {
            // Only include data sources that are ready
            if (result.data.status === 'ready') {
              sources.push(result.data)
              console.log(`📋 Including data source: ${result.data.name} (${result.data.type}, ${result.data.status})`)
            } else {
              console.warn(`⚠️ Skipping data source ${result.data.name} - status is ${result.data.status}, needs to be 'ready'`)
            }
          } else {
            console.warn(`⚠️ Skipping data source ${dataSourceId} - company mismatch`)
          }
        } else {
          console.warn(`⚠️ Failed to fetch data source ${dataSourceId}: ${result.error}`)
        }
      }
      
      console.log(`✅ Found ${sources.length} valid data sources for training`)
      return sources
    })

    // Step 3: Prepare Pinecone namespace for the chatbot
    const pineconeNamespace = await step.run('setup-pinecone-namespace', async () => {
      console.log('🔧 Setting up Pinecone namespace for chatbot...')
      
      // Use the chatbot's existing namespace or create a new one
      const namespace = chatbotInfo.pinecone_namespace || `chatbot_${companyId}_${chatbotId}`
      
      console.log(`📋 Using Pinecone namespace: ${namespace}`)
      return namespace
    })

    // Step 4: Collect all training data from the data sources
    const trainingData = await step.run('collect-training-data', async () => {
      console.log('📚 Collecting training data from data sources...')
      
      const allChunks = []
      
      for (const dataSource of dataSources) {
        try {
          console.log(`📖 Processing data source: ${dataSource.name}`)
          
          // Get the data source content from Pinecone using company namespace
          const existingNamespace = `company_${companyId}`
          
          // Get all content from the data source using the improved method
          const searchResult = await pineconeService.getVectorsByDocumentId(
            existingNamespace,
            dataSource.id
          )
          
          if (searchResult.success && searchResult.results) {
            const chunks = searchResult.results.map((match: any) => ({
              id: `${dataSource.id}_${match.id}`,
              text: match.metadata?.text || '',
              metadata: {
                dataSourceId: dataSource.id,
                dataSourceName: dataSource.name,
                originalScore: match.score,
                ...match.metadata
              }
            }))
            
            allChunks.push(...chunks)
            console.log(`✅ Added ${chunks.length} chunks from ${dataSource.name}`)
            
            // Debug: Log first chunk text sample
            if (chunks.length > 0) {
              console.log(`📝 Sample text from ${dataSource.name}: ${chunks[0].text.substring(0, 100)}...`)
            }
          } else {
            console.warn(`⚠️ No content found for data source ${dataSource.name}`)
            console.warn(`   Search result: success=${searchResult.success}, error=${searchResult.error}`)
          }
        } catch (error) {
          console.error(`❌ Error processing data source ${dataSource.name}:`, error)
        }
      }
      
      console.log(`📊 Total training chunks collected: ${allChunks.length}`)
      
      // Provide detailed summary
      if (allChunks.length === 0) {
        console.error('❌ TRAINING DATA COLLECTION SUMMARY:')
        console.error(`   - Total data sources found: ${dataSources.length}`)
        console.error(`   - Ready data sources: ${dataSources.filter(ds => ds.status === 'ready').length}`)
        console.error(`   - Company namespace: company_${companyId}`)
        console.error(`   - No training chunks were collected from any data source`)
        console.error(`   - This indicates that either:`)
        console.error(`     1. Data sources haven't been processed yet (check their status)`)
        console.error(`     2. Data was stored in a different namespace`)
        console.error(`     3. There's an issue with the Pinecone search`)
      } else {
        console.log(`✅ TRAINING DATA COLLECTION SUMMARY:`)
        console.log(`   - Total data sources processed: ${dataSources.length}`)
        console.log(`   - Total chunks collected: ${allChunks.length}`)
        console.log(`   - Company namespace: company_${companyId}`)
      }
      
      return allChunks
    })

    // Step 5: Upload training data to chatbot's Pinecone namespace
    const uploadResult = await step.run('upload-to-pinecone', async () => {
      try {
        console.log('🚀 Uploading training data to Pinecone...')
        
        if (trainingData.length === 0) {
          throw new Error(`No training data available for chatbot. Please ensure that:
1. Data sources are associated with this chatbot
2. Associated data sources have been processed successfully (status: 'ready')
3. Data sources contain valid content that was uploaded to Pinecone`)
        }
        
        // Upload all chunks to the chatbot's namespace
        const result = await pineconeService.uploadDocument(
          chatbotId,
          trainingData,
          pineconeNamespace
        )
        
        if (!result.success) {
          throw new Error(`Failed to upload training data: ${result.error}`)
        }
        
        console.log(`✅ Successfully uploaded training data to Pinecone`)
        return result
      } catch (error) {
        // Update chatbot status to error if upload fails
        await updateChatbotStatusOnError(chatbotId, error)
        throw error
      }
    })

    // Step 6: Update chatbot metadata with training info
    const finalResult = await step.run('update-chatbot-metadata', async () => {
      console.log('📝 Updating chatbot with training metadata...')
      
      const supabase = await createClient()
      
      // Update chatbot with training information
      const { error } = await supabase
        .from('chatbots')
        .update({
          status: 'ready',
          pinecone_namespace: pineconeNamespace,
          // Store training metadata in the theme field for now
          theme: {
            ...chatbotInfo.theme,
            training: {
              namespace: pineconeNamespace,
              dataSourceCount: dataSources.length,
              chunkCount: trainingData.length,
              trainedAt: new Date().toISOString(),
              status: 'completed'
            }
          }
        })
        .eq('id', chatbotId)
      
      if (error) {
        console.error('❌ Failed to update chatbot metadata:', error)
        // Don't throw error here as the training was successful
      }
      
      console.log('✅ Chatbot training completed successfully')
      
      return {
        chatbotId,
        namespace: pineconeNamespace,
        dataSourceCount: dataSources.length,
        chunkCount: trainingData.length,
        status: 'completed'
      }
    })

    console.log(`🎉 Chatbot ${chatbotName} training completed successfully!`)
    console.log(`📊 Training summary:`, finalResult)
    
    return finalResult
  }
)

// Helper function to update chatbot status on error
async function updateChatbotStatusOnError(chatbotId: string, error: any) {
  try {
    const supabase = await createClient()
    await supabase
      .from('chatbots')
      .update({ status: 'error' })
      .eq('id', chatbotId)
    
    console.error(`❌ Updated chatbot ${chatbotId} status to 'error' due to training failure:`, error)
  } catch (updateError) {
    console.error(`❌ Failed to update chatbot status to error:`, updateError)
  }
}

// Export all functions
export const functions = [
  processFileFunction,
  handleProcessingError,
  trainChatbotFunction,
  ...urlQaFunctions
] 