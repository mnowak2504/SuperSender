import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * PUT /api/superadmin/users/[id]
 * Update user by ID (only SUPERADMIN)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { email, name, phone, role: newRole, clientId } = body

    // Validate role
    const validRoles = ['CLIENT', 'WAREHOUSE', 'ADMIN', 'SUPERADMIN']
    if (newRole && !validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const { data: existingUser } = await supabase
        .from('User')
        .select('id, email')
        .eq('email', email)
        .neq('id', id)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (email !== undefined) updateData.email = email
    if (name !== undefined) updateData.name = name || null
    if (phone !== undefined) updateData.phone = phone || null
    if (newRole !== undefined) updateData.role = newRole
    if (clientId !== undefined) {
      // If clientId is empty string, set to null
      updateData.clientId = clientId || null
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        name,
        phone,
        role,
        clientId,
        createdAt,
        updatedAt,
        Client:clientId(displayName, clientCode)
      `)
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error in PUT /api/superadmin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

