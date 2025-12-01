import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/auth'
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar'

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
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">MAK Consulting - Superadmin</h1>
            </div>
            <div className="flex items-center space-x-4">
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
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <SuperAdminSidebar />

        {/* Main content */}
        <main className="flex-1 w-full lg:ml-64">
          <div className="pt-20 lg:pt-6 py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
