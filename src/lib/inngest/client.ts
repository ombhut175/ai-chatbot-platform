import { Inngest } from 'inngest'
import { validateInngestConfig, inngestConfig } from './config'

// Validate configuration on initialization
if (typeof window === 'undefined') {
  validateInngestConfig()
}

// Create the Inngest client
// When using Vercel integration, configuration is auto-handled
export const inngest = new Inngest({
  id: 'ai-chatbot-platform',
  name: 'AI Chatbot Platform',
  // Only add explicit eventKey if not using Vercel integration
  ...(inngestConfig.eventKey && !inngestConfig.isVercel && {
    eventKey: inngestConfig.eventKey,
  }),
  // Set environment based on NODE_ENV
  ...(inngestConfig.isProduction && {
    env: 'production',
  }),
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