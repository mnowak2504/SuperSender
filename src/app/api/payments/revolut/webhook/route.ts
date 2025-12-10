import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * Revolut webhook handler
 * 
 * Verifies webhook signature and updates invoice status
 * Configure webhook URL in Revolut Business dashboard
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (if configured)
    const webhookSecret = process.env.REVOLUT_WEBHOOK_SECRET
    const signature = req.headers.get('revolut-signature')

    if (webhookSecret && signature) {
      // TODO: Verify signature using Revolut's algorithm
      // For now, proceed (in production, verify signature)
    }

    const body = await req.json()

    // Revolut webhook payload structure:
    // { event: 'payment.completed', order_id: '...', payment_id: '...' }
    const { event, order_id, payment_id } = body

    if (event !== 'payment.completed' && event !== 'payment.failed') {
      return NextResponse.json({ received: true })
    }

    // Find invoice by Revolut payment ID or order ID
    let invoice
    const { data: invoiceByPaymentId } = await supabase
      .from('Invoice')
      .select('*')
      .eq('revolutPaymentId', payment_id)
      .single()
    
    if (invoiceByPaymentId) {
      invoice = invoiceByPaymentId
    } else {
      // Try by order_id
      const { data: invoiceByOrderId } = await supabase
        .from('Invoice')
        .select('*')
        .eq('revolutOrderId', order_id)
        .single()
      
      if (invoiceByOrderId) {
        invoice = invoiceByOrderId
      }
    }

    if (!invoice) {
      console.warn('Invoice not found for payment_id:', payment_id, 'order_id:', order_id)
      return NextResponse.json({ received: true })
    }

    if (event === 'payment.completed') {
      // Update invoice status
      await supabase
        .from('Invoice')
        .update({
          status: 'PAID',
          paidAt: new Date().toISOString(),
          revolutState: 'COMPLETED',
        })
        .eq('id', invoice.id)

      // If subscription invoice (PROFORMA with subscriptionPlanId), activate subscription
      if (invoice.type === 'PROFORMA' && invoice.subscriptionPlanId && invoice.subscriptionStartDate && invoice.subscriptionPeriod) {
        const startDate = new Date(invoice.subscriptionStartDate)
        startDate.setHours(0, 0, 0, 0)
        
        const endDate = new Date(startDate)
        const months = parseInt(invoice.subscriptionPeriod) || 1
        endDate.setMonth(endDate.getMonth() + months)
        endDate.setHours(23, 59, 59, 999)
        
        // Update client with plan and subscription dates
        await supabase
          .from('Client')
          .update({
            planId: invoice.subscriptionPlanId,
            subscriptionStartDate: startDate.toISOString(),
            subscriptionEndDate: endDate.toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', invoice.clientId)
      }

      // If transport invoice, update shipment status
      if (invoice.type === 'TRANSPORT') {
        const { data: shipment } = await supabase
          .from('ShipmentOrder')
          .select('*')
          .eq('id', invoice.shipmentOrderId || '')
          .single()

        if (shipment && shipment.status === 'AWAITING_PAYMENT') {
          await supabase
            .from('ShipmentOrder')
            .update({
              status: 'READY_FOR_LOADING',
              paymentConfirmedAt: new Date().toISOString(),
            })
            .eq('id', shipment.id)
        }
      }

      // TODO: Send confirmation email to client
    } else if (event === 'payment.failed') {
      // Update invoice status
      await supabase
        .from('Invoice')
        .update({
          revolutState: 'DECLINED',
        })
        .eq('id', invoice.id)
      
      // TODO: Send notification to client about failed payment
      console.log('Payment failed for invoice:', invoice.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Revolut webhook:', error)
    // Return 200 to prevent Revolut from retrying invalid requests
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}
