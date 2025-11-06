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
    if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN' && role !== 'ADMIN') {
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

    // Check if shipment can be confirmed (must be READY_FOR_LOADING or AWAITING_ACCEPTANCE)
    if (shipment.status !== 'READY_FOR_LOADING' && shipment.status !== 'AWAITING_ACCEPTANCE') {
      return NextResponse.json(
        { error: `Cannot confirm shipment with status: ${shipment.status}` },
        { status: 400 }
      )
    }

    // Update shipment status to IN_TRANSIT (shipped)
    const { error: updateError } = await supabase
      .from('ShipmentOrder')
      .update({
        status: 'IN_TRANSIT',
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating shipment status:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Update all related WarehouseOrders to SHIPPED
    const warehouseOrderIds = (shipment.items || []).map((item: any) => item.warehouseOrderId).filter(Boolean)
    
    if (warehouseOrderIds.length > 0) {
      const { error: ordersUpdateError } = await supabase
        .from('WarehouseOrder')
        .update({ status: 'SHIPPED' })
        .in('id', warehouseOrderIds)

      if (ordersUpdateError) {
        console.error('Error updating warehouse orders status:', ordersUpdateError)
        // Don't fail the request, just log the error
      }
    }

    // Update warehouse capacity (remove shipped items from capacity)
    // This will be handled by the trigger, but we can also call it explicitly
    const clientId = shipment.clientId
    if (clientId) {
      // Call the RPC function to recalculate capacity
      await supabase.rpc('update_client_warehouse_capacity', { client_id: clientId })
    }

    return NextResponse.json({ success: true, shipmentId: id })
  } catch (error) {
    console.error('Error confirming shipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

