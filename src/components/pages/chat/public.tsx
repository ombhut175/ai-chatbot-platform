"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { usePublicChatStore } from '@/store/publicChatStore'
import { useChatHistory, useSendMessage } from '@/hooks/usePublicChat'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function PublicChatPage() {
  const searchParams = useSearchParams()
  const chatbotId = searchParams?.get('chatbotId')
  
  // Zustand store
  const {
    messages,
    inputMessage,
    sessionId,
    chatbot,
    error,
    isSending,
    isLoading,
    setInputMessage,
    setSessionId,
    resetChat,
    setChatbot,
    setError,
    setIsLoading,
    addMessage
  } = usePublicChatStore()
  
  // SWR hooks - only use for chat history since chatbot fetch requires auth
  const { isLoading: isLoadingHistory, refresh: refreshHistory } = useChatHistory(sessionId, chatbotId ?? null)
  const { sendMessage } = useSendMessage()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Smooth scroll to bottom with debouncing
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages, scrollToBottom])

  // Track if we've loaded the chatbot
  const chatbotLoadedRef = useRef(false)
  const previousChatbotIdRef = useRef<string | null>(null)

  // Reset state when chatbotId changes
  useEffect(() => {
    if (previousChatbotIdRef.current && previousChatbotIdRef.current !== chatbotId) {
      // Different chatbot, reset everything
      resetChat()
      chatbotLoadedRef.current = false
      if (chatbotId) {
        sessionStorage.removeItem(`chat_session_${previousChatbotIdRef.current}`)
      }
    }
    previousChatbotIdRef.current = chatbotId
  }, [chatbotId, resetChat])

  // Load chatbot details using fetch (public endpoint doesn't require auth)
  useEffect(() => {
    const loadChatbot = async () => {
      if (!chatbotId) {
        setError('No chatbot ID provided')
        return
      }

      // Skip if already loaded for this chatbot
      if (chatbotLoadedRef.current && chatbot?.id === chatbotId) {
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/chatbots/details/${chatbotId}`)
        const data = await response.json()

        if (data.success && data.data) {
          setChatbot(data.data)
          chatbotLoadedRef.current = true
        } else {
          setError(data.error || 'Failed to load chatbot')
        }
      } catch (err) {
        console.error('Failed to load chatbot:', err)
        setError('Failed to load chatbot')
      } finally {
        setIsLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId, chatbot?.id, setError, setIsLoading, setChatbot])

  // Add welcome message only when appropriate
  useEffect(() => {
    if (chatbot?.welcome_message && 
        messages.length === 0 && 
        !sessionId && 
        !isLoadingHistory &&
        chatbotLoadedRef.current) {
      const welcomeMessage = {
        id: `welcome_${Date.now()}`,
        session_id: 'new',
        message: '',
        response: chatbot.welcome_message,
        message_type: 'assistant' as const,
        created_at: new Date().toISOString(),
        chatbot_id: chatbotId!
      }
      addMessage(welcomeMessage)
    }
  }, [chatbot, messages.length, sessionId, isLoadingHistory, chatbotId, addMessage])

  // Initialize session from storage
  useEffect(() => {
    if (chatbotId) {
      const storedSessionId = sessionStorage.getItem(`chat_session_${chatbotId}`)
      if (storedSessionId && !sessionId) {
        setSessionId(storedSessionId)
      }
    }
  }, [chatbotId, sessionId, setSessionId])

  // Focus input on mount and after sending messages
  useEffect(() => {
    if (!isSending && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSending])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Escape to clear input
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setInputMessage('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setInputMessage])

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !chatbotId || isSending) return

    const currentMessage = inputMessage
    setInputMessage('') // Clear input immediately for better UX
    
    await sendMessage(currentMessage, chatbotId)
    
    // Focus back to input after sending
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [inputMessage, chatbotId, isSending, sendMessage, setInputMessage])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleRefresh = useCallback(() => {
    refreshHistory()
  }, [refreshHistory])

  const handleNewChat = useCallback(() => {
    if (chatbotId) {
      sessionStorage.removeItem(`chat_session_${chatbotId}`)
      resetChat()
      if (chatbot?.welcome_message) {
        const welcomeMessage = {
              id: `welcome-new_${Date.now()}`,
          session_id: 'new',
          message: '',
          response: chatbot.welcome_message,
          message_type: 'assistant' as const,
          created_at: new Date().toISOString(),
          chatbot_id: chatbotId
        }
        addMessage(welcomeMessage)
      }
    }
  }, [chatbotId, chatbot, resetChat, addMessage])

  // Error states
  if (!chatbotId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full p-8 text-center shadow-xl">
            <div className="mb-4">
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Chatbot Selected</h2>
            <p className="text-muted-foreground">
              Please provide a valid chatbot ID in the URL parameters.
            </p>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (isLoading && !chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chatbot...</p>
        </motion.div>
      </div>
    )
  }

  const theme = chatbot?.theme || {
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937'
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <Card className="max-w-2xl w-full h-[600px] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center justify-between transition-all duration-300"
          style={{ backgroundColor: theme.primaryColor, color: '#FFFFFF' }}
        >
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-semibold">{chatbot?.name || 'Chatbot'}</h2>
              {chatbot?.description && (
                <p className="text-sm opacity-90">{chatbot.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="text-white hover:bg-white/20"
              title="New Chat (Ctrl+N)"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                  className={cn(
                    "flex",
                    message.message_type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-2 max-w-[80%]",
                      message.message_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <motion.div 
                      className="flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {message.message_type === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <User className="w-5 h-5 text-primary-foreground" />
                        </div>
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                          style={{ backgroundColor: theme.primaryColor }}
                        >
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </motion.div>
                    <div className="space-y-1">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={cn(
                          "rounded-lg px-4 py-2 shadow-sm transition-all duration-200",
                          message.message_type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                        style={
                          message.message_type === 'assistant' 
                            ? { backgroundColor: '#F3F4F6', color: theme.textColor }
                            : undefined
                        }
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.message_type === 'user' ? message.message : message.response}
                        </p>
                      </motion.div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                        {message.tokens_used && (
                          <span className="text-xs text-muted-foreground">
                            • {message.tokens_used} tokens
                          </span>
                        )}
                        {message.response_time_ms && (
                          <span className="text-xs text-muted-foreground">
                            • {(message.response_time_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>
          </AnimatePresence>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-card">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Ctrl+K to focus)"
                disabled={isSending}
                className="flex-1 pr-10 transition-all duration-200 focus:ring-2 focus:ring-offset-2"
              />
              {inputMessage.length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {inputMessage.length}
                </span>
              )}
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ 
                  backgroundColor: !inputMessage.trim() || isSending ? '#e5e7eb' : theme.primaryColor,
                  color: !inputMessage.trim() || isSending ? '#6b7280' : '#FFFFFF'
                }}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </motion.div>
          </form>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Press Enter to send • Shift+Enter for new line
            </p>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
