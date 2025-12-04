import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(
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
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { transportChoice, paymentMethod, ownTransportVehicleReg, ownTransportTrailerReg, ownTransportCarrier, ownTransportTrackingNumber, ownTransportPlannedLoadingDate } = body

    if (!['ACCEPT', 'REQUEST_CUSTOM', 'OWN_TRANSPORT'].includes(transportChoice)) {
      return NextResponse.json({ error: 'Invalid transport choice' }, { status: 400 })
    }

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .select('*, Client:clientId(*)')
      .eq('id', id)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Check ownership
    const clientId = (session.user as any)?.clientId
    if (shipment.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update shipment
    const updateData: any = {
      clientTransportChoice: transportChoice,
      customQuoteRequestedAt: transportChoice === 'REQUEST_CUSTOM' ? new Date().toISOString() : null,
    }

    if (transportChoice === 'ACCEPT') {
      updateData.status = 'AWAITING_PAYMENT'
      updateData.acceptedAt = new Date().toISOString()
      updateData.proposedPriceEur = shipment.calculatedPriceEur || shipment.proposedPriceEur
      
      // Always create proforma invoice for transport (even if price is 0, admin can update it later)
      const transportPrice = shipment.calculatedPriceEur || shipment.proposedPriceEur || 0
      // Create invoice regardless of price - admin can update it if needed
      if (true) { // Always create invoice
        const generateCUID = () => {
          const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
          let result = 'inv'
          for (let i = 0; i < 22; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
          }
          return result
        }

        const invoiceId = generateCUID()
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 14) // 14 days to pay

        const { data: invoice, error: invoiceError } = await supabase
          .from('Invoice')
          .insert({
            id: invoiceId,
            clientId: clientId,
            type: 'PROFORMA',
            amountEur: transportPrice,
            currency: 'EUR',
            status: 'ISSUED',
            dueDate: dueDate.toISOString(),
          })
          .select()
          .single()

        if (invoiceError) {
          console.error('[Transport Choice] Error creating transport invoice:', invoiceError)
          console.error('[Transport Choice] Invoice data:', {
            id: invoiceId,
            clientId: clientId,
            type: 'PROFORMA',
            amountEur: transportPrice,
            currency: 'EUR',
            status: 'ISSUED',
            dueDate: dueDate.toISOString(),
          })
          // Don't fail the request, but log the error for debugging
        } else {
          console.log(`[Transport Choice] ✅ Created proforma invoice ${invoiceId} for transport: €${transportPrice}`)
          console.log('[Transport Choice] Invoice details:', invoice)
        }
      }
    } else if (transportChoice === 'OWN_TRANSPORT') {
      updateData.transportMode = 'CLIENT_OWN'
      updateData.status = 'READY_FOR_LOADING'
      // Save own transport details
      updateData.ownTransportVehicleReg = ownTransportVehicleReg || null
      updateData.ownTransportTrailerReg = ownTransportTrailerReg || null
      updateData.ownTransportCarrier = ownTransportCarrier || null
      updateData.ownTransportTrackingNumber = ownTransportTrackingNumber || null
      updateData.ownTransportPlannedLoadingDate = ownTransportPlannedLoadingDate ? new Date(ownTransportPlannedLoadingDate).toISOString() : null
    }

    console.log('[TRANSPORT CHOICE] Updating shipment:', id, 'with data:', updateData)
    const { error: updateError, data: updatedShipment } = await supabase
      .from('ShipmentOrder')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[TRANSPORT CHOICE] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('[TRANSPORT CHOICE] Updated shipment:', updatedShipment?.id, 'status:', updatedShipment?.status, 'choice:', updatedShipment?.clientTransportChoice)

    // If custom quote requested, notify sales owner
    if (transportChoice === 'REQUEST_CUSTOM' && (shipment.Client as any)?.salesOwnerId) {
      // TODO: Send notification to sales owner
      console.log('Custom quote requested for shipment', id, 'salesOwnerId:', (shipment.Client as any).salesOwnerId)
    }

    return NextResponse.json({ success: true, choice: transportChoice })
  } catch (error) {
    console.error('Error saving transport choice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

