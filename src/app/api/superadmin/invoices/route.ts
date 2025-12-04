import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/superadmin/invoices
 * Get all invoices (only SUPERADMIN)
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('Invoice')
      .select(`
        *,
        client:Client (
          id,
          displayName,
          email,
          clientCode
        )
      `)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('clientId', clientId)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('[API /superadmin/invoices GET] Error fetching invoices:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch invoices',
        details: error.message || 'Database error occurred'
      }, { status: 500 })
    }

    // Map invoices and add paymentMethod from ShipmentOrder if available
    const mappedInvoices = (invoices || []).map((invoice: any) => {
      // If invoice has shipmentOrder relation, use its paymentMethod
      // Otherwise use invoice's own paymentMethod field
      const paymentMethod = invoice.shipmentOrder?.paymentMethod || invoice.paymentMethod || null
      return {
        ...invoice,
        paymentMethod,
        shipmentOrder: undefined // Remove nested object from response
      }
    })

    return NextResponse.json({ invoices: mappedInvoices })
  } catch (error) {
    console.error('Error in GET /api/superadmin/invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

