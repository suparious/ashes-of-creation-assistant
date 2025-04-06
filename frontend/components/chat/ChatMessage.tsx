'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/types/chat'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const timeString = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit'
  }) : ''

  return (
    <div className={`chat-message ${message.role}`}>
      <div className="flex items-start">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          {message.role === 'user' ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center mb-1">
            <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
              {message.role === 'user' ? 'You' : 'Ashes Assistant'}
            </p>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{timeString}</span>
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        
        {/* Actions for assistant messages only */}
        {message.role === 'assistant' && (
          <div className="ml-2 flex-shrink-0">
            <button
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
