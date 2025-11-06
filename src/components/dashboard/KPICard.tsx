import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  size?: 'default' | 'large'
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  color = 'blue',
  size = 'default',
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  const textSize = size === 'large' ? 'text-3xl' : 'text-2xl'
  const cardPadding = size === 'large' ? 'p-6' : 'p-4'

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${cardPadding} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend && (
          <div className={`text-xs font-medium ${
            trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive !== false ? '↑' : '↓'} {trend.value}% {trend.label}
          </div>
        )}
      </div>
      <div className="mb-2">
        <p className={`${textSize} font-bold text-gray-900`}>{value}</p>
        <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

