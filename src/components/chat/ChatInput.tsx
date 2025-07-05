import React, { useRef, useEffect } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  theme?: {
    primaryColor: string
  }
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  value, 
  onChange, 
  onSend, 
  disabled, 
  placeholder = "Type your message...",
  theme
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])
  
  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend()
      }
    }
  }
  
  return (
    <div className="p-4 border-t bg-white dark:bg-gray-900">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'min-h-[44px] max-h-[200px] pr-12 py-3 resize-none',
              'border-gray-200 dark:border-gray-700',
              'focus:ring-2 focus:ring-offset-2 transition-all',
              'placeholder:text-gray-400'
            )}
            style={{ 
              focusRingColor: theme?.primaryColor 
            } as any}
          />
          
          {/* Character count */}
          {value.length > 0 && (
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {value.length}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 text-gray-500 hover:text-gray-700"
            disabled={disabled}
            title="Add attachment (coming soon)"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 text-gray-500 hover:text-gray-700"
            disabled={disabled}
            title="Add emoji (coming soon)"
          >
            <Smile className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            size="icon"
            className={cn(
              'h-11 w-11 transition-all',
              value.trim() && !disabled
                ? 'opacity-100 hover:scale-105'
                : 'opacity-50'
            )}
            style={{ 
              backgroundColor: theme?.primaryColor || '#3B82F6',
              color: 'white'
            }}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {disabled && <span className="text-orange-500">Please wait...</span>}
      </div>
    </div>
  )
}
