'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { languages, type Language, getTranslations } from '@/lib/i18n'
import { useLanguage } from '@/lib/use-language'

interface MainNavigationProps {
  currentLang?: Language
  useLanguageContext?: boolean
}

export default function MainNavigation({ currentLang: propLang, useLanguageContext = true }: MainNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [clientLang, setClientLang] = useState<Language>('en')
  
  // Use language context if available and requested, otherwise use prop
  let langContext: ReturnType<typeof useLanguage> | undefined
  if (useLanguageContext) {
    try {
      langContext = useLanguage()
    } catch {
      // Not in LanguageProvider context - will use propLang or localStorage
    }
  }
  
  // Get language from context, prop, or localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('app-language') as Language | null
      if (savedLang && ['en', 'de', 'fr', 'it', 'pl'].includes(savedLang)) {
        setClientLang(savedLang)
      }
    }
  }, [])
  
  const currentLang = langContext?.language || propLang || clientLang || 'en'
  const translations = langContext?.translations || getTranslations(currentLang)

  const handleLanguageChange = (newLang: Language) => {
    // Save to localStorage first
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-language', newLang)
    }
    
    // Update context if available
    if (langContext) {
      langContext.setLanguage(newLang)
    }
    
    // Update local state
    setClientLang(newLang)
    
    // Redirect based on current page
    if (pathname?.startsWith('/landing/')) {
      // For landing pages, navigate to new language version
      router.push(`/landing/${newLang}`)
    } else if (pathname === '/about' || pathname === '/process') {
      // For about/process pages, stay on same page but refresh to apply new language
      // The LanguageProvider will pick up the new language from localStorage
      router.refresh()
    } else {
      // For other pages, redirect to landing page with new language
      router.push(`/landing/${newLang}`)
    }
  }

  const isLandingPage = pathname?.startsWith('/landing/')
  const isAboutPage = pathname === '/about'

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href={`/landing/${currentLang}`}
              className="flex items-center gap-3"
            >
              <Image
                src="/logo-mak.png"
                alt="MAK Consulting"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-tight">SUPERSENDER</span>
                <span className="text-xs text-gray-600 leading-tight">by MAK Consulting</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href={`/landing/${currentLang}`}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {translations.nav_home}
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition">
              {translations.nav_about}
            </Link>
            <Link href="/process" className="text-gray-700 hover:text-blue-600 transition">
              {translations.nav_process}
            </Link>
            {isLandingPage ? (
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition">
                {translations.nav_pricing}
              </a>
            ) : (
              <Link href={`/landing/${currentLang}#pricing`} className="text-gray-700 hover:text-blue-600 transition">
                {translations.nav_pricing}
              </Link>
            )}
            <Link href={`/landing/${currentLang}/transport-costs`} className="text-gray-700 hover:text-blue-600 transition">
              {translations.nav_transport_costs}
            </Link>
            
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={currentLang}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pl-8 text-sm text-gray-700 cursor-pointer hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName}
                    </option>
                  ))}
                </select>
                <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  {languages.find(l => l.code === currentLang)?.flag}
                </span>
              </div>
            
            <Link
              href="/auth/signin"
              className="text-gray-700 hover:text-blue-600 transition"
            >
              {translations.nav_signin}
            </Link>
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              {translations.nav_signup}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-gray-700 hover:text-blue-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <Link 
                href={`/landing/${currentLang}`}
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                {translations.nav_home}
              </Link>
              <Link 
                href="/about" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                {translations.nav_about}
              </Link>
              <Link 
                href="/process" 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                {translations.nav_process}
              </Link>
              {isLandingPage ? (
                <a 
                  href="#pricing" 
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {translations.nav_pricing}
                </a>
              ) : (
                <Link 
                  href={`/landing/${currentLang}#pricing`} 
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {translations.nav_pricing}
                </Link>
              )}
              <Link 
                href={`/landing/${currentLang}/transport-costs`} 
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                {translations.nav_transport_costs}
              </Link>
              
              <div className="px-3 py-2">
                <select
                  value={currentLang}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 pl-8 text-sm text-gray-700"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName}
                    </option>
                  ))}
                </select>
                <span className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {languages.find(l => l.code === currentLang)?.flag}
                </span>
              </div>
              
              <Link
                href="/auth/signin"
                className="block px-3 py-2 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                {translations.nav_signin}
              </Link>
              <Link
                href="/auth/signup"
                className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
                onClick={() => setShowMobileMenu(false)}
              >
                {translations.nav_signup}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

