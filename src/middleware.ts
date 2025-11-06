import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware runs in Edge runtime - cannot use Node.js modules like bcrypt
// Authentication checks will be done at the page/route level instead
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Allow auth routes, landing page, public assets, and API routes
  if (
    path.startsWith('/auth') ||
    path.startsWith('/landing') ||
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path === '/'
  ) {
    return NextResponse.next()
  }

  // For protected routes, let the page handle authentication
  // This allows us to use Node.js runtime for auth checks
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/client/:path*',
    '/warehouse/:path*',
    '/admin/:path*',
    '/superadmin/:path*',
  ],
}
