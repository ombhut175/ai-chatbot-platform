import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Message {
  id: string
  session_id: string
  message: string
  response?: string | null
  message_type: 'user' | 'assistant'
  tokens_used?: number | null
  response_time_ms?: number | null
  created_at: string
  chatbot_id?: string
}

interface ChatbotDetails {
  id: string
  name: string
  description: string | null
  welcome_message: string | null
  theme: {
    primaryColor: string
    backgroundColor: string
    textColor: string
  } | null
}

interface PublicChatState {
  // State
  messages: Message[]
  sessionId: string | null
  chatbot: ChatbotDetails | null
  isLoading: boolean
  isSending: boolean
  error: string | null
  inputMessage: string
  
  // Actions
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setSessionId: (sessionId: string) => void
  setChatbot: (chatbot: ChatbotDetails) => void
  setIsLoading: (isLoading: boolean) => void
  setIsSending: (isSending: boolean) => void
  setError: (error: string | null) => void
  setInputMessage: (message: string) => void
  resetChat: () => void
}

export const usePublicChatStore = create<PublicChatState>()(
  immer((set) => ({
    // Initial state
    messages: [],
    sessionId: null,
    chatbot: null,
    isLoading: false,
    isSending: false,
    error: null,
    inputMessage: '',
    
    // Actions
    setMessages: (messages) => set((state) => {
      state.messages = messages
    }),
    
    addMessage: (message) => set((state) => {
      // Check if message already exists to prevent duplicates
      const exists = state.messages.some(m => 
        m.id === message.id || 
        (m.created_at === message.created_at && 
         m.message === message.message && 
         m.response === message.response)
      )
      if (!exists) {
        state.messages.push(message)
      }
    }),
    
    setSessionId: (sessionId) => set((state) => {
      state.sessionId = sessionId
    }),
    
    setChatbot: (chatbot) => set((state) => {
      state.chatbot = chatbot
    }),
    
    setIsLoading: (isLoading) => set((state) => {
      state.isLoading = isLoading
    }),
    
    setIsSending: (isSending) => set((state) => {
      state.isSending = isSending
    }),
    
    setError: (error) => set((state) => {
      state.error = error
    }),
    
    setInputMessage: (message) => set((state) => {
      state.inputMessage = message
    }),
    
    resetChat: () => set((state) => {
      state.messages = []
      state.sessionId = null
      state.error = null
      state.inputMessage = ''
      state.isSending = false
    })
  }))
)
