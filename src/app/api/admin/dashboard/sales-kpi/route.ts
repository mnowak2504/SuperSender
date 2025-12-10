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
    const isSuperAdmin = role === 'SUPERADMIN'

    // Get admin's assigned clients (for regular admin) or all clients (for superadmin)
    let clientIds: string[] = []
    if (isSuperAdmin) {
      // Superadmin sees all clients
      const { data: allClients } = await supabase.from('Client').select('id')
      clientIds = allClients?.map(c => c.id) || []
    } else {
      // Regular admin sees only assigned clients
      const { data: assignedClients, error: clientsError } = await supabase
        .from('Client')
        .select('id')
        .eq('salesOwnerId', userId)
      clientIds = assignedClients?.map(c => c.id) || []
    }

    // 1. My Accounts - number of assigned clients (or all for superadmin)
    const myAccounts = clientIds.length

    // 2. Pending Deliveries >7d
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: pendingDeliveries, error: deliveriesError } = await supabase
      .from('DeliveryExpected')
      .select('id, createdAt, clientId')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .eq('status', 'EXPECTED')
      .lt('createdAt', sevenDaysAgo.toISOString())

    // 3. Quotes Awaiting Action (custom quote requests)
    // Include both customQuoteRequestedAt IS NOT NULL and clientTransportChoice = 'REQUEST_CUSTOM'
    // For superadmin: get all quotes with admin info
    // For regular admin: get only quotes for assigned clients
    let customQuotesQuery = supabase
      .from('ShipmentOrder')
      .select('id, customQuoteRequestedAt, clientId, clientTransportChoice, Client:clientId(salesOwnerId, salesOwner:User(id, email, name))')
      .or('customQuoteRequestedAt.not.is.null,clientTransportChoice.eq.REQUEST_CUSTOM')
    
    if (!isSuperAdmin) {
      customQuotesQuery = customQuotesQuery.in('clientId', clientIds.length > 0 ? clientIds : [''])
    }
    
    const { data: customQuotes, error: quotesError } = await customQuotesQuery

    // For superadmin: return quotes with admin info and request date
    // For regular admin: just return total count (no time breakdown needed)
    const quotesWithDetails = customQuotes?.map((quote: any) => {
      const client = quote.Client || {}
      const salesOwner = client.salesOwner || {}
      return {
        id: quote.id,
        customQuoteRequestedAt: quote.customQuoteRequestedAt,
        adminEmail: salesOwner.email || null,
        adminName: salesOwner.name || null,
        adminId: client.salesOwnerId || null,
      }
    }) || []

    // 4. Active Subscriptions
    const { data: activeClients, error: activeError } = await supabase
      .from('Client')
      .select('id, planId')
      .in('id', clientIds.length > 0 ? clientIds : [''])
      .not('planId', 'is', null)

    // Get paid invoices for these clients (in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: paidInvoices, error: invoicesError } = await supabase
      .from('Invoice')
      .select('clientId, status, createdAt')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .eq('type', 'SUBSCRIPTION')
      .gte('createdAt', thirtyDaysAgo.toISOString())

    const paidOnTime = paidInvoices?.filter(inv => inv.status === 'PAID').length || 0
    const totalInvoices = paidInvoices?.length || 0
    const paidOnTimePercent = totalInvoices > 0 ? (paidOnTime / totalInvoices) * 100 : 0

    // 5. Local Collection Quotes Awaiting Quote (REQUESTED status)
    // Show all REQUESTED quotes (same as /api/admin/local-collection-quotes endpoint)
    // Admin can see all local collection quotes, not just for assigned clients
    const { data: localCollectionQuotes, error: localQuotesError } = await supabase
      .from('LocalCollectionQuote')
      .select('id, clientId')
      .eq('status', 'REQUESTED')

    return NextResponse.json({
      myAccounts,
      pendingDeliveries7d: pendingDeliveries?.length || 0,
      quotesAwaitingAction: {
        total: customQuotes?.length || 0,
        // For superadmin: include details about which admin handles each quote
        details: isSuperAdmin ? quotesWithDetails : undefined,
      },
      activeSubscriptions: {
        total: activeClients?.length || 0,
        paidOnTimePercent: Math.round(paidOnTimePercent),
      },
      localCollectionQuotesPending: localCollectionQuotes?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching sales KPI:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

