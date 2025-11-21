import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PricingManagementContent from '@/components/superadmin/PricingManagementContent'

export const runtime = 'nodejs'

export default async function SetupFeePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return <PricingManagementContent />
}

