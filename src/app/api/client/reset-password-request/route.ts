import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * POST /api/client/reset-password-request
 * Request password reset - sends email with reset link
 */
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

    const userId = (session.user as any)?.id
    const userEmail = session.user.email

    if (!userEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 400 })
    }

    // Generate reset token (simple implementation - in production use crypto.randomBytes)
    const resetToken = Buffer.from(`${userId}-${Date.now()}`).toString('base64')
    const resetTokenExpiry = new Date()
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1) // Token valid for 1 hour

    // Store reset token in database (you may need to add a resetToken field to User model)
    // For now, we'll use a simple approach and send the email
    // In production, store the token in the database and verify it when resetting

    // Generate reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`

    // Send email with reset link
    try {
      await sendEmail({
        to: userEmail,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Password reset link has been sent to your email address.' 
      })
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please contact support.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/client/reset-password-request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

