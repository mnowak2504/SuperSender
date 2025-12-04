import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { generateDeliveryNumber } from '@/lib/delivery-number'

export const runtime = 'nodejs'

/**
 * POST /api/client/local-collection-quote/[id]/convert-to-order
 * Convert an accepted local collection quote to a DeliveryExpected order
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Find client
    let clientId = (session.user as any)?.clientId
    if (!clientId) {
      const { data: clientByEmail } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (clientByEmail) {
        clientId = clientByEmail.id
      } else {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
    }

    // Verify quote belongs to client and is in ACCEPTED or SCHEDULED status
    const { data: quote, error: quoteError } = await supabase
      .from('LocalCollectionQuote')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientId)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    if (quote.status !== 'ACCEPTED' && quote.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Only ACCEPTED or SCHEDULED quotes can be converted to orders' },
        { status: 400 }
      )
    }

    // Check if this quote has already been converted (check for DeliveryExpected with matching orderNumber)
    if (quote.orderNumber) {
      const { data: existingDelivery } = await supabase
        .from('DeliveryExpected')
        .select('id')
        .eq('clientId', clientId)
        .eq('orderNumber', quote.orderNumber)
        .single()

      if (existingDelivery) {
        return NextResponse.json(
          { error: 'This quote has already been converted to an order', deliveryId: existingDelivery.id },
          { status: 400 }
        )
      }
    }

    // Generate delivery number
    const deliveryNumber = await generateDeliveryNumber(supabase)

    // Generate ID for DeliveryExpected
    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'cl'
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }
    const deliveryId = generateCUID()

    // Create DeliveryExpected from LocalCollectionQuote
    // Use collection address as supplier info (since it's local collection from supplier)
    const supplierName = quote.collectionAddressLine1
    const goodsDescription = `Local collection: ${quote.widthCm}×${quote.lengthCm}×${quote.heightCm}cm, ${quote.weightKg}kg`
    
    // Combine order details if available
    const fullGoodsDescription = quote.orderDetails 
      ? `${goodsDescription}. ${quote.orderDetails}`
      : goodsDescription

    const { data: delivery, error: deliveryError } = await supabase
      .from('DeliveryExpected')
      .insert({
        id: deliveryId,
        clientId,
        deliveryNumber,
        supplierName,
        goodsDescription: fullGoodsDescription,
        orderNumber: quote.orderNumber || null,
        clientReference: `Local Collection Quote #${quote.id.slice(-8).toUpperCase()}`,
        eta: quote.collectionDateFrom || null,
        status: 'EXPECTED',
      })
      .select()
      .single()

    if (deliveryError) {
      console.error('Error creating delivery from local collection quote:', deliveryError)
      return NextResponse.json(
        { error: 'Failed to create delivery order', details: deliveryError.message },
        { status: 500 }
      )
    }

    // Optionally update quote status to COMPLETED or leave it as is
    // For now, we'll leave it as ACCEPTED/SCHEDULED so client can track both

    return NextResponse.json({
      success: true,
      delivery: {
        id: delivery.id,
        deliveryNumber: delivery.deliveryNumber,
      },
      message: 'Quote converted to delivery order successfully',
    })
  } catch (error) {
    console.error('Error converting quote to order:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

