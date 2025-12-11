import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import HomeRedirect from '@/components/HomeRedirect'

export default async function Home() {
  const session = await auth()

  // If user is logged in, redirect to their dashboard
  if (session) {
    const role = (session.user as any)?.role
    switch (role) {
      case 'SUPERADMIN':
        redirect('/superadmin/dashboard')
      case 'CLIENT':
        redirect('/client/dashboard')
      case 'WAREHOUSE':
        redirect('/warehouse/dashboard')
      case 'ADMIN':
        redirect('/admin/dashboard')
      default:
        redirect('/auth/signin')
    }
  }

  // If not logged in, use client-side redirect to check localStorage for language preference
  // This allows us to respect user's language choice
  return <HomeRedirect />
}
