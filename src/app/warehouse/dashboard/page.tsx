import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import WarehouseDashboardContent from '@/components/dashboard/WarehouseDashboardContent'

export const runtime = 'nodejs'

export default async function WarehouseDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <WarehouseDashboardContent />
}

