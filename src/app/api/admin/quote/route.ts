import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * API endpoint do tworzenia wyceny transportu przez biuro
 * 
 * Workflow:
 * 1. Sprawdź czy zamówienie ma status READY_FOR_QUOTE
 * 2. Utwórz ShipmentOrder ze statusem QUOTED lub AWAITING_ACCEPTANCE
 * 3. Utwórz ShipmentItem łączący ShipmentOrder z WarehouseOrder
 * 4. Zmień status WarehouseOrder na READY_TO_SHIP (jeśli wycena zaakceptowana) lub pozostaw READY_FOR_QUOTE
 * 5. Jeśli transport MAK i jest cena, status AWAITING_ACCEPTANCE
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const role = (session.user as any)?.role
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only admin users can create quotes' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      orderId,
      clientId,
      deliveryAddressId,
      transportMode,
      proposedPriceEur,
      quotedById,
      notes,
    } = body

    if (!orderId || !clientId || !deliveryAddressId || !transportMode) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, clientId, deliveryAddressId, transportMode' },
        { status: 400 }
      )
    }

    if (transportMode === 'MAK' && !proposedPriceEur) {
      return NextResponse.json(
        { error: 'proposedPriceEur is required when transportMode is MAK' },
        { status: 400 }
      )
    }

    // Sprawdź czy zamówienie istnieje i ma odpowiedni status
    const { data: order, error: orderError } = await supabase
      .from('WarehouseOrder')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'READY_FOR_QUOTE') {
      return NextResponse.json(
        { error: `Order cannot be quoted. Current status: ${order.status}` },
        { status: 400 }
      )
    }

    // Sprawdź czy zamówienie nie jest już w innym zleceniu wysyłkowym
    const { data: existingShipmentItems } = await supabase
      .from('ShipmentItem')
      .select('*')
      .eq('warehouseOrderId', orderId)

    if (existingShipmentItems && existingShipmentItems.length > 0) {
      return NextResponse.json(
        { error: 'Order is already included in a shipment order' },
        { status: 400 }
      )
    }

    // Określ status zlecenia wysyłkowego
    let shipmentStatus: 'QUOTED' | 'AWAITING_ACCEPTANCE' = 'QUOTED'
    if (transportMode === 'MAK' && proposedPriceEur) {
      shipmentStatus = 'AWAITING_ACCEPTANCE'
    }

    // Generuj ID dla ShipmentOrder
    const shipmentOrderId = 'cl' + Math.random().toString(36).substring(2, 24)

    // Utwórz ShipmentOrder
    const { data: shipmentOrder, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .insert({
        id: shipmentOrderId,
        clientId: clientId,
        deliveryAddressId: deliveryAddressId,
        transportMode: transportMode,
        status: shipmentStatus,
        proposedPriceEur: proposedPriceEur || null,
        quotedAt: new Date().toISOString(),
        quotedById: quotedById,
      })
      .select()
      .single()

    if (shipmentError) {
      console.error('Error creating shipment order:', shipmentError)
      return NextResponse.json(
        { error: 'Failed to create shipment order', details: shipmentError.message },
        { status: 500 }
      )
    }

    // Utwórz ShipmentItem łączący zamówienie z zleceniem wysyłkowym
    const shipmentItemId = 'cl' + Math.random().toString(36).substring(2, 24)
    const { error: itemError } = await supabase
      .from('ShipmentItem')
      .insert({
        id: shipmentItemId,
        shipmentId: shipmentOrderId,
        warehouseOrderId: orderId,
      })

    if (itemError) {
      console.error('Error creating shipment item:', itemError)
      // Nie przerywamy - zlecenie zostało już utworzone
    }

    // Jeśli transport CLIENT_OWN, zmień status zamówienia na READY_TO_SHIP
    // Jeśli MAK i wycena, pozostaw READY_FOR_QUOTE do czasu akceptacji
    if (transportMode === 'CLIENT_OWN') {
      await supabase
        .from('WarehouseOrder')
        .update({ status: 'READY_TO_SHIP' })
        .eq('id', orderId)
    }

    return NextResponse.json(
      {
        message: 'Quote created successfully',
        shipmentOrderId,
        shipmentStatus,
        orderId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

