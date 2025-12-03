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
    // Check WarehouseOrders that:
    // 1. Don't have dimensions in WarehouseOrder.packedLengthCm/WidthCm/HeightCm (old way)
    // 2. AND don't have Package records directly linked to WarehouseOrder (from receiving delivery)
    // 3. AND are not part of a ShipmentOrder that has Package records with dimensions (from packing)
    
    // Get all WarehouseOrders without dimensions in their own fields
    // Only check orders that are still at warehouse or in preparation (not shipped)
    const { data: ordersWithoutOwnDimensions } = await supabase
      .from('WarehouseOrder')
      .select('id, packedLengthCm, packedWidthCm, packedHeightCm, status')
      .or('packedLengthCm.is.null,packedWidthCm.is.null,packedHeightCm.is.null')
      .in('status', ['AT_WAREHOUSE', 'IN_PREPARATION', 'PACKED'])
    
    // Get all WarehouseOrders that have Package records directly linked (from receiving delivery)
    const { data: packagesLinkedToOrders } = await supabase
      .from('Package')
      .select('warehouseOrderId, widthCm, lengthCm, heightCm')
      .not('warehouseOrderId', 'is', null)
    
    // Create a set of warehouse order IDs that have dimensions through direct Package links
    const ordersWithDirectPackageDimensions = new Set<string>()
    if (packagesLinkedToOrders) {
      for (const pkg of packagesLinkedToOrders) {
        if (pkg.warehouseOrderId && pkg.widthCm && pkg.lengthCm && pkg.heightCm) {
          ordersWithDirectPackageDimensions.add(pkg.warehouseOrderId)
        }
      }
    }
    
    // Get all WarehouseOrders that are part of ShipmentOrders with packages (have dimensions through shipment)
    // Query ShipmentItems and check if their shipments have packages
    const { data: allShipmentItems } = await supabase
      .from('ShipmentItem')
      .select('warehouseOrderId, shipmentId')
    
    // Get all ShipmentOrders that have packages with dimensions
    const { data: shipmentsWithPackages } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        packages:Package(
          id,
          widthCm,
          lengthCm,
          heightCm
        )
      `)
      .not('packages', 'is', null)
    
    // Create a set of shipment IDs that have packages with dimensions
    const shipmentsWithDimensions = new Set<string>()
    if (shipmentsWithPackages) {
      for (const shipment of shipmentsWithPackages) {
        const packages = shipment.packages as any[]
        if (packages && Array.isArray(packages) && packages.length > 0) {
          // Check if at least one package has all dimensions
          const hasDimensions = packages.some((pkg: any) => 
            pkg.widthCm && pkg.lengthCm && pkg.heightCm
          )
          if (hasDimensions) {
            shipmentsWithDimensions.add(shipment.id)
          }
        }
      }
    }
    
    // Create a set of warehouse order IDs that have dimensions through shipments
    const ordersWithShipmentDimensions = new Set<string>()
    if (allShipmentItems) {
      for (const item of allShipmentItems) {
        if (shipmentsWithDimensions.has(item.shipmentId)) {
          ordersWithShipmentDimensions.add(item.warehouseOrderId)
        }
      }
    }
    
    // Filter out orders that have dimensions (either directly through Package or through ShipmentOrder)
    const ordersWithoutData = (ordersWithoutOwnDimensions || []).filter((order: any) => {
      // If order has dimensions through direct Package link (from receiving), it's not missing data
      if (ordersWithDirectPackageDimensions.has(order.id)) {
        return false
      }
      // If order is in a shipment with packages that have dimensions, it's not missing data
      if (ordersWithShipmentDimensions.has(order.id)) {
        return false
      }
      // Otherwise, it's missing data if it doesn't have its own dimensions
      return true
    }).slice(0, 10)

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

