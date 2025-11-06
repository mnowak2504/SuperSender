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

    // Get all clients with capacity and invoice info
    const { data: clients, error } = await supabase
      .from('Client')
      .select(`
        id,
        displayName,
        email,
        clientCode,
        status,
        salesOwnerId,
        salesOwner: salesOwnerId (name, email),
        warehouseCapacity: WarehouseCapacity (*)
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get overdue invoices count per client
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const { data: overdueInvoices } = await supabase
      .from('Invoice')
      .select('clientId')
      .eq('status', 'ISSUED')
      .lt('dueDate', sevenDaysAgo.toISOString())

    const overdueCounts = (overdueInvoices || []).reduce((acc, inv) => {
      acc[inv.clientId] = (acc[inv.clientId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get last shipment date per client
    const { data: lastShipments } = await supabase
      .from('ShipmentOrder')
      .select('clientId, createdAt')
      .order('createdAt', { ascending: false })

    const lastShipmentMap = (lastShipments || []).reduce((acc, s) => {
      if (!acc[s.clientId]) {
        acc[s.clientId] = s.createdAt
      }
      return acc
    }, {} as Record<string, string>)

    // Format clients with capacity data
    const formattedClients = (clients || []).map((client: any) => {
      const capacity = client.warehouseCapacity?.[0] || {}
      return {
        id: client.id,
        displayName: client.displayName,
        email: client.email,
        clientCode: client.clientCode,
        status: client.status,
        usedCbm: capacity.usedCbm || 0,
        limitCbm: capacity.limitCbm || 0,
        usagePercent: capacity.usagePercent || 0,
        isOverLimit: capacity.isOverLimit || false,
        salesOwner: client.salesOwner,
        overdueInvoices: overdueCounts[client.id] || 0,
        lastShipment: lastShipmentMap[client.id],
      }
    })

    return NextResponse.json({ clients: formattedClients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

