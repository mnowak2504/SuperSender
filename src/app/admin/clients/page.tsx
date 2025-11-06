import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ClientsCarePanel from '@/components/admin/ClientsCarePanel'

export const runtime = 'nodejs'

export default async function ClientsCarePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <ClientsCarePanel />
}

