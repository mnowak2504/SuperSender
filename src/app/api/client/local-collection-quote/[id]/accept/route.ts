import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/client/local-collection-quote/[id]/accept
 * Accept a quoted price and schedule collection
 */
export async function POST(
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

    // Verify quote belongs to client
    const { data: quote, error: quoteError } = await supabase
      .from('LocalCollectionQuote')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status !== 'QUOTED') {
      return NextResponse.json({ error: 'Quote is not in QUOTED status' }, { status: 400 })
    }

    const body = await req.json()
    const {
      collectionCountry,
      collectionContactName,
      collectionContactPhone,
      collectionDateFrom,
      collectionDateTo,
      orderNumber,
      orderDetails,
      pinCode,
    } = body

    // Validate required fields
    if (!collectionCountry || !collectionContactName || !collectionContactPhone ||
        !collectionDateFrom || !collectionDateTo) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update quote with acceptance and scheduling details
    const { data: updatedQuote, error: updateError } = await supabase
      .from('LocalCollectionQuote')
      .update({
        status: 'ACCEPTED',
        collectionCountry,
        collectionContactName,
        collectionContactPhone,
        collectionDateFrom: new Date(collectionDateFrom).toISOString(),
        collectionDateTo: new Date(collectionDateTo).toISOString(),
        orderNumber: orderNumber || null,
        orderDetails: orderDetails || null,
        pinCode: pinCode || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error accepting quote:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept quote', details: updateError.message },
        { status: 500 }
      )
    }

    // TODO: Send notification email to sales rep/admin about scheduled collection

    return NextResponse.json({ success: true, quote: updatedQuote })
  } catch (error) {
    console.error('Error in POST /api/client/local-collection-quote/[id]/accept:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

