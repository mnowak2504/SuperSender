import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get clientId from session or find by email
    let clientId = (session.user as any)?.clientId

    if (!clientId) {
      const { data: client } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (client) {
        clientId = client.id
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await req.json()
    const { deliveryAddressId, transportMode, warehouseOrderIds, timeWindowFrom, timeWindowTo } =
      body

    if (!deliveryAddressId || !transportMode || !warehouseOrderIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify all orders belong to client and are available for shipment
    // Allow both AT_WAREHOUSE and READY_TO_SHIP statuses
    const { data: orders, error: ordersError } = await supabase
      .from('WarehouseOrder')
      .select('id, status')
      .in('id', warehouseOrderIds)
      .eq('clientId', clientId)
      .in('status', ['AT_WAREHOUSE', 'READY_TO_SHIP'])

    if (ordersError) {
      console.error('Error verifying orders:', ordersError)
      return NextResponse.json({ error: 'Failed to verify orders' }, { status: 500 })
    }

    if (!orders || orders.length !== warehouseOrderIds.length) {
      return NextResponse.json(
        { error: 'Invalid orders selected. Some orders may not exist or belong to you.' },
        { status: 400 }
      )
    }

    // Generate shipment order ID
    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'cl'
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const shipmentOrderId = generateCUID()
    // Status starts as REQUESTED - warehouse needs to pack and calculate price first
    const initialStatus = 'REQUESTED'

    // Create ShipmentOrder
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .insert({
        id: shipmentOrderId,
        clientId: clientId,
        deliveryAddressId: deliveryAddressId,
        transportMode: transportMode,
        timeWindowFrom: timeWindowFrom ? new Date(timeWindowFrom).toISOString() : null,
        timeWindowTo: timeWindowTo ? new Date(timeWindowTo).toISOString() : null,
        status: initialStatus,
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

    // Create ShipmentItem records for each warehouse order
    const shipmentItems = warehouseOrderIds.map((orderId: string) => {
      const itemId = generateCUID()
      return {
        id: itemId,
        shipmentId: shipmentOrderId,
        warehouseOrderId: orderId,
      }
    })

    const { error: itemsError } = await supabase.from('ShipmentItem').insert(shipmentItems)

    if (itemsError) {
      console.error('Error creating shipment items:', itemsError)
      // Try to clean up the shipment order if items failed
      await supabase.from('ShipmentOrder').delete().eq('id', shipmentOrderId)
      return NextResponse.json(
        { error: 'Failed to create shipment items', details: itemsError.message },
        { status: 500 }
      )
    }

    // Update WarehouseOrder status to BEING_PACKED
    await supabase
      .from('WarehouseOrder')
      .update({ status: 'BEING_PACKED' })
      .in('id', warehouseOrderIds)

    // Fetch the complete shipment with items
    const { data: completeShipment, error: fetchError } = await supabase
      .from('ShipmentOrder')
      .select('*, items:ShipmentItem(*)')
      .eq('id', shipmentOrderId)
      .single()

    if (fetchError) {
      console.error('Error fetching complete shipment:', fetchError)
      // Return what we have
      return NextResponse.json({ ...shipment, items: shipmentItems }, { status: 201 })
    }

    // TODO: Send notification to admin/warehouse

    return NextResponse.json(completeShipment, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get clientId from session or find by email
    let clientId = (session.user as any)?.clientId

    if (!clientId) {
      const { data: client } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (client) {
        clientId = client.id
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch shipments with Supabase
    const { data: shipments, error: shipmentsError } = await supabase
      .from('ShipmentOrder')
      .select(`
        *,
        deliveryAddress:Address(*),
        items:ShipmentItem(
          *,
          warehouseOrder:WarehouseOrder(*)
        )
      `)
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false })

    if (shipmentsError) {
      console.error('Error fetching shipments:', shipmentsError)
      return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
    }

    return NextResponse.json(shipments || [])
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
