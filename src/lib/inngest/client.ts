import { Inngest } from 'inngest'

// Create the Inngest client
export const inngest = new Inngest({
  id: 'ai-chatbot-platform',
  name: 'AI Chatbot Platform',
})

// Event types for type safety
export interface FileProcessingEvent {
  name: 'file/process'
  data: {
    dataSourceId: string
    companyId: string
    fileName: string
    fileType: string
    storagePath: string
  }
}

// Export event type union
export type InngestEvents = FileProcessingEvent 