import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  console.log('[CLIENT LAYOUT] Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    role: (session?.user as any)?.role,
  })

  if (!session) {
    console.log('[CLIENT LAYOUT] No session - redirecting to signin')
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'CLIENT') {
    console.log('[CLIENT LAYOUT] Wrong role - redirecting to unauthorized')
    redirect('/unauthorized')
  }

  console.log('[CLIENT LAYOUT] Session valid - rendering children')
  // NextAuth v5 doesn't require SessionProvider in server components
  return <>{children}</>
}

