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
    if (role !== 'WAREHOUSE' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { transportCompanyName, plannedLoadingDate, plannedDeliveryDateFrom, plannedDeliveryDateTo } = body

    // Get shipment
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .select('id, clientTransportChoice')
      .eq('id', id)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    // Only allow editing for MAK transport (ACCEPT)
    if (shipment.clientTransportChoice !== 'ACCEPT') {
      return NextResponse.json(
        { error: 'Transport details can only be set for MAK transport (ACCEPT)' },
        { status: 400 }
      )
    }

    // Update shipment
    const updateData: any = {
      transportCompanyName: transportCompanyName || null,
      plannedLoadingDate: plannedLoadingDate ? new Date(plannedLoadingDate).toISOString() : null,
      plannedDeliveryDateFrom: plannedDeliveryDateFrom ? new Date(plannedDeliveryDateFrom).toISOString() : null,
      plannedDeliveryDateTo: plannedDeliveryDateTo ? new Date(plannedDeliveryDateTo).toISOString() : null,
    }

    const { error: updateError } = await supabase
      .from('ShipmentOrder')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving transport details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

