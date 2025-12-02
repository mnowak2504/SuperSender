import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LocalCollectionQuotesContent from '@/components/admin/LocalCollectionQuotesContent'

export const runtime = 'nodejs'

export default async function LocalCollectionQuotesPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <LocalCollectionQuotesContent />
    </div>
  )
}

