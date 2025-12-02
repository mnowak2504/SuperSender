import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { requireActiveSubscription } from '@/lib/subscription-check'

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

    // Check subscription status - require active subscription
    const subscriptionCheck = await requireActiveSubscription(clientId)
    if (!subscriptionCheck.allowed) {
      return subscriptionCheck.response as NextResponse
    }

    // Also check if client has at least one received item
    const { data: warehouseOrders, error: ordersCheckError } = await supabase
      .from('WarehouseOrder')
      .select('id')
      .eq('clientId', clientId)
      .eq('status', 'AT_WAREHOUSE')
      .limit(1)

    if (ordersCheckError) {
      console.error('Error checking warehouse orders:', ordersCheckError)
    }

    if (!warehouseOrders || warehouseOrders.length === 0) {
      return NextResponse.json(
        {
          error: 'No items available',
          message: 'You need at least one received item to request a shipment.',
        },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { deliveryAddressId, transportMode, warehouseOrderIds, timeWindowFrom, timeWindowTo } =
      body

    if (!deliveryAddressId || !transportMode || !warehouseOrderIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify all orders belong to client and are available for shipment
    // Only allow AT_WAREHOUSE status (client selects orders for packing)
    const { data: orders, error: ordersError } = await supabase
      .from('WarehouseOrder')
      .select('id, status')
      .in('id', warehouseOrderIds)
      .eq('clientId', clientId)
      .eq('status', 'AT_WAREHOUSE')

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

    // Get client country for packing order number generation
    const { data: clientData } = await supabase
      .from('Client')
      .select('country')
      .eq('id', clientId)
      .single()

    const countryCode = clientData?.country || 'PL'
    const { getCountryCode } = await import('@/lib/packing-order-number')
    const country = getCountryCode(countryCode)

    // Generate packing order number (IE-{COUNTRY}-{MONTH}-XXX)
    const { generatePackingOrderNumber } = await import('@/lib/packing-order-number')
    const packingOrderNumber = await generatePackingOrderNumber(supabase, country)

    const shipmentOrderId = generateCUID()
    // Status starts as REQUESTED - this is a packing order
    const initialStatus = 'REQUESTED'

    // Create ShipmentOrder (this is now a packing order)
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
        packingOrderNumber: packingOrderNumber,
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

    // Update WarehouseOrder status to IN_PREPARATION (client selected for packing)
    // These orders no longer count towards warehouse capacity
    await supabase
      .from('WarehouseOrder')
      .update({ status: 'IN_PREPARATION' })
      .in('id', warehouseOrderIds)

    // Update warehouse capacity (remove these orders from used space)
    try {
      await supabase.rpc('update_client_warehouse_capacity', { client_id: clientId })
      const { updateMonthlyAdditionalCharges } = await import('@/lib/update-additional-charges')
      await updateMonthlyAdditionalCharges(clientId)
    } catch (capacityError) {
      console.warn('Could not update warehouse capacity:', capacityError)
    }

    // Check for additional charges and create invoice if any exist
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const { data: additionalCharges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', clientId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single()

    let invoiceId: string | null = null

    if (additionalCharges && additionalCharges.totalAmountEur > 0) {
      // Create invoice for additional charges
      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'inv'
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      invoiceId = generateCUID()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14) // 14 days to pay

      const { data: invoice, error: invoiceError } = await supabase
        .from('Invoice')
        .insert({
          id: invoiceId,
          clientId: clientId,
          type: 'OPERATIONS',
          amountEur: additionalCharges.totalAmountEur,
          currency: 'EUR',
          status: 'ISSUED',
          dueDate: dueDate.toISOString(),
        })
        .select()
        .single()

      if (invoiceError) {
        console.error('Error creating invoice for additional charges:', invoiceError)
        // Continue with shipment creation even if invoice creation fails
      } else {
        // Reset additional charges after creating invoice
        await supabase
          .from('MonthlyAdditionalCharges')
          .update({
            overSpaceAmountEur: 0,
            additionalServicesAmountEur: 0,
            totalAmountEur: 0,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', additionalCharges.id)

        console.log(`[Shipment ${shipmentOrderId}] Created invoice ${invoiceId} for additional charges: €${additionalCharges.totalAmountEur}`)
      }
    }

    // Fetch the complete shipment with items
    const { data: completeShipment, error: fetchError } = await supabase
      .from('ShipmentOrder')
      .select('*, items:ShipmentItem(*)')
      .eq('id', shipmentOrderId)
      .single()

    if (fetchError) {
      console.error('Error fetching complete shipment:', fetchError)
      // Return what we have
      return NextResponse.json({ ...shipment, items: shipmentItems, invoiceId }, { status: 201 })
    }

    // TODO: Send notification to admin/warehouse

    return NextResponse.json({ ...completeShipment, invoiceId }, { status: 201 })
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
