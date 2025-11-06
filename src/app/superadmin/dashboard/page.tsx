import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SuperAdminDashboardContent from '@/components/dashboard/SuperAdminDashboardContent'

export const runtime = 'nodejs'

export default async function SuperAdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <SuperAdminDashboardContent />
}
