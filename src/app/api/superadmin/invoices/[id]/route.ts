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
    const { status, paidAt, invoiceNumber, paymentMethod } = body

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

    // Update paymentMethod if provided
    if (paymentMethod !== undefined) {
      if (paymentMethod && !['BANK_TRANSFER', 'PAYMENT_LINK_REQUESTED'].includes(paymentMethod)) {
        return NextResponse.json({ error: 'Invalid paymentMethod' }, { status: 400 })
      }
      updateData.paymentMethod = paymentMethod || null
    }

    // At least one field must be provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'At least one field (status, invoiceNumber, or paymentMethod) is required' }, { status: 400 })
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

    // If payment link requested for subscription invoice (PROFORMA with subscriptionPlanId), activate subscription immediately
    if (paymentMethod === 'PAYMENT_LINK_REQUESTED' && updatedInvoice.type === 'PROFORMA' && updatedInvoice.subscriptionPlanId && updatedInvoice.subscriptionStartDate && updatedInvoice.subscriptionPeriod) {
      const startDate = new Date(updatedInvoice.subscriptionStartDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      const months = parseInt(updatedInvoice.subscriptionPeriod) || 1
      endDate.setMonth(endDate.getMonth() + months)
      endDate.setHours(23, 59, 59, 999)
      
      // Update client with plan and subscription dates (activate immediately)
      const { error: updateClientError } = await supabase
        .from('Client')
        .update({
          planId: updatedInvoice.subscriptionPlanId,
          subscriptionStartDate: startDate.toISOString(),
          subscriptionEndDate: endDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', updatedInvoice.clientId)

      if (updateClientError) {
        console.error('Error activating subscription after payment link requested:', updateClientError)
        // Don't fail the request, but log the error
      }
    }

    // If marking subscription invoice (PROFORMA with subscriptionPlanId) as paid, activate the subscription
    if (status === 'PAID' && updatedInvoice.type === 'PROFORMA' && updatedInvoice.subscriptionPlanId && updatedInvoice.subscriptionStartDate && updatedInvoice.subscriptionPeriod) {
      const startDate = new Date(updatedInvoice.subscriptionStartDate)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(startDate)
      const months = parseInt(updatedInvoice.subscriptionPeriod) || 1
      endDate.setMonth(endDate.getMonth() + months)
      endDate.setHours(23, 59, 59, 999)
      
      // Update client with plan and subscription dates
      const { error: updateClientError } = await supabase
        .from('Client')
        .update({
          planId: updatedInvoice.subscriptionPlanId,
          subscriptionStartDate: startDate.toISOString(),
          subscriptionEndDate: endDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', updatedInvoice.clientId)

      if (updateClientError) {
        console.error('Error activating subscription after marking invoice as paid:', updateClientError)
        // Don't fail the request, but log the error
      }
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

