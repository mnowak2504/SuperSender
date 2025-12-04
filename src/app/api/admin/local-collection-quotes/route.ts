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
    const statusFilter = searchParams.get('status') // Optional: REQUESTED, QUOTED, READY_FOR_COLLECTION, COMPLETED, CANCELLED

    let query = supabase
      .from('LocalCollectionQuote')
      .select('*, Client:clientId(id, displayName, clientCode, email)')
      .order('createdAt', { ascending: false })

    if (statusFilter) {
      if (statusFilter === 'READY_FOR_COLLECTION') {
        // READY_FOR_COLLECTION = ACCEPTED or SCHEDULED
        query = query.in('status', ['ACCEPTED', 'SCHEDULED'])
      } else {
        query = query.eq('status', statusFilter)
      }
    }

    const { data: quotes, error } = await query

    if (error) {
      console.error('Error fetching local collection quotes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quotes', details: error.message },
        { status: 500 }
      )
    }

    // Get counts for all statuses (for tab badges)
    const { data: allQuotes, error: countsError } = await supabase
      .from('LocalCollectionQuote')
      .select('status')

    if (countsError) {
      console.error('Error fetching quote counts:', countsError)
    }

    const counts = {
      REQUESTED: allQuotes?.filter(q => q.status === 'REQUESTED').length || 0,
      QUOTED: allQuotes?.filter(q => q.status === 'QUOTED').length || 0,
      READY_FOR_COLLECTION: allQuotes?.filter(q => q.status === 'ACCEPTED' || q.status === 'SCHEDULED').length || 0,
      COMPLETED: allQuotes?.filter(q => q.status === 'COMPLETED').length || 0,
      CANCELLED: allQuotes?.filter(q => q.status === 'CANCELLED').length || 0,
      ALL: allQuotes?.length || 0,
    }

    return NextResponse.json({ 
      quotes: quotes || [],
      counts 
    })
  } catch (error) {
    console.error('Error in GET /api/admin/local-collection-quotes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

