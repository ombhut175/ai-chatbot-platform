"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Bot, User, AlertCircle, RefreshCw, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { usePublicChatStore } from '@/store/publicChatStore'
import { useChatHistory, useSendMessage } from '@/hooks/usePublicChat'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface PublicChatPageProps {
  preloadedChatbot?: any
}

export default function PublicChatPage({ preloadedChatbot }: PublicChatPageProps = {}) {
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
  const isInitialMount = useRef(true)

  // Reset state when chatbotId changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      previousChatbotIdRef.current = chatbotId
      return
    }
    
    if (previousChatbotIdRef.current !== chatbotId) {
      // Different chatbot, reset everything immediately
      resetChat()
      chatbotLoadedRef.current = false
      
      // Clear session storage for the old chatbot
      if (previousChatbotIdRef.current) {
        sessionStorage.removeItem(`chat_session_${previousChatbotIdRef.current}`)
      }
      
      previousChatbotIdRef.current = chatbotId
    }
  }, [chatbotId, resetChat])

  // Use preloaded chatbot if available
  useEffect(() => {
    if (preloadedChatbot && preloadedChatbot.id === chatbotId && !chatbot) {
      setChatbot(preloadedChatbot)
      chatbotLoadedRef.current = true
      setIsLoading(false)
    }
  }, [preloadedChatbot, chatbotId, chatbot, setChatbot, setIsLoading])

  // Load chatbot details using fetch (public endpoint doesn't require auth)
  useEffect(() => {
    const loadChatbot = async () => {
      if (!chatbotId) {
        setError('No chatbot ID provided')
        return
      }

      // Skip if we have a preloaded chatbot
      if (preloadedChatbot && preloadedChatbot.id === chatbotId) {
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
  }, [chatbotId, chatbot?.id, preloadedChatbot, setError, setIsLoading, setChatbot])

  // Add welcome message only when appropriate
  useEffect(() => {
    if (chatbot?.welcome_message && 
        messages.length === 0 && 
        !sessionId && 
        !isLoadingHistory &&
        chatbotLoadedRef.current &&
        chatbot.id === chatbotId) { // Ensure chatbot matches current chatbotId
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
    if (chatbotId && chatbotLoadedRef.current) {
      const storedSessionId = sessionStorage.getItem(`chat_session_${chatbotId}`)
      if (storedSessionId && !sessionId) {
        // Validate that this session is for the current chatbot
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
      <div className="h-full w-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
      <div className="h-full w-full flex items-center justify-center p-4">
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
      transition={{ duration: 0.5 }}
      className="h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gradient-to-br from-pink-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <Card className="relative z-10 w-full h-full max-w-5xl mx-auto flex flex-col shadow-2xl border-0 bg-white/10 backdrop-blur-xl overflow-hidden m-4 rounded-3xl">
        {/* Glass Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="p-6 bg-white/20 backdrop-blur-xl border-b border-white/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-xl opacity-70" />
                <div className="relative p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
                  <Bot className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <div>
                <motion.h2 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-bold text-white drop-shadow-lg"
                >
                  {chatbot?.name || 'AI Assistant'}
                </motion.h2>
                {chatbot?.description && (
                  <motion.p 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-white/80 text-sm mt-1"
                  >
                    {chatbot.description}
                  </motion.p>
                )}
              </div>
            </div>
            <motion.div 
              className="flex items-center gap-3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="text-white hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
                  title="New Chat"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </motion.div>
              <div className="h-8 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm font-medium">Online</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Messages Area */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-6 bg-black/10 backdrop-blur-sm">
          <AnimatePresence mode="popLayout">
            <div className="space-y-6 max-w-4xl mx-auto">
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
                      "flex gap-4 max-w-[85%]",
                      message.message_type === 'user' ? 'flex-row-reverse ml-auto' : 'flex-row'
                    )}
                  >
                    <motion.div 
                      className="flex-shrink-0"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {message.message_type === 'user' ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-lg opacity-70" />
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl border-2 border-white/20">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-lg opacity-70" />
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-2xl border-2 border-white/20">
                            <Bot className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                    <div className="space-y-2 min-w-0 flex-1">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={cn(
                          "rounded-3xl px-6 py-4 shadow-xl transition-all duration-300 hover:shadow-2xl relative overflow-hidden",
                          message.message_type === 'user'
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white ml-4'
                            : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 mr-4'
                        )}
                      >
                        {message.message_type === 'user' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                        )}
                        {message.message_type === 'assistant' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20" />
                        )}
                        <p className="whitespace-pre-wrap break-words relative z-10 text-base leading-relaxed">
                          {message.message_type === 'user' ? message.message : message.response}
                        </p>
                      </motion.div>
                      <div className={cn(
                        "flex items-center gap-3 text-xs",
                        message.message_type === 'user' ? 'justify-end' : 'justify-start'
                      )}>
                        <span className="text-white/70 font-medium">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </span>
                        {message.tokens_used && (
                          <span className="text-white/60 bg-white/10 px-2 py-1 rounded-full">
                            {message.tokens_used} tokens
                          </span>
                        )}
                        {message.response_time_ms && (
                          <span className="text-white/60 bg-white/10 px-2 py-1 rounded-full">
                            {(message.response_time_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full blur-lg opacity-70 animate-pulse" />
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-2xl border-2 border-white/20">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 rounded-3xl px-6 py-4 shadow-xl mr-4">
                      <div className="flex items-center gap-4">
                        <div className="flex space-x-1">
                          <motion.div 
                            className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              delay: 0
                            }}
                          />
                          <motion.div 
                            className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              delay: 0.2
                            }}
                          />
                          <motion.div 
                            className="w-3 h-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              delay: 0.4
                            }}
                          />
                        </div>
                        <span className="text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="flex items-center justify-center gap-3 text-sm bg-red-500/20 backdrop-blur-xl border border-red-300/30 rounded-2xl p-4 shadow-xl mx-4"
                  >
                    <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                    <span className="text-white font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>
          </AnimatePresence>
        </ScrollArea>

        {/* Glass Input Section */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="p-6 bg-white/10 backdrop-blur-xl border-t border-white/20"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <motion.div
                whileFocus={{ scale: 1.02 }}
                className="relative"
              >
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything... ✨"
                  disabled={isSending}
                  className="w-full px-6 py-4 pr-16 text-base bg-white/20 backdrop-blur-xl border-2 border-white/30 rounded-3xl transition-all duration-300 focus:border-white/50 focus:ring-4 focus:ring-white/20 hover:border-white/40 text-white placeholder:text-white/60 shadow-2xl"
                />
                <AnimatePresence>
                  {inputMessage.length > 0 && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-white/60 bg-white/10 px-2 py-1 rounded-full"
                    >
                      {inputMessage.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl blur-xl opacity-70"
                animate={{
                  opacity: inputMessage.trim() && !isSending ? 1 : 0.3
                }}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="relative h-14 w-14 rounded-2xl shadow-2xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-2 border-white/20"
              >
                <AnimatePresence mode="wait">
                  {isSending ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 180 }}
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="send"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                    >
                      <Send className="w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </form>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between mt-3 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-4">
              <p className="text-xs text-white/60 font-medium">
                Press Enter to send • Shift+Enter for new line
              </p>
              <div className="h-3 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-white/60">Powered by AI</span>
              </div>
            </div>
            {messages.length > 0 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-xl backdrop-blur-sm"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </Card>
    </motion.div>
  )
}
