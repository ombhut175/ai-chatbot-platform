"use client"

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, Bot, User } from 'lucide-react'
import { format } from 'date-fns'

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

export default function PublicChatPage() {
  const searchParams = useSearchParams()
  const chatbotId = searchParams?.get('chatbotId')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatbot, setChatbot] = useState<ChatbotDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load chatbot details
  useEffect(() => {
    const loadChatbot = async () => {
      if (!chatbotId) {
        setError('No chatbot ID provided')
        return
      }

      try {
        const response = await fetch(`/api/chatbots/${chatbotId}`)
        const data = await response.json()

        if (data.success && data.data) {
          setChatbot(data.data)
          
          // Add welcome message if exists
          if (data.data.welcome_message) {
            setMessages([{
              id: 'welcome',
              session_id: sessionId || 'new',
              message: '',
              response: data.data.welcome_message,
              message_type: 'assistant',
              created_at: new Date().toISOString(),
              chatbot_id: chatbotId
            }])
          }
        } else {
          setError('Failed to load chatbot')
        }
      } catch (err) {
        console.error('Failed to load chatbot:', err)
        setError('Failed to load chatbot')
      }
    }

    loadChatbot()
  }, [chatbotId])

  // Load chat history if session exists
  useEffect(() => {
    const loadHistory = async () => {
      const storedSessionId = sessionStorage.getItem(`chat_session_${chatbotId}`)
      if (storedSessionId && chatbotId) {
        setSessionId(storedSessionId)
        
        try {
          const response = await fetch(`/api/chat/public?sessionId=${storedSessionId}&chatbotId=${chatbotId}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            setMessages(data.data)
          }
        } catch (err) {
          console.error('Failed to load chat history:', err)
        }
      }
    }

    if (chatbotId) {
      loadHistory()
    }
  }, [chatbotId])

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatbotId || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      session_id: sessionId || 'new',
      message: inputMessage,
      message_type: 'user',
      created_at: new Date().toISOString(),
      chatbot_id: chatbotId
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          chatbotId,
          sessionId
        })
      })

      const data = await response.json()

      if (data.success && data.data) {
        const assistantMessage: Message = {
          id: Date.now().toString() + '_assistant',
          session_id: sessionId || 'new',
          message: '',
          response: data.data.message,
          message_type: 'assistant',
          created_at: data.data.timestamp,
          chatbot_id: chatbotId
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Store session ID
        if (data.data.sessionId && !sessionId) {
          setSessionId(data.data.sessionId)
          sessionStorage.setItem(`chat_session_${chatbotId}`, data.data.sessionId)
        }
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!chatbotId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">No Chatbot Selected</h2>
          <p className="text-muted-foreground">
            Please provide a valid chatbot ID in the URL parameters.
          </p>
        </Card>
      </div>
    )
  }

  const theme = chatbot?.theme || {
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937'
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <Card className="max-w-2xl w-full h-[600px] flex flex-col shadow-xl">
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center gap-3"
          style={{ backgroundColor: theme.primaryColor, color: '#FFFFFF' }}
        >
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-semibold">{chatbot?.name || 'Chatbot'}</h2>
            {chatbot?.description && (
              <p className="text-sm opacity-90">{chatbot.description}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.message_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.message_type === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.message_type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                      style={
                        message.message_type === 'assistant' 
                          ? { backgroundColor: '#F3F4F6', color: theme.textColor }
                          : undefined
                      }
                    >
                      <p className="whitespace-pre-wrap">{message.message_type === 'user' ? message.message : message.response}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-center text-sm text-destructive">
                {error}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              style={{ backgroundColor: theme.primaryColor }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
