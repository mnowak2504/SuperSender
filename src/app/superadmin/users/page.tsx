import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UsersManagementContent from '@/components/superadmin/UsersManagementContent'

export const runtime = 'nodejs'

export default async function UsersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <UsersManagementContent />
}

