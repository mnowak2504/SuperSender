import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/auth'

export default async function WarehouseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
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
                <h1 className="text-xl font-bold text-gray-900">MAK Consulting - Magazyn</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/warehouse/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/warehouse/expected-deliveries"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Oczekiwane dostawy
                </Link>
                <Link
                  href="/warehouse/orders"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Zamówienia
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {role === 'SUPERADMIN' && (
                <>
                  <Link
                    href="/superadmin/dashboard"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    Superadmin
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    Biuro
                  </Link>
                </>
              )}
              <span className="text-sm text-gray-700">{session.user?.email}</span>
              <form action={async () => {
                'use server'
                await signOut({ redirectTo: 'https://www.supersender.eu' })
              }}>
                <button
                  type="submit"
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Wyloguj
                </button>
              </form>
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

