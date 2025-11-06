import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SalesDashboardContent from '@/components/dashboard/SalesDashboardContent'

export const runtime = 'nodejs'

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <SalesDashboardContent />
}
