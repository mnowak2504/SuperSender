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
    if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Received today (m³ and count)
    const { data: receivedToday } = await supabase
      .from('Package')
      .select('volumeCbm, weightKg, warehouseOrderId, WarehouseOrder:warehouseOrderId(createdAt)')
      .gte('createdAt', todayISO)

    const receivedTodayCbm = receivedToday?.reduce((sum, p) => sum + (p.volumeCbm || 0), 0) || 0
    const receivedTodayCount = receivedToday?.length || 0

    // Shipping requests to pack (status: REQUESTED)
    const { count: toPackCount } = await supabase
      .from('ShipmentOrder')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'REQUESTED')

    // Missing data (no dimensions)
    const { data: ordersWithoutData } = await supabase
      .from('WarehouseOrder')
      .select('id, packedLengthCm, packedWidthCm, packedHeightCm')
      .or('packedLengthCm.is.null,packedWidthCm.is.null,packedHeightCm.is.null')
      .limit(10)

    // Shipped today
    const { data: shippedToday } = await supabase
      .from('WarehouseOrder')
      .select('id, packedWeightKg')
      .eq('status', 'SHIPPED')
      .gte('packedAt', todayISO)

    const shippedTodayCount = shippedToday?.length || 0
    const shippedTodayWeight = shippedToday?.reduce((sum, o) => sum + (o.packedWeightKg || 0), 0) || 0

    return NextResponse.json({
      receivedToday: {
        cbm: receivedTodayCbm,
        count: receivedTodayCount,
      },
      toPack: {
        count: toPackCount || 0, // Shipping requests to pack
      },
      missingData: {
        count: ordersWithoutData?.length || 0,
        items: ordersWithoutData || [],
      },
      shippedToday: {
        count: shippedTodayCount,
        weight: shippedTodayWeight,
      },
    })
  } catch (error) {
    console.error('Error fetching warehouse KPI:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

