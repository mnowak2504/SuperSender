'use client'

import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from '@/lib/use-language'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider defaultLang="en">
        {children}
      </LanguageProvider>
    </SessionProvider>
  )
}

