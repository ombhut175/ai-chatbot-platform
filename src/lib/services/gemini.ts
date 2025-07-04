import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GeminiChatRequest {
  message: string
  context: string
  systemPrompt?: string
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  constructor() {
    // Initialize only if API key is available
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    }
  }

  private ensureInitialized(): void {
    if (!this.genAI || !this.model) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }
  }

  /**
   * Generate a chat response using Gemini
   */
  async generateChatResponse(request: GeminiChatRequest): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      this.ensureInitialized()
      
      const { message, context, systemPrompt } = request

      // Construct the prompt with context
      const prompt = `
${systemPrompt || 'You are a helpful assistant. Answer questions based on the provided context.'}

Context:
${context}

User Question: ${message}

Please provide a helpful and accurate response based on the context provided above. If the answer is not found in the context, politely say that you don't have enough information to answer that specific question.
`

      console.log('🤖 Generating Gemini response...')
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      if (!text) {
        return { success: false, error: 'No response generated' }
      }

      console.log('✅ Gemini response generated successfully')
      return { success: true, response: text }
    } catch (error) {
      console.error('Gemini generation error:', error)
      
      let errorMessage = 'Failed to generate response'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      return { success: false, error: errorMessage }
    }
  }

  /**
   * Generate a streaming chat response
   */
  async *generateChatResponseStream(request: GeminiChatRequest): AsyncGenerator<string, void, unknown> {
    try {
      this.ensureInitialized()
      
      const { message, context, systemPrompt } = request

      const prompt = `
${systemPrompt || 'You are a helpful assistant. Answer questions based on the provided context.'}

Context:
${context}

User Question: ${message}

Please provide a helpful and accurate response based on the context provided above. If the answer is not found in the context, politely say that you don't have enough information to answer that specific question.
`

      const result = await this.model.generateContentStream(prompt)
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          yield chunkText
        }
      }
    } catch (error) {
      console.error('Gemini streaming error:', error)
      throw error
    }
  }
}

export const geminiService = new GeminiService()
