import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/auth'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">MAK Consulting - Superadmin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/superadmin/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/superadmin/users"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Użytkownicy
                </Link>
                <Link
                  href="/superadmin/clients"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Klienci
                </Link>
                <Link
                  href="/superadmin/pricing/setup-fee"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Setup Fee & Vouchery
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-md"
              >
                Biuro
              </Link>
              <Link
                href="/warehouse/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-md"
              >
                Magazyn
              </Link>
              <span className="text-sm text-gray-700">{session.user?.email}</span>
              <a
                href="/api/auth/signout"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Wyloguj
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

