import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { calculateVolumeCbm } from '@/lib/warehouse-calculations'
import { generateInternalTrackingNumber } from '@/lib/internal-tracking-number'
import { updateMonthlyAdditionalCharges } from '@/lib/update-additional-charges'

export const runtime = 'nodejs'

/**
 * POST /api/warehouse/receive-local-collection/[id]
 * Receive a local collection quote at the warehouse
 * Changes status to COMPLETED and creates WarehouseOrder
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
    if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only warehouse users can receive local collections' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { condition, warehouseLocation, warehouseInternalNumber, notes, widthCm, lengthCm, heightCm } = body

    // Validate dimensions
    if (!widthCm || !lengthCm || !heightCm || widthCm <= 0 || lengthCm <= 0 || heightCm <= 0) {
      return NextResponse.json(
        { error: 'Wymiary przesyłki są wymagane i muszą być większe od zera' },
        { status: 400 }
      )
    }

    // Verify quote exists and is in ACCEPTED or SCHEDULED status
    const { data: quote, error: quoteError } = await supabase
      .from('LocalCollectionQuote')
      .select('*, Client:clientId(id, displayName, email)')
      .eq('id', id)
      .single()

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Local collection quote not found' }, { status: 404 })
    }

    if (quote.status !== 'ACCEPTED' && quote.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Only ACCEPTED or SCHEDULED quotes can be received' },
        { status: 400 }
      )
    }

    const clientId = quote.clientId

    // Check if there's a DeliveryExpected created from this local collection quote
    // (when client converted it to order)
    // Look for DeliveryExpected with clientReference containing the quote ID
    const quoteIdShort = quote.id.slice(-8).toUpperCase()
    const { data: relatedDelivery, error: deliverySearchError } = await supabase
      .from('DeliveryExpected')
      .select('id, status')
      .eq('clientId', clientId)
      .like('clientReference', `%Local Collection Quote #${quoteIdShort}%`)
      .eq('status', 'EXPECTED')
      .single()

    let sourceDeliveryId: string | null = null
    if (relatedDelivery && !deliverySearchError) {
      // Update DeliveryExpected status to RECEIVED
      const { error: updateDeliveryError } = await supabase
        .from('DeliveryExpected')
        .update({
          status: 'RECEIVED',
        })
        .eq('id', relatedDelivery.id)

      if (updateDeliveryError) {
        console.warn('Could not update DeliveryExpected status:', updateDeliveryError)
      } else {
        sourceDeliveryId = relatedDelivery.id
      }
    }

    // Generate ID for WarehouseOrder
    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'cl'
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }
    const warehouseOrderId = generateCUID()

    // Generate internal tracking number
    let internalTrackingNumber: string | null = null
    try {
      internalTrackingNumber = await generateInternalTrackingNumber(supabase)
    } catch (err) {
      console.warn('Could not generate internal tracking number:', err)
    }

    // Calculate volume from warehouse-provided dimensions (not quote dimensions)
    const volumeCbm = calculateVolumeCbm(
      widthCm,
      lengthCm,
      heightCm
    )

    // Build notes with condition info if damaged
    let finalNotes = notes || ''
    if (condition !== 'NO_REMARKS') {
      const conditionMessages: Record<string, string> = {
        MINOR_DAMAGE: 'Uszkodzenie opakowania nie zagrażające zawartości',
        MODERATE_DAMAGE: 'Poważniejsze uszkodzenie opakowania - zawartość do weryfikacji',
        SEVERE_DAMAGE: 'Poważne uszkodzenie',
      }
      const conditionMessage = conditionMessages[condition] || 'Uszkodzenie opakowania'
      
      if (finalNotes) {
        finalNotes += '\n\n'
      }
      finalNotes += `Stan opakowań: ${conditionMessage}. Przedstawiciel handlowy wyśle zdjęcia uszkodzenia w ciągu 24h do potwierdzenia jaka powinna być dalsza akcja.`
    }

    // Create WarehouseOrder
    const insertData: any = {
      id: warehouseOrderId,
      clientId,
      sourceDeliveryId: sourceDeliveryId, // Link to DeliveryExpected if it exists
      status: condition === 'NO_REMARKS' ? 'AT_WAREHOUSE' : 'DAMAGED',
      packedLengthCm: Math.round(lengthCm),
      packedWidthCm: Math.round(widthCm),
      packedHeightCm: Math.round(heightCm),
      packedWeightKg: quote.weightKg, // Keep weight from quote
      warehouseLocation: warehouseLocation || null,
      warehouseInternalNumber: warehouseInternalNumber || null,
      notes: finalNotes || null,
      receivedAt: new Date().toISOString(),
    }

    if (internalTrackingNumber !== null) {
      insertData.internalTrackingNumber = internalTrackingNumber
    }

    const { error: warehouseOrderError } = await supabase
      .from('WarehouseOrder')
      .insert(insertData)

    if (warehouseOrderError) {
      console.error('Error creating warehouse order:', warehouseOrderError)
      return NextResponse.json(
        { error: 'Failed to create warehouse order', details: warehouseOrderError.message },
        { status: 500 }
      )
    }

    // Create Package record
    const packageId = generateCUID()
    const { error: packageError } = await supabase
      .from('Package')
      .insert({
        id: packageId,
        warehouseOrderId: warehouseOrderId,
        type: 'PACKAGE',
        widthCm: Math.round(widthCm),
        lengthCm: Math.round(lengthCm),
        heightCm: Math.round(heightCm),
        weightKg: quote.weightKg, // Keep weight from quote
        volumeCbm: volumeCbm,
      })

    if (packageError) {
      console.error('Error creating package:', packageError)
      // Don't fail the operation if package creation fails, but log it
    }

    // Update LocalCollectionQuote status to COMPLETED
    const { error: updateQuoteError } = await supabase
      .from('LocalCollectionQuote')
      .update({
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateQuoteError) {
      console.error('Error updating quote status:', updateQuoteError)
      // Don't fail the operation, but log it
    }

    // Update warehouse capacity
    try {
      await supabase.rpc('update_client_warehouse_capacity', { client_id: clientId })
      
      // Automatically update monthly additional charges (over-space)
      await updateMonthlyAdditionalCharges(clientId)
    } catch (capacityError) {
      console.warn('Could not update warehouse capacity:', capacityError)
      // Don't fail the operation if capacity update fails
    }

    return NextResponse.json({
      success: true,
      warehouseOrderId,
      message: 'Local collection received successfully',
    })
  } catch (error) {
    console.error('Error receiving local collection:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

