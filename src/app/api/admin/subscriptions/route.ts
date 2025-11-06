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

    // Get admin's assigned clients with plans
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select(`
        id,
        displayName,
        clientCode,
        planId,
        Plan:planId(
          id,
          name,
          deliveriesPerMonth,
          spaceLimitCbm,
          operationsRateEur
        )
      `)
      .eq('salesOwnerId', userId)
      .not('planId', 'is', null)

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    const clientIds = clients?.map(c => c.id) || []
    
    // Get operations this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: deliveriesThisMonth } = await supabase
      .from('DeliveryExpected')
      .select('clientId')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .gte('createdAt', startOfMonth.toISOString())
      .eq('status', 'RECEIVED')

    const { data: dispatchesThisMonth } = await supabase
      .from('ShipmentOrder')
      .select('clientId')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .gte('createdAt', startOfMonth.toISOString())
      .in('status', ['IN_TRANSIT', 'DELIVERED'])

    // Get latest invoices for payment status
    const { data: invoices } = await supabase
      .from('Invoice')
      .select('clientId, status, dueDate, createdAt')
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .eq('type', 'SUBSCRIPTION')
      .order('createdAt', { ascending: false })

    // Build subscriptions data
    const subscriptions = clients?.map(client => {
      const deliveries = deliveriesThisMonth?.filter(d => d.clientId === client.id).length || 0
      const dispatches = dispatchesThisMonth?.filter(d => d.clientId === client.id).length || 0
      
      const clientInvoices = invoices?.filter(i => i.clientId === client.id) || []
      const latestInvoice = clientInvoices[0]
      
      let paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' = 'PENDING'
      if (latestInvoice) {
        if (latestInvoice.status === 'PAID') {
          paymentStatus = 'PAID'
        } else {
          const dueDate = new Date(latestInvoice.dueDate)
          const now = new Date()
          if (dueDate < now) {
            paymentStatus = 'OVERDUE'
          } else {
            paymentStatus = 'PENDING'
          }
        }
      }

      const plan = client.Plan as any
      // Monthly value is calculated from operationsRateEur or can be from invoice
      // For now, use operationsRateEur as base monthly fee
      const monthlyValue = plan?.operationsRateEur || 0

      // Calculate next billing (simplified: 30 days from last invoice or now)
      const lastInvoiceDate = latestInvoice ? new Date(latestInvoice.createdAt) : new Date()
      const nextBilling = new Date(lastInvoiceDate)
      nextBilling.setDate(nextBilling.getDate() + 30)

      return {
        id: client.id,
        clientId: client.id,
        displayName: client.displayName,
        clientCode: client.clientCode,
        plan: plan?.name || 'Unknown',
        renewalDate: null, // TODO: Calculate from subscription
        paymentStatus,
        deliveriesUsed: deliveries,
        deliveriesLimit: plan?.deliveriesPerMonth || 0,
        dispatchesUsed: dispatches,
        dispatchesLimit: plan?.deliveriesPerMonth || 0, // Using same limit for dispatches (simplified)
        nextBilling: nextBilling.toISOString(),
        monthlyValue,
      }
    }) || []

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

