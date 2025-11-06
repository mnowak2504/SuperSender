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
    const { searchParams } = new URL(req.url)
    const country = searchParams.get('country')
    const status = searchParams.get('status')
    const plan = searchParams.get('plan')
    const activity = searchParams.get('activity') // 'active' or 'inactive'

    // Build query
    let query = supabase
      .from('Client')
      .select(`
        id,
        displayName,
        clientCode,
        email,
        country,
        planId,
        limitCbm,
        createdAt,
        Plan:planId(name),
        salesOwnerId
      `)
      .eq('salesOwnerId', userId)

    if (country) {
      query = query.eq('country', country)
    }

    if (plan) {
      query = query.eq('planId', plan)
    }

    const { data: clients, error: clientsError } = await query

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Get warehouse capacity for clients
    const clientIds = clients?.map(c => c.id) || []
    const { data: capacities } = await supabase
      .from('WarehouseCapacity')
      .select('clientId, usedCbm, limitCbm, usagePercent, isOverLimit')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
    
    // Get deliveries this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: deliveriesThisMonth } = await supabase
      .from('DeliveryExpected')
      .select('clientId, status')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .gte('createdAt', startOfMonth.toISOString())

    // Get dispatches this month
    const { data: dispatchesThisMonth } = await supabase
      .from('ShipmentOrder')
      .select('clientId, status')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .gte('createdAt', startOfMonth.toISOString())
      .in('status', ['IN_TRANSIT', 'DELIVERED'])

    // Get custom quotes pending
    const { data: customQuotes } = await supabase
      .from('ShipmentOrder')
      .select('clientId, customQuoteRequestedAt')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .not('customQuoteRequestedAt', 'is', null)
      .eq('status', 'AWAITING_ACCEPTANCE')

    // Get payment status
    const { data: invoices } = await supabase
      .from('Invoice')
      .select('clientId, status, type')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .eq('type', 'SUBSCRIPTION')
      .order('createdAt', { ascending: false })

    // Aggregate data per client
    const clientsWithData = clients?.map(client => {
      const deliveries = deliveriesThisMonth?.filter(d => d.clientId === client.id && d.status === 'RECEIVED').length || 0
      const dispatches = dispatchesThisMonth?.filter(d => d.clientId === client.id).length || 0
      const customQuotesCount = customQuotes?.filter(q => q.clientId === client.id).length || 0
      
      const clientInvoices = invoices?.filter(i => i.clientId === client.id) || []
      const latestInvoice = clientInvoices[0]
      const paymentStatus = latestInvoice?.status === 'PAID' ? 'PAID' : latestInvoice ? 'PENDING' : 'NO_INVOICE'

      const capacity = capacities?.find(c => c.clientId === client.id)

      // Check activity (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const isActive = new Date(client.createdAt) > thirtyDaysAgo || deliveries > 0 || dispatches > 0

      return {
        id: client.id,
        displayName: client.displayName,
        clientCode: client.clientCode,
        email: client.email,
        country: client.country,
        plan: client.Plan?.name || 'No Plan',
        planId: client.planId,
        storageUsed: capacity?.usedCbm || 0,
        storageLimit: capacity?.limitCbm || client.limitCbm || 0,
        storagePercent: capacity?.usagePercent || 0,
        deliveriesThisMonth: deliveries,
        dispatchesThisMonth: dispatches,
        customQuotes: customQuotesCount,
        paymentStatus,
        assignedSince: client.createdAt,
        isActive,
      }
    }) || []

    // Apply activity filter
    let filteredClients = clientsWithData
    if (activity === 'active') {
      filteredClients = filteredClients.filter(c => c.isActive)
    } else if (activity === 'inactive') {
      filteredClients = filteredClients.filter(c => !c.isActive)
    }

    // Apply status filter (payment status)
    if (status) {
      filteredClients = filteredClients.filter(c => c.paymentStatus === status)
    }

    return NextResponse.json({ clients: filteredClients })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

