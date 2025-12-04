import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { generateOrderPDF } from '@/lib/generate-order-pdf'

export const runtime = 'nodejs'

/**
 * GET /api/invoices/[id]/itemised-order
 * Generate PDF with itemised breakdown of charges for an order/invoice
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
      .select('*')
      .eq('id', id)
      .single()

    if (invoiceError || !invoice) {
      console.error('[itemised-order] Invoice fetch error:', invoiceError)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch client data separately
    let client: any = null
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .select('id, displayName, clientCode, email')
      .eq('id', invoice.clientId)
      .single()

    if (clientError) {
      console.error('[itemised-order] Client fetch error:', clientError)
    } else {
      client = clientData
    }

    // Check permissions
    if (role === 'CLIENT') {
      if (invoice.clientId !== clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only PROFORMA (and legacy OPERATIONS) invoices have itemised breakdown
    if (invoice.type !== 'OPERATIONS' && invoice.type !== 'PROFORMA') {
      return NextResponse.json({ error: 'Itemised order only available for proforma invoices' }, { status: 400 })
    }

    // Get the month/year when invoice was created
    const invoiceDate = new Date(invoice.createdAt)
    const month = invoiceDate.getMonth() + 1
    const year = invoiceDate.getFullYear()

    // Try to get historical charges
    const { data: charges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', invoice.clientId)
      .eq('month', month)
      .eq('year', year)
      .single()

    // Also check for local collection quotes that might have been included
    const { data: localCollections } = await supabase
      .from('LocalCollectionQuote')
      .select('id, quotedPriceEur, status, createdAt')
      .eq('clientId', invoice.clientId)
      .eq('status', 'ACCEPTED')
      .gte('createdAt', new Date(year, month - 1, 1).toISOString())
      .lt('createdAt', new Date(year, month, 1).toISOString())

    // Build itemised breakdown
    const items: Array<{ description: string; quantity: number; unitPrice: number; total: number }> = []

    // Over-space charges
    if (charges && charges.overSpaceAmountEur > 0) {
      // Calculate over-space details
      const overSpaceCbm = charges.overSpacePaidCbm || 0
      const overSpaceRate = overSpaceCbm > 0 ? charges.overSpaceAmountEur / overSpaceCbm : 0
      
      items.push({
        description: 'Over-space storage',
        quantity: overSpaceCbm,
        unitPrice: overSpaceRate,
        total: charges.overSpaceAmountEur,
      })
    }

    // Additional services (local collection, etc.)
    if (charges && charges.additionalServicesAmountEur > 0) {
      // Add local collection charges
      const localCollectionTotal = localCollections?.reduce((sum, lc) => sum + (lc.quotedPriceEur || 0), 0) || 0
      
      if (localCollectionTotal > 0) {
        items.push({
          description: 'Local collection service',
          quantity: localCollections?.length || 1,
          unitPrice: localCollectionTotal / (localCollections?.length || 1),
          total: localCollectionTotal,
        })
      }

      // If there's remaining amount, add as "Other services"
      const remaining = charges.additionalServicesAmountEur - localCollectionTotal
      if (remaining > 0) {
        items.push({
          description: 'Additional services',
          quantity: 1,
          unitPrice: remaining,
          total: remaining,
        })
      }
    }

    // If no charges data available, create a generic breakdown
    if (items.length === 0) {
      items.push({
        description: 'Additional Services and Storage Charges',
        quantity: 1,
        unitPrice: invoice.amountEur,
        total: invoice.amountEur,
      })
    }

    // Calculate VAT
    const vatRate = 0.23 // 23% VAT
    const subtotal = invoice.amountEur / (1 + vatRate)
    const vatAmount = invoice.amountEur - subtotal

    // Prepare order data for PDF generation
    const orderData = {
      orderNumber: invoice.invoiceNumber || `ORD-${invoice.id.slice(-8).toUpperCase()}`,
      orderDate: invoice.createdAt, // Use createdAt as issue date
      clientName: client?.displayName || 'Unknown',
      clientCode: client?.clientCode || 'N/A',
      clientEmail: client?.email || '',
      items: items,
      subtotal: subtotal,
      vatRate: vatRate,
      vatAmount: vatAmount,
      total: invoice.amountEur,
      currency: invoice.currency || 'EUR',
      dueDate: invoice.createdAt, // Use createdAt instead of dueDate (payment due immediately)
    }

    console.log('[itemised-order] Generating PDF with orderData:', {
      orderNumber: orderData.orderNumber,
      itemsCount: orderData.items.length,
      total: orderData.total,
      clientName: orderData.clientName,
    })

    // Generate PDF
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateOrderPDF(orderData)
      console.log('[itemised-order] PDF generated successfully, size:', pdfBuffer.length)
    } catch (pdfError) {
      console.error('[itemised-order] Error in generateOrderPDF:', pdfError)
      throw pdfError
    }

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    // Return PDF
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proforma-${orderData.orderNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('[itemised-order] Error generating itemised order PDF:', error)
    console.error('[itemised-order] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

