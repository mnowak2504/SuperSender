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
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, paidAt, invoiceNumber } = body

    // Build update object
    const updateData: any = {}

    // Update status if provided
    if (status) {
      if (!['ISSUED', 'PAID', 'OVERDUE'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status

      // If marking as paid, set paidAt
      if (status === 'PAID') {
        updateData.paidAt = paidAt || new Date().toISOString()
      } else if (status !== 'PAID') {
        // If changing from PAID to something else, clear paidAt
        updateData.paidAt = null
      }
    }

    // Update invoiceNumber if provided (can be empty string to clear it)
    if (invoiceNumber !== undefined) {
      updateData.invoiceNumber = invoiceNumber || null
    }

    // At least one field must be provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'At least one field (status or invoiceNumber) is required' }, { status: 400 })
    }

    console.log('[API /superadmin/invoices/[id] PUT] Updating invoice:', {
      invoiceId: id,
      updateData,
      userId: (session.user as any)?.id,
    })

    const { data: updatedInvoice, error } = await supabase
      .from('Invoice')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API /superadmin/invoices/[id] PUT] Error updating invoice:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        invoiceId: id,
        updateData,
      })
      return NextResponse.json({ 
        error: 'Failed to update invoice',
        details: error.message || error.details || 'Database error occurred',
        code: error.code,
        hint: error.hint,
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
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
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

