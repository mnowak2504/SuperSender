'use client'

import { useState } from 'react'
import { Languages } from 'lucide-react'

interface TranslationNoteProps {
  originalText: string
  translatedText: string
  sourceLang: string
  targetLang: string
  className?: string
}

export default function TranslationNote({
  originalText,
  translatedText,
  sourceLang,
  targetLang,
  className = '',
}: TranslationNoteProps) {
  const [showOriginal, setShowOriginal] = useState(false)

  const langNames: Record<string, string> = {
    en: 'English',
    pl: 'Polish',
    de: 'German',
    fr: 'French',
    it: 'Italian',
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <Languages className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm text-gray-700">
            {showOriginal ? originalText : translatedText}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {showOriginal 
              ? `Original (${langNames[sourceLang] || sourceLang})`
              : `Translated from ${langNames[sourceLang] || sourceLang}`
            }
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              {showOriginal ? 'Show translated' : 'Show original'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

