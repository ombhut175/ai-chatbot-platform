import useSWR from 'swr'
import { apiRequest } from '@/helpers/request'
import { usePublicChatStore } from '@/store/publicChatStore'
import { type Chatbot } from '@/lib/types'
import { ChatbotPersonality } from '@/helpers/string_const/chatbot'

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
  type: 'public' | 'internal'
}

interface SendMessageResponse {
  message: string
  sessionId: string
  timestamp: string
}

// Fetcher for chatbot details
const chatbotFetcher = async (url: string): Promise<Chatbot> => {
  const response = await apiRequest.get<ChatbotDetails>(url)
  // We need to augment the public details with default values to satisfy the full Chatbot type
  return {
    ...response,
    personality: ChatbotPersonality.FRIENDLY,
    is_active: true, // Public details are only returned for active chatbots
    status: 'ready',
    company_id: '', // Not relevant for public chat
    pinecone_namespace: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

// Fetcher for chat history
const chatHistoryFetcher = async (url: string): Promise<Message[]> => {
  const response = await apiRequest.get<Message[]>(url)
  return response
}

// Hook to fetch chatbot details - DEPRECATED: Use direct fetch in component for public access
// The /api/chatbots/[chatbotId] endpoint requires authentication which public chat doesn't have
export const useChatbot = (chatbotId: string | null) => {
  const { setChatbot, setError } = usePublicChatStore()
  
  const { data, error, isLoading, mutate } = useSWR(
    chatbotId ? `/api/chatbots/details/${chatbotId}` : null,
    chatbotFetcher,
    {
      revalidateOnFocus: false,
      onSuccess: (data) => {
        setChatbot(data)
        setError(null)
      },
      onError: (err) => {
        console.error('Failed to load chatbot:', err)
        setError('Failed to load chatbot')
      }
    }
  )
  
  return {
    chatbot: data,
    isLoading,
    error,
    refresh: mutate
  }
}

// Hook to fetch chat history
export const useChatHistory = (sessionId: string | null, chatbotId: string | null) => {
  const { setMessages, setError } = usePublicChatStore()
  
  const { data, error, isLoading, mutate } = useSWR(
    sessionId && chatbotId 
      ? `/api/chat?sessionId=${sessionId}&chatbotId=${chatbotId}` 
      : null,
    chatHistoryFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
      onSuccess: (data) => {
        if (data && data.length > 0) {
          // Validate that all messages belong to the current chatbot
          const validMessages = data.filter(msg => 
            !msg.chatbot_id || msg.chatbot_id === chatbotId
          )
          
          // Only set messages if we have actual history for this chatbot
          if (validMessages.length > 0) {
            setMessages(validMessages)
            setError(null)
          }
        }
      },
      onError: (err) => {
        console.error('Failed to load chat history:', err)
        // Don't set error for history loading failure
      }
    }
  )
  
  return {
    messages: data || [],
    isLoading,
    error,
    refresh: mutate
  }
}

// Hook to send a message
export const useSendMessage = () => {
  const { 
    sessionId, 
    setSessionId, 
    addMessage, 
    setIsSending, 
    setError 
  } = usePublicChatStore()
  
  const sendMessage = async (message: string, chatbotId: string) => {
    setIsSending(true)
    setError(null)
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      session_id: sessionId || 'new',
      message: message,
      message_type: 'user',
      created_at: new Date().toISOString(),
      chatbot_id: chatbotId
    }
    
    addMessage(userMessage)
    
    try {
      const response = await apiRequest.post<SendMessageResponse>(
        '/api/chat',
        {
          message,
          chatbotId,
          sessionId
        },
        { suppressToast: true }
      )
      
      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        session_id: sessionId || response.sessionId,
        message: '',
        response: response.message,
        message_type: 'assistant',
        created_at: response.timestamp,
        chatbot_id: chatbotId
      }
      
      addMessage(assistantMessage)
      
      // Store session ID if new
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId)
        sessionStorage.setItem(`chat_session_${chatbotId}`, response.sessionId)
      }
      
      return { success: true }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message. Please try again.')
      return { success: false, error: err }
    } finally {
      setIsSending(false)
    }
  }
  
  return { sendMessage }
}
