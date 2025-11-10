import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Sign out using NextAuth
    await signOut({ redirect: false })
    
    // Also clear the session cookie manually to be sure
    const cookieStore = await cookies()
    cookieStore.delete('next-auth.session-token')
    cookieStore.delete('__Secure-next-auth.session-token')
    
    // Redirect to landing page using external URL
    return NextResponse.redirect('https://www.supersender.eu', {
      status: 302,
    })
  } catch (error) {
    console.error('Error signing out:', error)
    
    // Even if signOut fails, try to clear cookies and redirect
    try {
      const cookieStore = await cookies()
      cookieStore.delete('next-auth.session-token')
      cookieStore.delete('__Secure-next-auth.session-token')
    } catch (cookieError) {
      console.error('Error clearing cookies:', cookieError)
    }
    
    // Always redirect to landing page
    return NextResponse.redirect('https://www.supersender.eu', {
      status: 302,
    })
  }
}

