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

    // Queue 1: To verify after packing
    const { data: toVerify } = await supabase
      .from('WarehouseOrder')
      .select(`
        id,
        status,
        packedAt,
        clientId,
        Client:clientId (displayName, clientCode)
      `)
      .eq('status', 'READY_TO_SHIP')
      .order('packedAt', { ascending: false })
      .limit(20)

    // Queue 2: Awaiting client decision
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { data: awaitingDecision } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        status,
        calculatedPriceEur,
        createdAt,
        clientId,
        Client:clientId (displayName, clientCode)
      `)
      .eq('status', 'AWAITING_ACCEPTANCE')
      .order('createdAt', { ascending: true })
      .limit(20)

    // Queue 3: Ready for loading
    const { data: readyForLoading } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        status,
        paymentConfirmedAt,
        loadingSlotFrom,
        loadingSlotTo,
        clientId,
        Client:clientId (displayName, clientCode)
      `)
      .in('status', ['READY_FOR_LOADING', 'AWAITING_PAYMENT'])
      .order('paymentConfirmedAt', { ascending: false, nullsFirst: false })
      .limit(20)

    // Calculate time in queue
    const addTimeInQueue = (items: any[]) => {
      return items.map(item => {
        const createdAt = new Date(item.createdAt || item.packedAt)
        const hours = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60))
        return {
          ...item,
          timeInQueue: hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`,
          hoursInQueue: hours,
        }
      })
    }

    return NextResponse.json({
      toVerify: addTimeInQueue(toVerify || []),
      awaitingDecision: addTimeInQueue(awaitingDecision || []),
      readyForLoading: readyForLoading || [],
    })
  } catch (error) {
    console.error('Error fetching queues:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

