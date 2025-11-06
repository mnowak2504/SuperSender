'use client'

import { Language, getTranslations } from '@/lib/i18n'
import MainNavigation from './MainNavigation'

interface MainNavigationWrapperProps {
  currentLang?: Language
}

export default function MainNavigationWrapper({ currentLang }: MainNavigationWrapperProps) {
  return <MainNavigation currentLang={currentLang} />
}

