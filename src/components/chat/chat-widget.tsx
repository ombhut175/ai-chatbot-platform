"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, X, MessageCircle, Minimize2, Sparkles, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AnimatedCard } from "@/components/ui/animated-card"
import type { ChatMessage } from "@/lib/types"
import { apiRequest } from "@/helpers/request"

interface ChatWidgetProps {
  chatbotId: string
  position?: "bottom-right" | "bottom-left"
  theme?: "light" | "dark"
  size?: "small" | "medium" | "large"
}

export function ChatWidget({
  chatbotId,
  position = "bottom-right",
  theme = "light",
  size = "medium",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatbotData, setChatbotData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chatbot details and initialize session
  useEffect(() => {
    const loadChatbot = async () => {
      if (!chatbotId) return

      setIsLoading(true)
      setError(null)

      try {
        // First, get chatbot details
        const response = await fetch(`/api/chatbots/details/${chatbotId}`)
        const data = await response.json()

        if (data.success && data.data) {
          setChatbotData(data.data)
          
          // Check for existing session in localStorage
          const storedSessionId = localStorage.getItem(`chat_session_${chatbotId}`)
          if (storedSessionId) {
            setSessionId(storedSessionId)
            // Load chat history
            loadChatHistory(storedSessionId)
          } else if (data.data.welcome_message) {
            // Add welcome message if no existing session
            const welcomeMessage: ChatMessage = {
              id: "welcome_" + Date.now(),
              session_id: "new",
              message: "",
              response: data.data.welcome_message,
              message_type: "assistant",
              created_at: new Date().toISOString(),
              chatbot_id: chatbotId,
            }
            setMessages([welcomeMessage])
          }
        } else {
          setError(data.error || "Failed to load chatbot")
        }
      } catch (err) {
        console.error("Failed to load chatbot:", err)
        setError("Failed to load chatbot")
      } finally {
        setIsLoading(false)
      }
    }

    loadChatbot()
  }, [chatbotId])

  const loadChatHistory = async (sessionId: string) => {
    try {
      const response = await apiRequest.get<ChatMessage[]>(
        `/api/chat?sessionId=${sessionId}&chatbotId=${chatbotId}`
      )
      if (response && response.length > 0) {
        setMessages(response)
      }
    } catch (err) {
      console.error("Failed to load chat history:", err)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatbotId) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      session_id: sessionId || "new",
      message: inputValue,
      message_type: "user",
      created_at: new Date().toISOString(),
      chatbot_id: chatbotId,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)
    setError(null)

    try {
      const response = await apiRequest.post<{
        message: string
        sessionId: string
        timestamp: string
      }>("/api/chat", {
        message: userMessage.message,
        chatbotId,
        sessionId,
      })

      // Store session ID if new
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId)
        localStorage.setItem(`chat_session_${chatbotId}`, response.sessionId)
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        session_id: sessionId || response.sessionId,
        message: "",
        response: response.message,
        message_type: "assistant",
        created_at: response.timestamp,
        chatbot_id: chatbotId,
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      console.error("Failed to send message:", err)
      setError("Failed to send message. Please try again.")
      // Remove the user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const widgetSizes = {
    small: "w-80 h-96",
    medium: "w-96 h-[500px]",
    large: "w-[420px] h-[600px]",
  }

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  }

  if (!isOpen) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:scale-110 group relative overflow-hidden"
          size="icon"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
          {chatbotData && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />}
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <AnimatedCard
          className={`${widgetSizes[size]} backdrop-blur-xl bg-card/95 border-border/50 shadow-2xl transition-all duration-500 flex items-center justify-center`}
          glow
        >
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading chatbot...</p>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  if (error && !chatbotData) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <AnimatedCard
          className={`${widgetSizes[size]} backdrop-blur-xl bg-card/95 border-border/50 shadow-2xl transition-all duration-500 p-4`}
          glow
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-destructive">Error loading chatbot</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </AnimatedCard>
      </div>
    )
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatedCard
        className={`${widgetSizes[size]} backdrop-blur-xl bg-card/95 border-border/50 shadow-2xl ${isMinimized ? "h-16" : ""} transition-all duration-500`}
        glow
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {chatbotData?.name || "AI Assistant"}
              </p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 hover:scale-110"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex animate-in slide-in-from-bottom-2 duration-500 ${message.message_type === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg transition-all duration-300 hover:shadow-xl ${
                        message.message_type === "user"
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-4"
                          : "bg-gradient-to-r from-muted to-muted/80 text-foreground mr-4 border border-border/50"
                      }`}
                    >
                      {message.message_type === "user" ? message.message : message.response}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-gradient-to-r from-muted to-muted/80 border border-border/50 rounded-2xl px-4 py-3 text-sm mr-4 shadow-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-center animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm max-w-[80%]">
                      {error}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border/50 bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
              <div className="flex space-x-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 focus:bg-background focus:shadow-lg focus:shadow-primary/10"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/25"
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </AnimatedCard>
    </div>
  )
}
