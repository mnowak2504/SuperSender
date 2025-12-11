'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslations } from '@/lib/i18n'

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  translations: Record<string, string>
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children, defaultLang = 'en' }: { children: ReactNode; defaultLang?: Language }) {
  // Initialize with language from localStorage if available, otherwise use defaultLang
  const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app-language') as Language | null
      if (savedLang && ['en', 'de', 'fr', 'it', 'pl'].includes(savedLang)) {
        return savedLang
      }
    }
    return defaultLang
  }

  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    // Try to get language from localStorage on mount (client-side only)
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app-language') as Language | null
      if (savedLang && ['en', 'de', 'fr', 'it', 'pl'].includes(savedLang)) {
        setLanguageState(savedLang)
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('app-language', lang)
  }

  const translations = getTranslations(language)
  const t = (key: string) => translations[key] || key

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

