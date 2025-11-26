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
            <div className="flex flex-1 min-w-0">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">MAK Consulting - Superadmin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4 sm:items-center sm:flex-shrink-0">
                <Link
                  href="/superadmin/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <Link
                  href="/superadmin/users"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap"
                >
                  Użytkownicy
                </Link>
                <Link
                  href="/superadmin/clients"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap"
                >
                  Klienci
                </Link>
                <Link
                  href="/superadmin/pricing/setup-fee"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap"
                >
                  Setup Fee & Vouchery
                </Link>
                <Link
                  href="/superadmin/invoices"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap"
                >
                  Faktury
                </Link>
                <Link
                  href="/superadmin/data-management"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium whitespace-nowrap"
                >
                  Zarządzanie danymi
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-md whitespace-nowrap"
              >
                Biuro
              </Link>
              <Link
                href="/warehouse/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-md whitespace-nowrap"
              >
                Magazyn
              </Link>
              <span className="text-sm text-gray-700 whitespace-nowrap">{session.user?.email}</span>
              <a
                href="/api/auth/signout"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium whitespace-nowrap"
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

