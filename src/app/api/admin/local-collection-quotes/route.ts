import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/admin/local-collection-quotes
 * Get all local collection quotes for admin (with filters)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') // Optional: REQUESTED, QUOTED, ACCEPTED, etc.

    let query = supabase
      .from('LocalCollectionQuote')
      .select('*, Client:clientId(id, displayName, clientCode, email)')
      .order('createdAt', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: quotes, error } = await query

    if (error) {
      console.error('Error fetching local collection quotes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quotes', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ quotes: quotes || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/local-collection-quotes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

