import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-password'
import type { Role } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, phone, role = 'CLIENT' } = body

    console.log('Registration attempt for email:', email)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    console.log('Checking for existing user...')
    const existingUser = await db.findUserByEmail(email)

    if (existingUser) {
      console.log('User already exists:', email)
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    console.log('Hashing password...')
    const passwordHash = await hashPassword(password)
    console.log('Password hashed successfully')

    // Create user
    console.log('Creating user in database...')
    const user = await db.createUser({
      email,
      passwordHash,
      name: name || null,
      phone: phone || null,
      role: role as Role,
    })

    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
    })

    // Verify the user was actually saved
    const verifyUser = await db.findUserById(user.id)

    if (!verifyUser) {
      console.error('ERROR: User was not saved to database!')
      return NextResponse.json(
        { error: 'Failed to save user to database' },
        { status: 500 }
      )
    }

    console.log('User verified in database:', verifyUser.id)

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering user:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

