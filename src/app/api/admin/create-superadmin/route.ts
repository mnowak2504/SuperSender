import { NextRequest, NextResponse } from 'next/server'
import { db, supabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth-password'

export const runtime = 'nodejs'

/**
 * API endpoint to create superadmin account
 * This should be secured in production - only run once during setup
 * In production, you should require authentication or a secret token
 */
export async function POST(req: NextRequest) {
  try {
    // TODO: Add authentication/authorization check in production
    // For now, this is open - secure it before production use!

    const body = await req.json()
    const { email = 'm.nowak@makconsulting.pl', password, name = 'Michał Nowak' } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email)

    if (existingUser) {
      // Update existing user to SUPERADMIN role
      const { error: updateError } = await supabase
        .from('User')
        .update({ role: 'SUPERADMIN' })
        .eq('id', existingUser.id)

      if (updateError) {
        console.error('Error updating user role:', updateError)
        return NextResponse.json(
          { error: 'Failed to update user role', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'User already exists, role updated to SUPERADMIN',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: 'SUPERADMIN',
        },
      })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create superadmin user
    const user = await db.createUser({
      email,
      passwordHash,
      name,
      phone: null,
      role: 'SUPERADMIN',
    })

    // Update the user role in case RPC function didn't accept SUPERADMIN
    const { error: updateError } = await supabase
      .from('User')
      .update({ role: 'SUPERADMIN' })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user role after creation:', updateError)
    }

    return NextResponse.json(
      {
        message: 'Superadmin created successfully',
        user: {
          id: user.id,
          email: user.email,
          role: 'SUPERADMIN',
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating superadmin:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

