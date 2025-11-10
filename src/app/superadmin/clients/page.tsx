import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SuperAdminClientsContent from '@/components/superadmin/SuperAdminClientsContent'

export const runtime = 'nodejs'

export default async function SuperAdminClientsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <SuperAdminClientsContent />
}

