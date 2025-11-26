import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TransportCostsContent from '@/components/superadmin/TransportCostsContent'

export const runtime = 'nodejs'

export default async function SuperAdminTransportCostsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <TransportCostsContent />
}

