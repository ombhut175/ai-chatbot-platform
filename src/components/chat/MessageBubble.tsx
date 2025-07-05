import React from 'react'
import { format } from 'date-fns'
import { Bot, User, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: {
    id: string
    message: string
    response?: string | null
    message_type: 'user' | 'assistant'
    created_at: string
    tokens_used?: number | null
    response_time_ms?: number | null
  }
  theme?: {
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme }) => {
  const [copied, setCopied] = React.useState(false)
  const content = message.message_type === 'user' ? message.message : message.response
  
  const handleCopy = async () => {
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  return (
    <div
      className={cn(
        'group flex gap-3 py-4 px-4 transition-all',
        message.message_type === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 order-1',
        message.message_type === 'user' && 'order-2'
      )}>
        {message.message_type === 'user' ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <User className="w-6 h-6 text-white" />
          </div>
        ) : (
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
            style={{ 
              background: theme?.primaryColor 
                ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}dd)`
                : 'linear-gradient(135deg, #3B82F6, #3B82F6dd)'
            }}
          >
            <Bot className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      
      {/* Message Content */}
      <div className={cn(
        'flex flex-col max-w-[70%] order-2',
        message.message_type === 'user' && 'order-1 items-end'
      )}>
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 shadow-sm transition-all',
            message.message_type === 'user'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
          )}
          style={
            message.message_type === 'assistant' && theme
              ? { 
                  backgroundColor: '#F3F4F6', 
                  color: theme.textColor,
                  borderLeft: `3px solid ${theme.primaryColor}`
                }
              : undefined
          }
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </p>
          
          {/* Copy button for assistant messages */}
          {message.message_type === 'assistant' && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity',
                'bg-white dark:bg-gray-700 shadow-sm hover:shadow-md'
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
        
        {/* Metadata */}
        <div className={cn(
          'flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400',
          message.message_type === 'user' && 'justify-end'
        )}>
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
          {message.response_time_ms && (
            <>
              <span>•</span>
              <span>{(message.response_time_ms / 1000).toFixed(1)}s</span>
            </>
          )}
          {message.tokens_used && (
            <>
              <span>•</span>
              <span>{message.tokens_used} tokens</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
