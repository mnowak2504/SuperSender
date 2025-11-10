import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-password'
import type { Role } from '@/lib/db'
import { supabase } from '@/lib/db'
import { autoAssignClient } from '@/lib/auto-assign-client'
import { generateTempClientCode, generateClientCode, getSalesRepCode } from '@/lib/client-code-generator'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      email, 
      password, 
      confirmPassword,
      country,
      accountType,
      companyName,
      firstName,
      lastName,
      phone,
      marketingConsent,
      role = 'CLIENT' 
    } = body

    console.log('Registration attempt for email:', email)

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (!country) {
      return NextResponse.json(
        { error: 'Country is required' },
        { status: 400 }
      )
    }

    if (accountType === 'COMPANY' && !companyName?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required for company accounts' },
        { status: 400 }
      )
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Validate phone format (E.164)
    if (phone && !phone.match(/^\+[1-9]\d{1,14}$/)) {
      return NextResponse.json(
        { error: 'Phone number must be in E.164 format (e.g., +353123456789)' },
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

    // Create user with full name
    const fullName = `${firstName} ${lastName}`.trim()
    console.log('Creating user in database...')
    const user = await db.createUser({
      email,
      passwordHash,
      name: fullName,
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

    // Create Client account with temporary code
    const tempClientCode = generateTempClientCode(country)
    const displayName = accountType === 'COMPANY' 
      ? companyName 
      : fullName

    console.log('Creating Client account with temp code:', tempClientCode)
    
    // Check if email already exists in Client table
    const { data: existingClientEmail } = await supabase
      .from('Client')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    
    if (existingClientEmail) {
      console.error('Client with this email already exists:', email)
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }
    
    const clientData = {
      displayName,
      email,
      phone: phone || null,
      country,
      clientCode: tempClientCode,
      salesOwnerCode: 'TBD',
      status: 'ACTIVE',
      spaceUsagePct: 0,
      usedCbm: 0,
      limitCbm: 0,
    }
    
    console.log('Client data to insert:', { ...clientData, phone: clientData.phone ? '***' : null })
    
    const { data: newClient, error: clientError } = await supabase
      .from('Client')
      .insert(clientData)
      .select('id')
      .single()

    if (clientError || !newClient) {
      console.error('Error creating Client:', {
        error: clientError,
        code: clientError?.code,
        message: clientError?.message,
        details: clientError?.details,
        hint: clientError?.hint,
      })
      return NextResponse.json(
        { 
          error: 'Failed to create client account', 
          details: clientError?.message || 'Unknown error',
          code: clientError?.code,
        },
        { status: 500 }
      )
    }

    const clientId = newClient.id
    console.log('Client created with ID:', clientId)

    // Link user to client
    await supabase
      .from('User')
      .update({ clientId })
      .eq('id', user.id)

    // Assign sales rep (based on country)
    console.log('Assigning sales rep for country:', country)
    const salesRepId = await autoAssignClient(clientId, country)

    if (salesRepId) {
      console.log('Sales rep assigned:', salesRepId)
      
      // Generate final client code
      const salesRepCode = await getSalesRepCode(salesRepId)
      const finalClientCode = await generateClientCode(salesRepCode, country)
      
      console.log('Generated final client code:', finalClientCode)

      // Update client with final code and sales rep
      const { error: updateError } = await supabase
        .from('Client')
        .update({
          clientCode: finalClientCode,
          salesOwnerCode: salesRepCode,
          salesOwnerId: salesRepId,
        })
        .eq('id', clientId)

      if (updateError) {
        console.error('Error updating client with final code:', updateError)
        // Don't fail registration, but log the error
      }
    } else {
      console.warn('No sales rep assigned, keeping temp code')
    }

    console.log('Registration completed successfully')

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId,
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

