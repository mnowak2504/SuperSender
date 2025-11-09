'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ClientPageHeaderProps {
  title?: string
  showBackButton?: boolean
  backButtonHref?: string
  backButtonLabel?: string
}

export default function ClientPageHeader({
  title,
  showBackButton = false,
  backButtonHref = '/client/dashboard',
  backButtonLabel = 'Dashboard',
}: ClientPageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {title && (
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>
          )}
          {showBackButton && (
            <Link
              href={backButtonHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to {backButtonLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

