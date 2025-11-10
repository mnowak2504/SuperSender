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
    const { email, name, phone, role: newRole, clientId, countries } = body

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
    if (countries !== undefined) {
      // Countries should be an array of country codes
      updateData.countries = Array.isArray(countries) ? countries : (countries ? [countries] : [])
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

/**
 * DELETE /api/superadmin/users/[id]
 * Delete user by ID (only SUPERADMIN)
 */
export async function DELETE(
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

    // Prevent deleting yourself
    if (id === (session.user as any)?.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('User')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/superadmin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

