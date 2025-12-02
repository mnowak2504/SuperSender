import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/client/local-collection-quote/[id]/decline
 * Client declines a quoted local collection
 */
export async function POST(
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
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    // Fetch the quote to ensure it belongs to the client and is in 'QUOTED' status
    const { data: existingQuote, error: fetchError } = await supabase
      .from('LocalCollectionQuote')
      .select('id, clientId, status')
      .eq('id', id)
      .eq('clientId', clientId)
      .single()

    if (fetchError || !existingQuote) {
      console.error('Error fetching existing quote for decline:', fetchError)
      return NextResponse.json({ error: 'Quote not found or unauthorized' }, { status: 404 })
    }

    if (existingQuote.status !== 'QUOTED') {
      return NextResponse.json({ error: `Quote is not in 'QUOTED' status. Current status: ${existingQuote.status}` }, { status: 400 })
    }

    // Update quote status to CANCELLED
    const { data: updatedQuote, error: updateError } = await supabase
      .from('LocalCollectionQuote')
      .update({
        status: 'CANCELLED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error declining local collection quote:', updateError)
      return NextResponse.json(
        { error: 'Failed to decline quote', details: updateError.message },
        { status: 500 }
      )
    }

    // TODO: Send notification email to sales rep about declined quote

    return NextResponse.json({ success: true, quote: updatedQuote })
  } catch (error) {
    console.error('Error in POST /api/client/local-collection-quote/[id]/decline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

