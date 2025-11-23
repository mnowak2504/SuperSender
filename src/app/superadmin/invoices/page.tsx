import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SuperAdminInvoicesContent from '@/components/superadmin/SuperAdminInvoicesContent'

export const runtime = 'nodejs'

export default async function SuperAdminInvoicesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <SuperAdminInvoicesContent />
}

