import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function UnauthorizedPage() {
  const session = await auth()
  const role = (session?.user as any)?.role

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-3xl font-bold text-gray-900">403 - Unauthorized Access</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this resource.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Current session:</strong>
          </p>
          {session ? (
            <div className="text-sm text-gray-600">
              <p>Email: {session.user?.email}</p>
              <p>Role: {role || 'Not set'}</p>
              {role !== 'SUPERADMIN' && (
                <p className="mt-2 text-amber-600">
                  ⚠️ Your role is "{role || 'Not set'}", but SUPERADMIN is required.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No active session</p>
          )}
        </div>

        {role !== 'SUPERADMIN' && session?.user?.email === 'm.nowak@makconsulting.pl' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              🔄 Action Required:
            </p>
            <p className="text-sm text-blue-700">
              Your account has been updated to SUPERADMIN, but your session needs to be refreshed.
              Please log out and log back in to update your session.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href="/api/auth/signout"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </a>

          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Go to Sign In
          </Link>

          {role === 'CLIENT' && (
            <Link
              href="/client/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Go to Client Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
