import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/client/proformas
 * Get proforma invoices for client
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get clientId
    let clientId = (session.user as any)?.clientId
    if (!clientId) {
      const { data: client } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (client) {
        clientId = client.id
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get proformas
    const { data: proformas, error } = await supabase
      .from('ProformaInvoice')
      .select('*')
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching proformas:', error)
      return NextResponse.json({ error: 'Failed to fetch proformas' }, { status: 500 })
    }

    return NextResponse.json({ proformas: proformas || [] })
  } catch (error) {
    console.error('Error in GET /api/client/proformas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

