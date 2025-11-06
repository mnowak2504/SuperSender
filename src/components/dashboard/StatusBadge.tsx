interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending'
  label: string
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ status, label, size = 'md' }: StatusBadgeProps) {
  const statusClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${statusClasses[status]} ${sizeClasses[size]}`}
    >
      {label}
    </span>
  )
}

