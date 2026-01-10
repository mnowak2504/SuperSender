import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const roleFilter = searchParams.get('role')

    let query = supabase
      .from('User')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        clientId,
        countries,
        createdAt,
        updatedAt,
        Client:clientId(displayName, clientCode, salesOwnerId)
      `)
      .in('role', ['SUPERADMIN', 'ADMIN', 'WAREHOUSE'])
      .order('createdAt', { ascending: false })

    if (roleFilter && roleFilter !== 'ALL') {
      query = query.eq('role', roleFilter)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch users', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

