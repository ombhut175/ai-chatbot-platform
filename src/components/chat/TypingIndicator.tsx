import React from 'react'
import { Bot } from 'lucide-react'

interface TypingIndicatorProps {
  theme?: {
    primaryColor: string
  }
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ theme }) => {
  return (
    <div className="flex gap-3 py-4 px-4">
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
      
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
