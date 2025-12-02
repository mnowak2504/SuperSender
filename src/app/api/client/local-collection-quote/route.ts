import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/client/local-collection-quote
 * Create a local collection quote request
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

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

    const body = await req.json()
    const {
      widthCm,
      lengthCm,
      heightCm,
      weightKg,
      volumeCbm,
      collectionAddressLine1,
      collectionAddressLine2,
      collectionCity,
      collectionPostCode,
      clientNotes,
    } = body

    // Validate required fields
    if (!widthCm || !lengthCm || !heightCm || !weightKg || !volumeCbm ||
        !collectionAddressLine1 || !collectionCity || !collectionPostCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create quote request
    const { data: quote, error } = await supabase
      .from('LocalCollectionQuote')
      .insert({
        clientId,
        status: 'REQUESTED',
        widthCm: parseFloat(widthCm),
        lengthCm: parseFloat(lengthCm),
        heightCm: parseFloat(heightCm),
        weightKg: parseFloat(weightKg),
        volumeCbm: parseFloat(volumeCbm),
        collectionAddressLine1,
        collectionAddressLine2: collectionAddressLine2 || null,
        collectionCity,
        collectionPostCode,
        collectionCountry: null, // Will be set when accepting quote
        collectionContactName: null, // Will be set when accepting quote
        collectionContactPhone: null, // Will be set when accepting quote
        clientNotes: clientNotes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating local collection quote:', error)
      return NextResponse.json(
        { error: 'Failed to create quote request', details: error.message },
        { status: 500 }
      )
    }

    // TODO: Send notification email to sales rep

    return NextResponse.json({ success: true, quote })
  } catch (error) {
    console.error('Error in POST /api/client/local-collection-quote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/client/local-collection-quote
 * Get local collection quotes for the current client
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

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

    const { data: quotes, error } = await supabase
      .from('LocalCollectionQuote')
      .select('*')
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching local collection quotes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch quotes', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ quotes: quotes || [] })
  } catch (error) {
    console.error('Error in GET /api/client/local-collection-quote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

