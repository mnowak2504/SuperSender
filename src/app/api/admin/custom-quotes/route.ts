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

    // Get custom quote requests
    const { data: quotes, error: quotesError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        clientId,
        customQuoteRequestedAt,
        calculatedPriceEur,
        status,
        clientTransportChoice,
        Client:clientId(displayName, clientCode),
        deliveryAddress:deliveryAddressId(city, country),
        Package(widthCm, lengthCm, heightCm, weightKg)
      `)
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .not('customQuoteRequestedAt', 'is', null)
      .order('customQuoteRequestedAt', { ascending: false })

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

