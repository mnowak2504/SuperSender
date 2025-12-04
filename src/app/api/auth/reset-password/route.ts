import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth-password'

export const runtime = 'nodejs'

/**
 * POST /api/auth/reset-password
 * Reset password using token (no authentication required)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 })
    }

    // Decode token
    let tokenData: { userId: string; token: string; expires: number }
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      tokenData = JSON.parse(decoded)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    // Check if token is expired
    if (Date.now() > tokenData.expires) {
      return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 })
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, email')
      .eq('id', tokenData.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    // Hash new password
    const newPasswordHash = await hashPassword(password)

    // Update password
    const { error: updateError } = await supabase
      .from('User')
      .update({ passwordHash: newPasswordHash })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    })
  } catch (error) {
    console.error('Error in POST /api/auth/reset-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

