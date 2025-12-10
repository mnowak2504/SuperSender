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

    // If marking transport invoice (TRANSPORT or PROFORMA without subscriptionPlanId) as paid, update shipment status
    if (status === 'PAID' && (updatedInvoice.type === 'TRANSPORT' || (updatedInvoice.type === 'PROFORMA' && !updatedInvoice.subscriptionPlanId))) {
      console.log('[API /superadmin/invoices/[id] PUT] Transport invoice marked as paid, updating shipment status')
      
      // Find shipment with AWAITING_PAYMENT status for this client
      // Match by invoice amount and date proximity (within 1 day of invoice creation)
      const invoiceCreatedDate = new Date(updatedInvoice.createdAt)
      const oneDayBefore = new Date(invoiceCreatedDate)
      oneDayBefore.setDate(oneDayBefore.getDate() - 1)
      const oneDayAfter = new Date(invoiceCreatedDate)
      oneDayAfter.setDate(oneDayAfter.getDate() + 1)
      
      const { data: shipments, error: shipmentsError } = await supabase
        .from('ShipmentOrder')
        .select('id, status, calculatedPriceEur, createdAt')
        .eq('clientId', updatedInvoice.clientId)
        .eq('status', 'AWAITING_PAYMENT')
        .gte('createdAt', oneDayBefore.toISOString())
        .lte('createdAt', oneDayAfter.toISOString())
      
      if (shipmentsError) {
        console.error('[API /superadmin/invoices/[id] PUT] Error finding shipments:', shipmentsError)
      } else if (shipments && shipments.length > 0) {
        // Find best matching shipment (by price or most recent)
        let matchingShipment = shipments.find(s => 
          s.calculatedPriceEur && Math.abs(s.calculatedPriceEur - updatedInvoice.amountEur) < 0.01
        )
        
        // If no price match, use most recent
        if (!matchingShipment) {
          matchingShipment = shipments.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        }
        
        if (matchingShipment) {
          console.log('[API /superadmin/invoices/[id] PUT] Found matching shipment:', matchingShipment.id)
          
          // Update shipment status to READY_FOR_LOADING
          const { error: updateShipmentError } = await supabase
            .from('ShipmentOrder')
            .update({
              status: 'READY_FOR_LOADING',
              paymentConfirmedAt: new Date().toISOString(),
            })
            .eq('id', matchingShipment.id)
          
          if (updateShipmentError) {
            console.error('[API /superadmin/invoices/[id] PUT] Error updating shipment status:', updateShipmentError)
          } else {
            console.log('[API /superadmin/invoices/[id] PUT] Updated shipment status to READY_FOR_LOADING')
            
            // Update all WarehouseOrders in this shipment to READY_TO_SHIP
            const { data: shipmentItems, error: itemsError } = await supabase
              .from('ShipmentItem')
              .select('warehouseOrderId')
              .eq('shipmentId', matchingShipment.id)
            
            if (itemsError) {
              console.error('[API /superadmin/invoices/[id] PUT] Error fetching shipment items:', itemsError)
            } else if (shipmentItems && shipmentItems.length > 0) {
              const warehouseOrderIds = shipmentItems.map(item => item.warehouseOrderId).filter(Boolean)
              
              if (warehouseOrderIds.length > 0) {
                const { error: updateOrdersError } = await supabase
                  .from('WarehouseOrder')
                  .update({ status: 'READY_TO_SHIP' })
                  .in('id', warehouseOrderIds)
                
                if (updateOrdersError) {
                  console.error('[API /superadmin/invoices/[id] PUT] Error updating warehouse orders:', updateOrdersError)
                } else {
                  console.log(`[API /superadmin/invoices/[id] PUT] Updated ${warehouseOrderIds.length} warehouse orders to READY_TO_SHIP`)
                }
              }
            }
          }
        }
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

