import useSWR from 'swr'
import { apiRequest } from '@/helpers/request'
import { usePublicChatStore } from '@/store/publicChatStore'

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

interface SendMessageResponse {
  message: string
  sessionId: string
  timestamp: string
}

// Fetcher for chatbot details
const chatbotFetcher = async (url: string): Promise<ChatbotDetails> => {
  const response = await apiRequest.get<ChatbotDetails>(url)
  return response
}

// Fetcher for chat history
const chatHistoryFetcher = async (url: string): Promise<Message[]> => {
  const response = await apiRequest.get<Message[]>(url)
  return response
}

// Hook to fetch chatbot details - DEPRECATED: Use direct fetch in component for public access
// The /api/chatbots/[id] endpoint requires authentication which public chat doesn't have
export const useChatbot = (chatbotId: string | null) => {
  const { setChatbot, setError } = usePublicChatStore()
  
  const { data, error, isLoading, mutate } = useSWR(
    chatbotId ? `/api/chatbots/${chatbotId}` : null,
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
      ? `/api/chat/public?sessionId=${sessionId}&chatbotId=${chatbotId}` 
      : null,
    chatHistoryFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
      onSuccess: (data) => {
        if (data && data.length > 0) {
          // Only set messages if we have actual history
          setMessages(data)
          setError(null)
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
        '/api/chat/public',
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
