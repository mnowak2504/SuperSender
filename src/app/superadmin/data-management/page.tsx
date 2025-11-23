import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SuperAdminDataManagementContent from '@/components/superadmin/SuperAdminDataManagementContent'

export const runtime = 'nodejs'

export default async function SuperAdminDataManagementPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <SuperAdminDataManagementContent />
}

