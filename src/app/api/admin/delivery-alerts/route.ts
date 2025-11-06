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
    const { data: assignedClients } = await supabase
      .from('Client')
      .select('id')
      .eq('salesOwnerId', userId)

    const clientIds = assignedClients?.map(c => c.id) || []

    // Get deliveries that are EXPECTED and older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: pendingDeliveries, error: deliveriesError } = await supabase
      .from('DeliveryExpected')
      .select(`
        id,
        clientId,
        supplierName,
        goodsDescription,
        createdAt,
        Client:clientId(displayName, clientCode, email)
      `)
      .in('clientId', clientIds.length > 0 ? clientIds : [''])
      .eq('status', 'EXPECTED')
      .lt('createdAt', sevenDaysAgo.toISOString())
      .order('createdAt', { ascending: true })

    if (deliveriesError) {
      console.error('Error fetching delivery alerts:', deliveriesError)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    // Calculate days pending for each delivery
    const now = new Date()
    const alerts = (pendingDeliveries || []).map(delivery => {
      const createdAt = new Date(delivery.createdAt)
      const daysPending = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...delivery,
        daysPending,
      }
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Error fetching delivery alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

