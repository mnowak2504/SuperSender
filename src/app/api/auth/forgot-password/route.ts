import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/auth/forgot-password
 * Request password reset - sends email with reset link (no authentication required)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, email, role')
      .eq('email', email.toLowerCase().trim())
      .single()

    // Don't reveal if user exists or not (security best practice)
    // Always return success message even if user doesn't exist
    if (userError || !user) {
      // Return success to prevent email enumeration
      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // Token valid for 1 hour

    // Store reset token in database (you may need to add resetToken and resetTokenExpiry fields to User model)
    // For now, we'll encode it in the URL and verify it later
    // In production, store these fields in the database:
    // - resetToken: string | null
    // - resetTokenExpiry: DateTime | null

    // Generate reset URL with token and user ID encoded
    const tokenData = {
      userId: user.id,
      token: resetToken,
      expires: resetTokenExpiry.getTime(),
    }
    const encodedToken = Buffer.from(JSON.stringify(tokenData)).toString('base64')
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${encodedToken}`

    // Send email with reset link
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      })

      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      // Still return success to prevent email enumeration
      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }
  } catch (error) {
    console.error('Error in POST /api/auth/forgot-password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

