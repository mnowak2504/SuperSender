'use client'

import { languages, type Language } from '@/lib/i18n'
import { useLanguage } from '@/lib/use-language'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pl-8 text-sm text-gray-700 cursor-pointer hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.nativeName}
          </option>
        ))}
      </select>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-base">
        {languages.find(l => l.code === language)?.flag}
      </span>
    </div>
  )
}

