import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

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

    // Fetch warehouse orders with Supabase
    const { data: ordersData, error: ordersError } = await supabase
      .from('WarehouseOrder')
      .select('id, status, warehouseLocation, receivedAt, packedAt, sourceDeliveryId, createdAt')
      .eq('clientId', clientId)
      .order('receivedAt', { ascending: false })

    if (ordersError) {
      console.error('Error fetching warehouse orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    if (!ordersData || ordersData.length === 0) {
      return NextResponse.json([])
    }

    // Fetch delivery details for each order
    const deliveryIds = ordersData.map((o: any) => o.sourceDeliveryId).filter(Boolean)
    
    let deliveriesMap: any = {}
    if (deliveryIds.length > 0) {
      const { data: deliveriesData } = await supabase
        .from('DeliveryExpected')
        .select('id, deliveryNumber, supplierName, goodsDescription, orderNumber')
        .in('id', deliveryIds)

      if (deliveriesData) {
        deliveriesMap = deliveriesData.reduce((acc: any, delivery: any) => {
          acc[delivery.id] = delivery
          return acc
        }, {})
      }
    }

    // Transform to include delivery info at root level
    const transformedOrders = ordersData.map((order: any) => ({
      ...order,
      delivery: deliveriesMap[order.sourceDeliveryId] || null,
      sourceDelivery: deliveriesMap[order.sourceDeliveryId] || null,
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error('Error fetching warehouse orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

