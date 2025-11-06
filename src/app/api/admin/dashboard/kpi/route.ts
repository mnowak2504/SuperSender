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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Revenue MTD
    const { data: invoicesMTD } = await supabase
      .from('Invoice')
      .select('amountEur, type, status')
      .gte('createdAt', startOfMonth.toISOString())

    // Revenue YTD
    const { data: invoicesYTD } = await supabase
      .from('Invoice')
      .select('amountEur, type, status')
      .gte('createdAt', startOfYear.toISOString())

    // Calculate revenues by type
    const calculateRevenue = (invoices: any[]) => {
      return invoices
        .filter(i => i.status === 'PAID')
        .reduce((acc, inv) => {
          const type = inv.type.toLowerCase()
          acc[type] = (acc[type] || 0) + inv.amountEur
          acc.total = (acc.total || 0) + inv.amountEur
          return acc
        }, {} as any)
    }

    const revenueMTD = calculateRevenue(invoicesMTD || [])
    const revenueYTD = calculateRevenue(invoicesYTD || [])

    // Warehouse capacity
    const { data: capacity } = await supabase
      .from('WarehouseCapacity')
      .select('usedCbm, limitCbm')
      .not('limitCbm', 'eq', 0)

    const totalUsedCbm = capacity?.reduce((sum, c) => sum + (c.usedCbm || 0), 0) || 0
    const totalLimitCbm = capacity?.reduce((sum, c) => sum + (c.limitCbm || 0), 0) || 0
    const capacityPercent = totalLimitCbm > 0 ? (totalUsedCbm / totalLimitCbm) * 100 : 0

    // Over capacity clients
    const { data: overCapacity } = await supabase
      .from('WarehouseCapacity')
      .select('*')
      .eq('isOverLimit', true)
      .gt('usagePercent', 90)

    // Overdue invoices (>7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const { data: overdueInvoices } = await supabase
      .from('Invoice')
      .select('id')
      .eq('status', 'ISSUED')
      .lt('dueDate', sevenDaysAgo.toISOString())

    // Pending shipments >24h
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const { data: pendingShipments } = await supabase
      .from('ShipmentOrder')
      .select('id')
      .eq('status', 'AWAITING_ACCEPTANCE')
      .lt('createdAt', oneDayAgo.toISOString())

    // Average processing time (reception to shipment)
    const { data: shippedOrders } = await supabase
      .from('WarehouseOrder')
      .select('createdAt, packedAt')
      .eq('status', 'SHIPPED')
      .not('packedAt', 'is', null)
      .limit(100)

    let avgProcessingTime = 0
    if (shippedOrders && shippedOrders.length > 0) {
      const times = shippedOrders
        .filter(o => o.packedAt)
        .map(o => {
          const created = new Date(o.createdAt).getTime()
          const packed = new Date(o.packedAt).getTime()
          return (packed - created) / (1000 * 60 * 60) // hours
        })
      avgProcessingTime = times.reduce((a, b) => a + b, 0) / times.length
    }

    return NextResponse.json({
      revenue: {
        mtd: {
          total: revenueMTD.total || 0,
          subscription: revenueMTD.subscription || 0,
          transport: revenueMTD.transport || 0,
          operations: revenueMTD.operations || 0,
        },
        ytd: {
          total: revenueYTD.total || 0,
          subscription: revenueYTD.subscription || 0,
          transport: revenueYTD.transport || 0,
          operations: revenueYTD.operations || 0,
        },
      },
      warehouse: {
        usedCbm: totalUsedCbm,
        limitCbm: totalLimitCbm,
        usagePercent: capacityPercent,
        overCapacityClients: overCapacity?.length || 0,
      },
      alerts: {
        overdueInvoices: overdueInvoices?.length || 0,
        pendingShipments24h: pendingShipments?.length || 0,
      },
      performance: {
        avgProcessingTimeHours: avgProcessingTime,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard KPI:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

