import React from "react"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"

/**
 * Standardized Success Message Component
 * Always shows green styling for successful operations
 */
export function SuccessMessage({ message, onClose }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
      <div className="size-4 bg-green-600 rounded-full flex items-center justify-center">
        <CheckCircle className="size-3 text-white" />
      </div>
      <div className="text-sm text-green-600 dark:text-green-400 flex-1">
        {typeof message === 'string' ? (
          message.split('\n').map((line, index) => (
            <div key={index} className={index > 0 ? 'text-xs mt-1' : ''}>
              {line}
            </div>
          ))
        ) : (
          message
        )}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-green-400 hover:text-green-600 ml-2"
        >
          <XCircle className="size-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Standardized Error Message Component  
 * Always shows red styling for errors/failures
 */
export function ErrorMessage({ message, onClose }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md">
      <AlertCircle className="size-4 text-red-600 shrink-0" />
      <div className="text-sm text-red-600 dark:text-red-400 flex-1">
        {typeof message === 'string' ? (
          message.split('\n').map((line, index) => (
            <div key={index} className={index > 0 ? 'text-xs mt-1' : ''}>
              {line}
            </div>
          ))
        ) : (
          message
        )}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-red-400 hover:text-red-600 ml-2"
        >
          <XCircle className="size-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Standardized Info Message Component
 * Shows blue styling for informational messages
 */
export function InfoMessage({ message, onClose }) {
  if (!message) return null

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
      <AlertCircle className="size-4 text-blue-600 shrink-0" />
      <div className="text-sm text-blue-600 dark:text-blue-400 flex-1">
        {typeof message === 'string' ? (
          message.split('\n').map((line, index) => (
            <div key={index} className={index > 0 ? 'text-xs mt-1' : ''}>
              {line}
            </div>
          ))
        ) : (
          message
        )}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="text-blue-400 hover:text-blue-600 ml-2"
        >
          <XCircle className="size-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Auto-disappearing Success/Error Messages Hook
 * Automatically clears messages after a timeout
 */
export function useAutoMessage(defaultTimeout = 5000) {
  const [message, setMessage] = React.useState("")
  const [type, setType] = React.useState("success") // "success" | "error" | "info"
  const timeoutRef = React.useRef(null)

  const showMessage = React.useCallback((newMessage, messageType = "success", timeout = defaultTimeout) => {
    setMessage(newMessage)
    setType(messageType)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setMessage("")
    }, timeout)
  }, [defaultTimeout])

  const clearMessage = React.useCallback(() => {
    setMessage("")
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const MessageComponent = React.useMemo(() => {
    if (!message) return null
    
    switch (type) {
      case "error":
        return <ErrorMessage message={message} onClose={clearMessage} />
      case "info":
        return <InfoMessage message={message} onClose={clearMessage} />
      case "success":
      default:
        return <SuccessMessage message={message} onClose={clearMessage} />
    }
  }, [message, type, clearMessage])

  return {
    message,
    type,
    showMessage,
    clearMessage,
    MessageComponent
  }
}

export default { SuccessMessage, ErrorMessage, InfoMessage, useAutoMessage }