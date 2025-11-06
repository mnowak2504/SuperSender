import { Camera, Calculator, AlertTriangle, CheckCircle } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface QueueCardProps {
  id: string
  title: string
  subtitle?: string
  status: string
  priority?: 'high' | 'medium' | 'low'
  hasPhotos?: boolean
  hasCalculations?: boolean
  hasIssues?: boolean
  timeInQueue?: string
  onClick?: () => void
}

export default function QueueCard({
  id,
  title,
  subtitle,
  status,
  priority = 'medium',
  hasPhotos,
  hasCalculations,
  hasIssues,
  timeInQueue,
  onClick,
}: QueueCardProps) {
  const priorityColors = {
    high: 'border-red-300 bg-red-50',
    medium: 'border-yellow-300 bg-yellow-50',
    low: 'border-gray-200 bg-white',
  }

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all ${priorityColors[priority]}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
        </div>
        <StatusBadge status={status === 'completed' ? 'success' : status === 'error' ? 'error' : 'warning'} label={status} />
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs">
        {hasPhotos ? (
          <span className="flex items-center gap-1 text-green-600">
            <Camera className="w-3 h-3" />
            Photos OK
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            No photos
          </span>
        )}
        {hasCalculations ? (
          <span className="flex items-center gap-1 text-green-600">
            <Calculator className="w-3 h-3" />
            Data OK
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            Missing data
          </span>
        )}
        {hasIssues && (
          <span className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="w-3 h-3" />
            Issues
          </span>
        )}
        {timeInQueue && (
          <span className="text-gray-500 ml-auto">{timeInQueue}</span>
        )}
      </div>
    </div>
  )
}

