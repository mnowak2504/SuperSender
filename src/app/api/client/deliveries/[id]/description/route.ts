import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * PUT /api/client/deliveries/[id]/description
 * Update goodsDescription for a DeliveryExpected
 */
export async function PUT(
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
    const body = await req.json()
    const { goodsDescription } = body

    if (!goodsDescription || typeof goodsDescription !== 'string') {
      return NextResponse.json(
        { error: 'goodsDescription is required and must be a string' },
        { status: 400 }
      )
    }

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

    // Verify delivery belongs to client
    const { data: delivery, error: deliveryError } = await supabase
      .from('DeliveryExpected')
      .select('id, clientId')
      .eq('id', id)
      .eq('clientId', clientId)
      .single()

    if (deliveryError || !delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Update goodsDescription
    const { error: updateError } = await supabase
      .from('DeliveryExpected')
      .update({ goodsDescription: goodsDescription.trim() })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating delivery description:', updateError)
      return NextResponse.json(
        { error: 'Failed to update description', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Description updated successfully',
    })
  } catch (error) {
    console.error('Error updating delivery description:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

