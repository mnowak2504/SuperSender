import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, supabase } from '@/lib/db'
import { comparePassword, hashPassword } from '@/lib/auth-password'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 })
    }

    // Get user to verify current password
    const user = await db.findUserById((session.user as any).id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    const { error } = await supabase
      .from('User')
      .update({ passwordHash: newPasswordHash })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating password:', error)
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/client/change-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

