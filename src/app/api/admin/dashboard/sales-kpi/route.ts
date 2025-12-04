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

    // Get admin's assigned clients
    const { data: assignedClients, error: clientsError } = await supabase
      .from('Client')
      .select('id')
      .eq('salesOwnerId', userId)

    const clientIds = assignedClients?.map(c => c.id) || []

    // 1. My Accounts - number of assigned clients
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
    const { data: customQuotes, error: quotesError } = await supabase
      .from('ShipmentOrder')
      .select('id, customQuoteRequestedAt, clientId')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .not('customQuoteRequestedAt', 'is', null)
      .eq('status', 'AWAITING_ACCEPTANCE')

    // Count quotes by time pending (excluding weekends)
    const now = new Date()
    const quotesByTime = customQuotes?.map(quote => {
      if (!quote.customQuoteRequestedAt) return { hours: 0 }
      const requested = new Date(quote.customQuoteRequestedAt)
      let hours = (now.getTime() - requested.getTime()) / (1000 * 60 * 60)
      
      // Remove weekend hours (simplified: subtract 48h for each weekend)
      const daysDiff = Math.floor(hours / 24)
      const weekends = Math.floor(daysDiff / 7)
      hours -= weekends * 48
      
      return { hours }
    }) || []

    const quotesOver24h = quotesByTime.filter(q => q.hours > 24).length
    const quotesOver48h = quotesByTime.filter(q => q.hours > 48).length

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
        over24h: quotesOver24h,
        over48h: quotesOver48h,
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

