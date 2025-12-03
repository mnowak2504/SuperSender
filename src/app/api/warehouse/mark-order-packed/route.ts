import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * API endpoint to mark/unmark a warehouse order as packed within a shipment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const role = (session.user as any)?.role
    if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only warehouse users can mark orders as packed' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { shipmentId, warehouseOrderId, isPacked } = body

    if (!shipmentId || !warehouseOrderId || typeof isPacked !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: shipmentId, warehouseOrderId, and isPacked' },
        { status: 400 }
      )
    }

    // Verify shipment exists and is in REQUESTED status
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .select('id, status')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    if (shipment.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: `Shipment cannot be modified. Current status: ${shipment.status}` },
        { status: 400 }
      )
    }

    // Verify warehouse order belongs to this shipment
    const { data: shipmentItem, error: itemError } = await supabase
      .from('ShipmentItem')
      .select('id')
      .eq('shipmentId', shipmentId)
      .eq('warehouseOrderId', warehouseOrderId)
      .single()

    if (itemError || !shipmentItem) {
      return NextResponse.json(
        { error: 'Warehouse order does not belong to this shipment' },
        { status: 404 }
      )
    }

    // Update isPacked status
    const { error: updateError } = await supabase
      .from('ShipmentItem')
      .update({ isPacked })
      .eq('id', shipmentItem.id)

    if (updateError) {
      console.error('Error updating shipment item:', updateError)
      return NextResponse.json(
        { error: 'Failed to update packed status', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Packed status updated successfully',
        isPacked,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error marking order as packed:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

