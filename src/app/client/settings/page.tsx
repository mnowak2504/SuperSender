import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SettingsTabs from '@/components/settings/SettingsTabs'
import ClientHeader from '@/components/ClientHeader'

export const runtime = 'nodejs'

export default async function ClientSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'CLIENT') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader title="Settings" showBackButton={true} backButtonHref="/client/dashboard" backButtonLabel="Dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsTabs />
      </div>
    </div>
  )
}
