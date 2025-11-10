import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/admin/clients/[id]/subscription
 * Assign subscription to client
 * - SUPERADMIN: can assign without payment (skipPayment: true)
 * - ADMIN: can assign with discounts (max 30% subscription, max 40% additional services)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: clientId } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    const userId = (session.user as any)?.id

    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { planId, skipPayment, subscriptionDiscount, additionalServicesDiscount } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Validate discounts based on role
    if (role === 'ADMIN') {
      if (subscriptionDiscount && (subscriptionDiscount < 0 || subscriptionDiscount > 35)) {
        return NextResponse.json(
          { error: 'Subscription discount must be between 0% and 35%' },
          { status: 400 }
        )
      }
      if (additionalServicesDiscount && (additionalServicesDiscount < 0 || additionalServicesDiscount > 40)) {
        return NextResponse.json(
          { error: 'Additional services discount must be between 0% and 40%' },
          { status: 400 }
        )
      }
    }

    // Only SUPERADMIN can skip payment
    if (skipPayment && role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Only superadmin can assign subscription without payment' },
        { status: 403 }
      )
    }

    // Verify client exists and check assignment (for regular admin)
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, salesOwnerId, planId')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Regular admin can only assign to their own clients
    if (role === 'ADMIN' && client.salesOwnerId !== userId) {
      return NextResponse.json(
        { error: 'You can only assign subscriptions to your own clients' },
        { status: 403 }
      )
    }

    // Verify plan exists
    const { data: plan, error: planError } = await supabase
      .from('Plan')
      .select('id, name, operationsRateEur')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Update client with plan
    const updateData: any = {
      planId,
      updatedAt: new Date().toISOString(),
    }

    // Store discounts if provided
    if (subscriptionDiscount !== undefined) {
      updateData.subscriptionDiscount = subscriptionDiscount
    }
    if (additionalServicesDiscount !== undefined) {
      updateData.additionalServicesDiscount = additionalServicesDiscount
    }

    const { error: updateError } = await supabase
      .from('Client')
      .update(updateData)
      .eq('id', clientId)

    if (updateError) {
      console.error('Error updating client subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to assign subscription', details: updateError.message },
        { status: 500 }
      )
    }

    // If skipPayment is true (superadmin only), create a "manual" invoice marked as paid
    if (skipPayment && role === 'SUPERADMIN') {
      const subscriptionAmount = plan.operationsRateEur || 0
      
      const { error: invoiceError } = await supabase
        .from('Invoice')
        .insert({
          clientId,
          type: 'SUBSCRIPTION',
          amountEur: subscriptionAmount,
          currency: 'EUR',
          status: 'PAID',
          dueDate: new Date().toISOString(),
          paidAt: new Date().toISOString(),
          // Add note that this was manually assigned
          // Note: We might need to add a notes/description field to Invoice table
        })

      if (invoiceError) {
        console.error('Error creating manual invoice:', invoiceError)
        // Don't fail the subscription assignment, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription assigned successfully',
      clientId,
      planId,
      skipPayment: skipPayment || false,
      discounts: {
        subscription: subscriptionDiscount || 0,
        additionalServices: additionalServicesDiscount || 0,
      },
    })
  } catch (error) {
    console.error('Error assigning subscription:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/clients/[id]/subscription
 * Remove subscription from client
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id: clientId } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    const userId = (session.user as any)?.id

    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, salesOwnerId')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Regular admin can only remove from their own clients
    if (role === 'ADMIN' && client.salesOwnerId !== userId) {
      return NextResponse.json(
        { error: 'You can only manage subscriptions for your own clients' },
        { status: 403 }
      )
    }

    // Remove subscription
    const { error: updateError } = await supabase
      .from('Client')
      .update({
        planId: null,
        subscriptionDiscount: null,
        additionalServicesDiscount: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (updateError) {
      console.error('Error removing subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove subscription', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully',
    })
  } catch (error) {
    console.error('Error removing subscription:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

