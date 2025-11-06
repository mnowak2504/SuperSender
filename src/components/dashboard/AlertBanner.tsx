import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

interface AlertBannerProps {
  type: 'error' | 'warning' | 'info'
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
  onDismiss?: () => void
}

export default function AlertBanner({
  type,
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const typeClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className={`border rounded-lg p-4 ${typeClasses[type]}`}>
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          {message && <div className="text-sm mt-1 opacity-90">{message}</div>}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {action.label} →
            </button>
          )}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 flex-shrink-0 text-current opacity-50 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

