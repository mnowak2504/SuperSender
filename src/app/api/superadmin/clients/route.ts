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
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Get all clients with full details
    let query = supabase
      .from('Client')
      .select('*')
    
    // Apply sorting
    if (sortBy === 'subscriptionEndDate') {
      query = query.order('subscriptionEndDate', { ascending: sortOrder === 'asc', nullsFirst: false })
    } else {
      query = query.order(sortBy as any, { ascending: sortOrder === 'asc' })
    }

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
      console.error('Error fetching clients:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2)
      })
      return NextResponse.json({ 
        error: 'Failed to fetch clients',
        details: error.message || 'Unknown error',
        code: error.code
      }, { status: 500 })
    }

    if (!clients) {
      console.error('Clients data is null or undefined')
      return NextResponse.json({ 
        error: 'Failed to fetch clients',
        details: 'No data returned from query'
      }, { status: 500 })
    }

    // Get invoice statistics
    const clientIds = clients?.map(c => c.id) || []
    
    // Get sales owners and plans separately
    const salesOwnerIds = [...new Set((clients || []).map((c: any) => c.salesOwnerId).filter(Boolean))]
    const planIds = [...new Set((clients || []).map((c: any) => c.planId).filter(Boolean))]
    
    let salesOwnerMap: Record<string, any> = {}
    if (salesOwnerIds.length > 0) {
      const { data: salesOwners, error: salesOwnerError } = await supabase
        .from('User')
        .select('id, name, email')
        .in('id', salesOwnerIds)
      
      if (salesOwnerError) {
        console.error('Error fetching sales owners:', salesOwnerError)
      } else {
        (salesOwners || []).forEach((owner: any) => {
          salesOwnerMap[owner.id] = owner
        })
      }
    }
    
    let planMap: Record<string, any> = {}
    if (planIds.length > 0) {
      const { data: plansData, error: plansError } = await supabase
        .from('Plan')
        .select('id, name, operationsRateEur')
        .in('id', planIds)
      
      if (plansError) {
        console.error('Error fetching plans:', plansError)
      } else {
        (plansData || []).forEach((plan: any) => {
          planMap[plan.id] = plan
        })
      }
    }
    
    // Get warehouse capacity for all clients
    let warehouseCapacityMap: Record<string, any> = {}
    if (clientIds.length > 0) {
      const { data: capacities, error: capacityError } = await supabase
        .from('WarehouseCapacity')
        .select('*')
        .in('clientId', clientIds)
      
      if (capacityError) {
        console.error('Error fetching warehouse capacity:', capacityError)
      } else {
        (capacities || []).forEach((cap: any) => {
          warehouseCapacityMap[cap.clientId] = cap
        })
      }
    }
    
    // Only query related data if we have clients
    let invoices: any[] = []
    let deliveries: any[] = []
    let shipments: any[] = []
    let users: any[] = []
    
    if (clientIds.length > 0) {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('Invoice')
        .select('clientId, amountEur, status, dueDate, createdAt')
        .in('clientId', clientIds)
      
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError)
      } else {
        invoices = invoicesData || []
      }

      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('DeliveryExpected')
        .select('clientId, status, createdAt')
        .in('clientId', clientIds)
      
      if (deliveriesError) {
        console.error('Error fetching deliveries:', deliveriesError)
      } else {
        deliveries = deliveriesData || []
      }

      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('ShipmentOrder')
        .select('clientId, status, createdAt')
        .in('clientId', clientIds)
      
      if (shipmentsError) {
        console.error('Error fetching shipments:', shipmentsError)
      } else {
        shipments = shipmentsData || []
      }

      const { data: usersData, error: usersError } = await supabase
        .from('User')
        .select('id, email, name, phone, role, clientId')
        .in('clientId', clientIds)
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
      } else {
        users = usersData || []
      }
    }

    const invoiceStats = invoices.reduce((acc, inv) => {
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

    const deliveryStats = deliveries.reduce((acc, del) => {
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

    const shipmentStats = shipments.reduce((acc, ship) => {
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

    const usersByClientId = users.reduce((acc, user) => {
      if (user.clientId) {
        if (!acc[user.clientId]) {
          acc[user.clientId] = []
        }
        acc[user.clientId].push(user)
      }
      return acc
    }, {} as Record<string, any[]>)

    // Format clients with all statistics
    const formattedClients = (clients || []).map((client: any) => {
      const capacity = warehouseCapacityMap[client.id] || {}
      const invoices = invoiceStats[client.id] || { total: 0, paid: 0, outstanding: 0, overdue: 0, count: 0 }
      const deliveries = deliveryStats[client.id] || { total: 0, received: 0, expected: 0 }
      const shipments = shipmentStats[client.id] || { total: 0, delivered: 0, inTransit: 0 }
      const salesOwner = client.salesOwnerId ? salesOwnerMap[client.salesOwnerId] : null
      const plan = client.planId ? planMap[client.planId] : null

      return {
        id: client.id,
        displayName: client.displayName,
        email: client.email,
        phone: client.phone,
        country: client.country,
        clientCode: client.clientCode,
        status: client.status,
        planId: client.planId,
        plan: plan,
        subscriptionDiscount: client.subscriptionDiscount || 0,
        additionalServicesDiscount: client.additionalServicesDiscount || 0,
        subscriptionStartDate: client.subscriptionStartDate || null,
        subscriptionEndDate: client.subscriptionEndDate || null,
        salesOwner: salesOwner,
        salesOwnerId: client.salesOwnerId,
        usedCbm: capacity.usedCbm || 0,
        limitCbm: capacity.limitCbm || 0,
        usagePercent: capacity.usagePercent || 0,
        isOverLimit: capacity.isOverLimit || false,
        users: usersByClientId[client.id] || [],
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
    console.error('Error in GET /api/superadmin/clients:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fullError: JSON.stringify(error, null, 2)
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

