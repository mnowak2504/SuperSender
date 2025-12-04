import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { generateOrderPDF } from '@/lib/generate-order-pdf'

export const runtime = 'nodejs'

/**
 * GET /api/invoices/[id]/order-pdf
 * Generate and download PDF order document for an invoice
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
    const userId = (session.user as any)?.id
    const clientId = (session.user as any)?.clientId

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .select(`
        *,
        Client:clientId(
          id,
          displayName,
          clientCode,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check permissions
    if (role === 'CLIENT') {
      if (invoice.clientId !== clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only OPERATIONS invoices have order details
    if (invoice.type !== 'OPERATIONS') {
      return NextResponse.json({ error: 'Order PDF only available for operations invoices' }, { status: 400 })
    }

    // Fetch additional charges details for this invoice
    // We need to reconstruct the items from MonthlyAdditionalCharges
    const now = new Date(invoice.createdAt)
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Get the charges that were used to create this invoice
    // Since we reset charges after creating invoice, we need to get from invoice amount
    // We'll create itemised breakdown based on invoice amount and typical charges

    // For now, we'll create a simple breakdown
    // In production, you might want to store the breakdown in a separate table
    const items = []

    // Try to get historical charges if available
    // Note: This is a simplified version - in production you should store itemised details
    const { data: charges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', invoice.clientId)
      .eq('month', month)
      .eq('year', year)
      .single()

    // Build items from charges (if available) or from invoice amount
    if (charges) {
      // We'll reconstruct from the invoice amount
      // Since charges are reset, we'll show a generic breakdown
      items.push({
        description: 'Additional Services and Storage Charges',
        quantity: 1,
        unitPrice: invoice.amountEur,
        total: invoice.amountEur,
      })
    } else {
      // Fallback: single item
      items.push({
        description: 'Additional Services and Storage Charges',
        quantity: 1,
        unitPrice: invoice.amountEur,
        total: invoice.amountEur,
      })
    }

    const vatRate = 0.23 // 23% VAT (Polish standard)
    const subtotal = invoice.amountEur / (1 + vatRate)
    const vatAmount = invoice.amountEur - subtotal

    const orderData = {
      orderNumber: invoice.invoiceNumber || `ORD-${invoice.id.slice(-8).toUpperCase()}`,
      orderDate: invoice.createdAt,
      clientName: (invoice.Client as any)?.displayName || 'Unknown',
      clientCode: (invoice.Client as any)?.clientCode || 'N/A',
      clientEmail: (invoice.Client as any)?.email || '',
      items: items,
      subtotal: subtotal,
      vatRate: vatRate,
      vatAmount: vatAmount,
      total: invoice.amountEur,
      currency: invoice.currency || 'EUR',
      dueDate: invoice.dueDate,
    }

    // Generate PDF
    const pdfBuffer = await generateOrderPDF(orderData)

    // Convert Buffer to ArrayBuffer for NextResponse
    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    )

    // Return PDF
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order-${orderData.orderNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating order PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

