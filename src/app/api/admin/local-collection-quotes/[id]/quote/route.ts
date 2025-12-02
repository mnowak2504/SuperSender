import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * PUT /api/admin/local-collection-quotes/[id]/quote
 * Admin sets price for a local collection quote (changes status to QUOTED)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { quotedPriceEur, adminNotes } = body

    if (!quotedPriceEur || typeof quotedPriceEur !== 'number' || quotedPriceEur <= 0) {
      return NextResponse.json(
        { error: 'Invalid price. Price must be a positive number.' },
        { status: 400 }
      )
    }

    // Fetch the quote to verify it exists and is in REQUESTED status
    const { data: existingQuote, error: fetchError } = await supabase
      .from('LocalCollectionQuote')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingQuote) {
      console.error('Error fetching quote:', fetchError)
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (existingQuote.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: `Quote is not in REQUESTED status. Current status: ${existingQuote.status}` },
        { status: 400 }
      )
    }

    // Update quote with price and change status to QUOTED
    const { data: updatedQuote, error: updateError } = await supabase
      .from('LocalCollectionQuote')
      .update({
        quotedPriceEur: parseFloat(quotedPriceEur.toString()),
        quotedById: (session.user as any)?.id,
        quotedAt: new Date().toISOString(),
        status: 'QUOTED',
        adminNotes: adminNotes || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, Client:clientId(id, displayName, clientCode, email)')
      .single()

    if (updateError) {
      console.error('Error updating quote:', updateError)
      return NextResponse.json(
        { error: 'Failed to update quote', details: updateError.message },
        { status: 500 }
      )
    }

    // TODO: Send email notification to client about the quote

    return NextResponse.json({ success: true, quote: updatedQuote })
  } catch (error) {
    console.error('Error in PUT /api/admin/local-collection-quotes/[id]/quote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

