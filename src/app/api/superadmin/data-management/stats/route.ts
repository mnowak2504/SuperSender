import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/superadmin/data-management/stats
 * Get data statistics (only SUPERADMIN)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch counts for different entities
    const [deliveriesRes, warehouseOrdersRes, shipmentOrdersRes, invoicesRes, mediaRes, clientsRes, usersRes] = await Promise.all([
      supabase.from('DeliveryExpected').select('id', { count: 'exact', head: true }),
      supabase.from('WarehouseOrder').select('id', { count: 'exact', head: true }),
      supabase.from('ShipmentOrder').select('id', { count: 'exact', head: true }),
      supabase.from('Invoice').select('id', { count: 'exact', head: true }),
      supabase.from('Media').select('id', { count: 'exact', head: true }),
      supabase.from('Client').select('id', { count: 'exact', head: true }),
      supabase.from('User').select('id', { count: 'exact', head: true }).neq('role', 'CLIENT'),
    ])

    const stats = {
      deliveries: deliveriesRes.count || 0,
      warehouseOrders: warehouseOrdersRes.count || 0,
      shipmentOrders: shipmentOrdersRes.count || 0,
      invoices: invoicesRes.count || 0,
      media: mediaRes.count || 0,
      clients: clientsRes.count || 0,
      users: usersRes.count || 0,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error in GET /api/superadmin/data-management/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

