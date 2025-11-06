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
    // Allow CLIENT, ADMIN, and SUPERADMIN to confirm delivery
    if (role !== 'CLIENT' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .select('id, status, clientId, items:ShipmentItem(warehouseOrderId)')
      .eq('id', id)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Check ownership for CLIENT
    if (role === 'CLIENT') {
      const clientId = (session.user as any)?.clientId
      if (shipment.clientId !== clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if shipment can be confirmed (must be IN_TRANSIT)
    if (shipment.status !== 'IN_TRANSIT') {
      return NextResponse.json(
        { error: `Cannot confirm delivery for shipment with status: ${shipment.status}` },
        { status: 400 }
      )
    }

    // Update shipment status to DELIVERED
    const { error: updateError } = await supabase
      .from('ShipmentOrder')
      .update({
        status: 'DELIVERED',
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating shipment status:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update all related WarehouseOrders to DELIVERED
    const warehouseOrderIds = (shipment.items || []).map((item: any) => item.warehouseOrderId).filter(Boolean)
    
    if (warehouseOrderIds.length > 0) {
      const { error: ordersUpdateError } = await supabase
        .from('WarehouseOrder')
        .update({ status: 'DELIVERED' })
        .in('id', warehouseOrderIds)

      if (ordersUpdateError) {
        console.error('Error updating warehouse orders status:', ordersUpdateError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ success: true, shipmentId: id })
  } catch (error) {
    console.error('Error confirming delivery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

