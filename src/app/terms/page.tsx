import { Metadata } from 'next'
import TermsContent from '@/components/terms/TermsContent'
import MainNavigation from '@/components/navigation/MainNavigation'
import { getTranslations } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Terms & Conditions | Supersender by MAK Consulting',
  description: 'Terms of Service applicable to the Supersender Platform and MAK Consulting Logistics Services',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <MainNavigation />
      <div className="pt-16">
        <TermsContent />
      </div>
    </div>
  )
}

