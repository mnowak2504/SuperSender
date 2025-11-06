import { notFound } from 'next/navigation'
import { languages, type Language, getTranslations } from '@/lib/i18n'
import LandingPageContent from './LandingPageContent'

export const runtime = 'nodejs'

export async function generateStaticParams() {
  return languages.map((lang) => ({
    lang: lang.code,
  }))
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const validLang = languages.find((l) => l.code === lang)

  if (!validLang) {
    notFound()
  }

  const t = getTranslations(lang as Language)

  return <LandingPageContent lang={lang as Language} translations={t} />
}

