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

    const userId = (session.user as any)?.id

    // For ADMIN: get their assigned countries, for SUPERADMIN: no filter
    let countryFilter: string[] | null = null
    if (role === 'ADMIN') {
      const { data: adminUser, error: adminError } = await supabase
        .from('User')
        .select('countries')
        .eq('id', userId)
        .single()

      if (adminError) {
        console.error('Error fetching admin user:', adminError)
        return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 })
      }

      // If admin has countries assigned, filter by them. If null/empty, they see all clients.
      if (adminUser?.countries && Array.isArray(adminUser.countries) && adminUser.countries.length > 0) {
        countryFilter = adminUser.countries
      }
    }

    // Build query
    let query = supabase
      .from('Client')
      .select(`
        id,
        displayName,
        email,
        clientCode,
        status,
        country,
        limitCbm,
        planId,
        salesOwnerId,
        salesOwner: salesOwnerId (name, email),
        warehouseCapacity: WarehouseCapacity (*),
        Plan:planId(spaceLimitCbm)
      `)

    // Apply country filter for ADMIN
    if (countryFilter && countryFilter.length > 0) {
      query = query.in('country', countryFilter)
    }

    const { data: clients, error } = await query

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
      
      // Get limit from capacity, client.limitCbm, or plan
      const planLimit = (Array.isArray(client.Plan) && client.Plan.length > 0
        ? (client.Plan[0] as any)?.spaceLimitCbm
        : (client.Plan as any)?.spaceLimitCbm) || 0
      const limitCbm = capacity.limitCbm || client.limitCbm || planLimit || 0
      const usedCbm = capacity.usedCbm || 0
      const usagePercent = limitCbm > 0 ? (usedCbm / limitCbm) * 100 : 0
      const isOverLimit = usedCbm > limitCbm
      
      return {
        id: client.id,
        displayName: client.displayName,
        email: client.email,
        clientCode: client.clientCode,
        status: client.status,
        usedCbm: usedCbm,
        limitCbm: limitCbm,
        usagePercent: usagePercent,
        isOverLimit: isOverLimit,
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

