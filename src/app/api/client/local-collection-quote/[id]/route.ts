import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/client/local-collection-quote/[id]
 * Get a single local collection quote by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Find client
    let clientId = (session.user as any)?.clientId
    if (!clientId) {
      const { data: clientByEmail } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (clientByEmail) {
        clientId = clientByEmail.id
      } else {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
    }

    // Fetch the quote and verify it belongs to the client
    const { data: quote, error } = await supabase
      .from('LocalCollectionQuote')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientId)
      .single()

    if (error) {
      console.error('Error fetching local collection quote:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to fetch quote', details: error.message },
        { status: 500 }
      )
    }

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error('Error in GET /api/client/local-collection-quote/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

