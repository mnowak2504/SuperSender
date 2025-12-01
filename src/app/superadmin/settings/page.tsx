import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SuperAdminSettingsContent from '@/components/superadmin/SuperAdminSettingsContent'

export const runtime = 'nodejs'

export default async function SuperAdminSettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <SuperAdminSettingsContent />
}

