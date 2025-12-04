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
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = (session.user as any)?.id

    // Get admin's assigned clients
    const { data: assignedClients } = await supabase
      .from('Client')
      .select('id')
      .eq('salesOwnerId', userId)

    const clientIds = assignedClients?.map(c => c.id) || []

    // Get custom quote requests AND shipments with calculated prices (for admin visibility)
    // Show:
    // 1. Custom quote requests (customQuoteRequestedAt IS NOT NULL OR clientTransportChoice = 'REQUEST_CUSTOM')
    // 2. Shipments with calculated prices ready for client choice (status = QUOTED AND calculatedPriceEur IS NOT NULL)
    // 3. Shipments with calculated prices that client has accepted (calculatedPriceEur IS NOT NULL AND clientTransportChoice = 'ACCEPT')
    
    // First, get custom quote requests (both with customQuoteRequestedAt and REQUEST_CUSTOM choice)
    const { data: customQuotes, error: customQuotesError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        clientId,
        customQuoteRequestedAt,
        calculatedPriceEur,
        status,
        clientTransportChoice,
        paymentMethod,
        acceptedAt,
        createdAt,
        Client:clientId(displayName, clientCode),
        deliveryAddress:deliveryAddressId(city, country),
        Package(widthCm, lengthCm, heightCm, weightKg)
      `)
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .or('customQuoteRequestedAt.not.is.null,clientTransportChoice.eq.REQUEST_CUSTOM')
      .order('customQuoteRequestedAt', { ascending: false })

    // Then, get quotes ready for client choice (QUOTED status - packed by warehouse, waiting for client)
    const { data: quotedShipments, error: quotedError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        clientId,
        customQuoteRequestedAt,
        calculatedPriceEur,
        status,
        clientTransportChoice,
        paymentMethod,
        acceptedAt,
        createdAt,
        Client:clientId(displayName, clientCode),
        deliveryAddress:deliveryAddressId(city, country),
        Package(widthCm, lengthCm, heightCm, weightKg)
      `)
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .eq('status', 'QUOTED')
      .not('calculatedPriceEur', 'is', null)
      .order('createdAt', { ascending: false })

    // Then, get accepted shipments with calculated prices
    const { data: acceptedQuotes, error: acceptedQuotesError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        clientId,
        customQuoteRequestedAt,
        calculatedPriceEur,
        status,
        clientTransportChoice,
        paymentMethod,
        acceptedAt,
        createdAt,
        Client:clientId(displayName, clientCode),
        deliveryAddress:deliveryAddressId(city, country),
        Package(widthCm, lengthCm, heightCm, weightKg)
      `)
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .not('calculatedPriceEur', 'is', null)
      .eq('clientTransportChoice', 'ACCEPT')
      .order('acceptedAt', { ascending: false })

    const quotesError = customQuotesError || quotedError || acceptedQuotesError
    // Combine all results, removing duplicates by id
    const quotesMap = new Map()
    ;(customQuotes || []).forEach((q: any) => quotesMap.set(q.id, q))
    ;(quotedShipments || []).forEach((q: any) => {
      // Only add if not already in map (to avoid duplicates)
      if (!quotesMap.has(q.id)) {
        quotesMap.set(q.id, q)
      }
    })
    ;(acceptedQuotes || []).forEach((q: any) => {
      // Only add if not already in map (to avoid duplicates)
      if (!quotesMap.has(q.id)) {
        quotesMap.set(q.id, q)
      }
    })
    const quotes = Array.from(quotesMap.values())

    if (quotesError) {
      console.error('Error fetching custom quotes:', quotesError)
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
    }

    return NextResponse.json({ quotes: quotes || [] })
  } catch (error) {
    console.error('Error fetching custom quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

