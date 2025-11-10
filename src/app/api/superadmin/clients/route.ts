import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/superadmin/clients
 * Get all clients with full details (only SUPERADMIN)
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

    const { searchParams } = new URL(req.url)
    const countryFilter = searchParams.get('country')
    const statusFilter = searchParams.get('status')
    const planIdFilter = searchParams.get('planId')

    // Get all clients with full details
    let query = supabase
      .from('Client')
      .select(`
        id,
        displayName,
        email,
        phone,
        country,
        clientCode,
        status,
        planId,
        subscriptionDiscount,
        additionalServicesDiscount,
        salesOwnerId,
        salesOwner: salesOwnerId (id, name, email),
        plan: planId (id, name, operationsRateEur),
        warehouseCapacity: WarehouseCapacity (*),
        users: User (id, email, name, phone, role),
        createdAt,
        updatedAt
      `)
      .order('createdAt', { ascending: false })

    // Apply filters
    if (countryFilter && countryFilter !== 'ALL') {
      query = query.eq('country', countryFilter)
    }
    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter)
    }
    if (planIdFilter && planIdFilter !== 'ALL') {
      if (planIdFilter === 'NO_PLAN') {
        query = query.is('planId', null)
      } else {
        query = query.eq('planId', planIdFilter)
      }
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Get invoice statistics
    const clientIds = clients?.map(c => c.id) || []
    const { data: invoices } = await supabase
      .from('Invoice')
      .select('clientId, amountEur, status, dueDate, createdAt')
      .in('clientId', clientIds)

    const invoiceStats = (invoices || []).reduce((acc, inv) => {
      if (!acc[inv.clientId]) {
        acc[inv.clientId] = {
          total: 0,
          paid: 0,
          outstanding: 0,
          overdue: 0,
          count: 0,
        }
      }
      acc[inv.clientId].total += inv.amountEur
      acc[inv.clientId].count += 1
      if (inv.status === 'PAID') {
        acc[inv.clientId].paid += inv.amountEur
      } else {
        acc[inv.clientId].outstanding += inv.amountEur
        if (new Date(inv.dueDate) < new Date()) {
          acc[inv.clientId].overdue += inv.amountEur
        }
      }
      return acc
    }, {} as Record<string, any>)

    // Get delivery statistics
    const { data: deliveries } = await supabase
      .from('DeliveryExpected')
      .select('clientId, status, createdAt')
      .in('clientId', clientIds)

    const deliveryStats = (deliveries || []).reduce((acc, del) => {
      if (!acc[del.clientId]) {
        acc[del.clientId] = { total: 0, received: 0, expected: 0 }
      }
      acc[del.clientId].total += 1
      if (del.status === 'RECEIVED') {
        acc[del.clientId].received += 1
      } else if (del.status === 'EXPECTED') {
        acc[del.clientId].expected += 1
      }
      return acc
    }, {} as Record<string, any>)

    // Get shipment statistics
    const { data: shipments } = await supabase
      .from('ShipmentOrder')
      .select('clientId, status, createdAt')
      .in('clientId', clientIds)

    const shipmentStats = (shipments || []).reduce((acc, ship) => {
      if (!acc[ship.clientId]) {
        acc[ship.clientId] = { total: 0, delivered: 0, inTransit: 0 }
      }
      acc[ship.clientId].total += 1
      if (ship.status === 'DELIVERED') {
        acc[ship.clientId].delivered += 1
      } else if (ship.status === 'IN_TRANSIT') {
        acc[ship.clientId].inTransit += 1
      }
      return acc
    }, {} as Record<string, any>)

    // Format clients with all statistics
    const formattedClients = (clients || []).map((client: any) => {
      const capacity = client.warehouseCapacity?.[0] || {}
      const invoices = invoiceStats[client.id] || { total: 0, paid: 0, outstanding: 0, overdue: 0, count: 0 }
      const deliveries = deliveryStats[client.id] || { total: 0, received: 0, expected: 0 }
      const shipments = shipmentStats[client.id] || { total: 0, delivered: 0, inTransit: 0 }

      return {
        id: client.id,
        displayName: client.displayName,
        email: client.email,
        phone: client.phone,
        country: client.country,
        clientCode: client.clientCode,
        status: client.status,
        planId: client.planId,
        plan: client.plan,
        subscriptionDiscount: client.subscriptionDiscount || 0,
        additionalServicesDiscount: client.additionalServicesDiscount || 0,
        salesOwner: client.salesOwner,
        salesOwnerId: client.salesOwnerId,
        usedCbm: capacity.usedCbm || 0,
        limitCbm: capacity.limitCbm || 0,
        usagePercent: capacity.usagePercent || 0,
        isOverLimit: capacity.isOverLimit || false,
        users: client.users || [],
        invoices,
        deliveries,
        shipments,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      }
    })

    // Get unique countries and plans for filters
    const countries = [...new Set((clients || []).map((c: any) => c.country).filter(Boolean))].sort()
    const { data: plans } = await supabase
      .from('Plan')
      .select('id, name, operationsRateEur')
      .order('operationsRateEur', { ascending: true })

    return NextResponse.json({
      clients: formattedClients,
      filters: {
        countries,
        plans: plans || [],
      },
    })
  } catch (error) {
    console.error('Error in GET /api/superadmin/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

