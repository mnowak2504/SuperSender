'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Language } from '@/lib/i18n'

export default function HomeRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Check localStorage for saved language preference
    const savedLang = localStorage.getItem('app-language') as Language | null
    const validLangs: Language[] = ['en', 'de', 'fr', 'it', 'pl']
    
    // Use saved language if valid, otherwise default to English
    const lang = (savedLang && validLangs.includes(savedLang)) ? savedLang : 'en'
    
    // Redirect to landing page with appropriate language
    router.replace(`/landing/${lang}`)
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

