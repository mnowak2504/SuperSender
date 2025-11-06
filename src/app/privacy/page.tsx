import { Metadata } from 'next'
import PrivacyContent from '@/components/privacy/PrivacyContent'
import MainNavigation from '@/components/navigation/MainNavigation'

export const metadata: Metadata = {
  title: 'Privacy Policy | Supersender by MAK Consulting',
  description: 'Privacy Policy for Supersender Platform and MAK Consulting Logistics Services - GDPR compliant data protection information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <MainNavigation />
      <div className="pt-16">
        <PrivacyContent />
      </div>
    </div>
  )
}

