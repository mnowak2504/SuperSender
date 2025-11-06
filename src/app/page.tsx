import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

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

  // If not logged in, redirect to landing page (default: English)
  redirect('/landing/en')
}
