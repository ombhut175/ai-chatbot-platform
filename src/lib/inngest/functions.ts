import { inngest } from './client'
import { createClient } from '@/lib/supabase/server'
import { pineconeService } from '@/lib/services/pinecone'
import { createDataSourceService } from '@/lib/services/dataSource'
import { createStorageService } from '@/lib/services/storage'
import { Supabase } from '@/helpers/string_const/supabase'
import { DataSourceStatus } from '@/helpers/string_const/dataSource'

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
    })

    // Step 3: Process text into chunks and create embeddings
    const embeddingResult = await step.run('create-embeddings', async () => {
      
      console.log('🧠 Processing text into chunks and creating embeddings...')
      
      // Process text into chunks
      const chunks = pineconeService.processTextContent(extractedText, 1000, 200)
      console.log(`📝 Created ${chunks.length} text chunks`)

      // Create namespace for this document
      const namespace = `company_${companyId}_${dataSourceId}`

      // Upload to Pinecone
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

// Export all functions
export const functions = [
  processFileFunction,
  handleProcessingError
] 