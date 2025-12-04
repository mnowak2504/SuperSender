import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/invoices/[id]/itemised-order
 * Get itemised breakdown of charges for an order/invoice
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

    // Only OPERATIONS invoices have itemised breakdown
    if (invoice.type !== 'OPERATIONS') {
      return NextResponse.json({ error: 'Itemised order only available for operations invoices' }, { status: 400 })
    }

    // Get the month/year when invoice was created
    const invoiceDate = new Date(invoice.createdAt)
    const month = invoiceDate.getMonth() + 1
    const year = invoiceDate.getFullYear()

    // Try to get historical charges
    // Note: Since charges are reset after invoice creation, we'll reconstruct from invoice amount
    // In production, you might want to store itemised details in a separate table

    // For now, we'll create a breakdown based on typical charges
    // This is a simplified version - in production store the actual breakdown
    const items = []

    // Try to get any remaining charges data
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
    // Over-space charges
    if (charges && charges.overSpaceAmountEur > 0) {
      // Calculate over-space details
      const overSpaceCbm = charges.overSpacePaidCbm || 0
      const overSpaceRate = overSpaceCbm > 0 ? charges.overSpaceAmountEur / overSpaceCbm : 0
      
      items.push({
        description: 'Over-space storage',
        quantity: overSpaceCbm,
        unit: 'm³',
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
          unit: 'collection',
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
          unit: 'service',
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
        unit: 'order',
        unitPrice: invoice.amountEur,
        total: invoice.amountEur,
      })
    }

    // Calculate VAT
    const vatRate = 0.23 // 23% VAT
    const subtotal = invoice.amountEur / (1 + vatRate)
    const vatAmount = invoice.amountEur - subtotal

    return NextResponse.json({
      orderNumber: invoice.invoiceNumber || `ORD-${invoice.id.slice(-8).toUpperCase()}`,
      orderDate: invoice.createdAt,
      items: items,
      subtotal: subtotal,
      vatRate: vatRate,
      vatAmount: vatAmount,
      total: invoice.amountEur,
      currency: invoice.currency || 'EUR',
    })
  } catch (error) {
    console.error('Error fetching itemised order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

