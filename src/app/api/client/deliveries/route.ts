import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { autoAssignClient } from '@/lib/auto-assign-client'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    console.log('[API /client/deliveries POST] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      clientId: (session?.user as any)?.clientId,
    })

    if (!session?.user) {
      console.log('[API /client/deliveries POST] No session - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create Client for user
    let clientId = (session.user as any)?.clientId

    // If user doesn't have a client, create one for MVP
    if (!clientId) {
      console.log('[API /client/deliveries POST] User has no clientId, creating Client...')
      
      const { data: existingClient } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (existingClient) {
        clientId = existingClient.id
        console.log('[API /client/deliveries POST] Found existing Client:', clientId)
      } else {
        // Create a new Client for this user
        const clientCode = `CLI-${session.user.id.slice(-6).toUpperCase()}`
        const newClientId = `cl${Date.now()}${Math.random().toString(36).substring(2, 11)}`
        const defaultCountry = 'Unknown' // Default, can be updated later
        
        const { data: newClient, error: clientError } = await supabase
          .from('Client')
          .insert({
            id: newClientId,
            displayName: session.user.name || session.user.email?.split('@')[0] || 'Client',
            email: session.user.email || '',
            country: defaultCountry,
            clientCode,
            salesOwnerCode: 'SYS', // System-generated
            status: 'ACTIVE',
          })
          .select('id')
          .single()

        if (clientError || !newClient) {
          console.error('[API /client/deliveries POST] Error creating Client:', clientError)
          return NextResponse.json(
            { error: 'Failed to create client record', details: clientError?.message },
            { status: 500 }
          )
        }

        clientId = newClient.id
        console.log('[API /client/deliveries POST] Created new Client:', clientId)

        // Auto-assign client to sales owner
        await autoAssignClient(clientId, defaultCountry)

        // Update user with clientId
        await supabase
          .from('User')
          .update({ clientId })
          .eq('id', session.user.id)
      }
    }

    const body = await req.json()
    const { supplierName, goodsDescription, orderNumber, clientReference, eta } = body

    if (!supplierName || !goodsDescription) {
      return NextResponse.json(
        { error: 'Supplier name and goods description are required' },
        { status: 400 }
      )
    }

    console.log('[API /client/deliveries POST] Creating delivery with clientId:', clientId)

    // Generate ID (simple CUID-like format: cl + timestamp + random)
    const deliveryId = `cl${Date.now()}${Math.random().toString(36).substring(2, 11)}`

    // Use Supabase to create delivery
    const { data: delivery, error: supabaseError } = await supabase
      .from('DeliveryExpected')
      .insert({
        id: deliveryId,
        clientId,
        supplierName,
        goodsDescription,
        orderNumber: orderNumber || null,
        clientReference: clientReference || null,
        eta: eta ? new Date(eta).toISOString() : null,
        status: 'EXPECTED',
      })
      .select()
      .single()

    if (supabaseError) {
      console.error('[API /client/deliveries POST] Supabase error:', supabaseError)
      return NextResponse.json(
        { error: 'Failed to create delivery', details: supabaseError.message },
        { status: 500 }
      )
    }

    console.log('[API /client/deliveries POST] Delivery created successfully:', delivery?.id)

    // TODO: Send notification email to warehouse

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    console.error('[API /client/deliveries POST] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    console.log('[API /client/deliveries GET] Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      clientId: (session?.user as any)?.clientId,
    })

    if (!session?.user) {
      console.log('[API /client/deliveries GET] No session - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get clientId from session or find by email
    let clientId = (session.user as any)?.clientId

    if (!clientId) {
      // Try to find Client by email
      const { data: client } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (client) {
        clientId = client.id
      } else {
        // User has no Client, return empty array
        return NextResponse.json([])
      }
    }

    console.log('[API /client/deliveries GET] Fetching deliveries for clientId:', clientId)

    // Use Supabase to fetch deliveries
    const { data: deliveries, error: supabaseError } = await supabase
      .from('DeliveryExpected')
      .select('*, photos:Media(*)')
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false })

    if (supabaseError) {
      console.error('[API /client/deliveries GET] Supabase error:', supabaseError)
      return NextResponse.json(
        { error: 'Failed to fetch deliveries', details: supabaseError.message },
        { status: 500 }
      )
    }

    console.log('[API /client/deliveries GET] Found deliveries:', deliveries?.length || 0)

    return NextResponse.json(deliveries || [])
  } catch (error) {
    console.error('[API /client/deliveries GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

