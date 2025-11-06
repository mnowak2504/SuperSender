import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * API endpoint do oznaczenia zamówienia jako gotowego do wyceny
 * Zmienia status WarehouseOrder z PACKED na READY_FOR_QUOTE
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
        { error: 'Forbidden - Only warehouse users can mark orders as ready for quote' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 }
      )
    }

    // Sprawdź czy zamówienie istnieje
    const { data: order, error: orderError } = await supabase
      .from('WarehouseOrder')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Sprawdź czy zamówienie może być oznaczone jako gotowe do wyceny
    if (order.status !== 'PACKED') {
      return NextResponse.json(
        { error: `Order cannot be marked as ready for quote. Current status: ${order.status}. Order must be PACKED.` },
        { status: 400 }
      )
    }

    // Sprawdź czy wymiary i waga są wypełnione
    if (!order.packedLengthCm || !order.packedWidthCm || !order.packedHeightCm || !order.packedWeightKg) {
      return NextResponse.json(
        { error: 'Order must have dimensions and weight filled before marking as ready for quote' },
        { status: 400 }
      )
    }

    // Zmień status na READY_FOR_QUOTE
    const { error: updateError } = await supabase
      .from('WarehouseOrder')
      .update({ status: 'READY_FOR_QUOTE' })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Order marked as ready for quote successfully',
        orderId,
        status: 'READY_FOR_QUOTE',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error marking order as ready for quote:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

