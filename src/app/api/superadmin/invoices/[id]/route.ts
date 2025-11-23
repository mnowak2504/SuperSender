import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * PUT /api/superadmin/invoices/[id]
 * Update invoice status (only SUPERADMIN)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, paidAt } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    if (!['ISSUED', 'PAID', 'OVERDUE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    }

    // If marking as paid, set paidAt
    if (status === 'PAID') {
      updateData.paidAt = paidAt || new Date().toISOString()
    } else if (status !== 'PAID') {
      // If changing from PAID to something else, clear paidAt
      updateData.paidAt = null
    }

    const { data: updatedInvoice, error } = await supabase
      .from('Invoice')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API /superadmin/invoices/[id] PUT] Error updating invoice:', error)
      return NextResponse.json({ 
        error: 'Failed to update invoice',
        details: error.message || 'Database error occurred'
      }, { status: 500 })
    }

    if (!updatedInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice: updatedInvoice })
  } catch (error) {
    console.error('Error in PUT /api/superadmin/invoices/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/superadmin/invoices/[id]
 * Get invoice details (only SUPERADMIN)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: invoice, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Error in GET /api/superadmin/invoices/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

