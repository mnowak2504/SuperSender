import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/client/subscription/upgrade
 * Client upgrades their subscription plan
 * Creates an invoice and payment link
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find client by email or clientId
    let clientId = (session.user as any)?.clientId
    
    if (!clientId) {
      const { data: clientByEmail } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (clientByEmail) {
        clientId = clientByEmail.id
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get client with current plan
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, planId, subscriptionDiscount')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
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

    // Calculate subscription amount (apply discount if exists)
    const baseAmount = plan.operationsRateEur || 0
    const discount = client.subscriptionDiscount || 0
    const finalAmount = baseAmount * (1 - discount / 100)

    // Create invoice
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7) // 7 days payment term

    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .insert({
        clientId,
        type: 'SUBSCRIPTION',
        amountEur: finalAmount,
        currency: 'EUR',
        status: 'ISSUED',
        dueDate: dueDate.toISOString(),
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json(
        { error: 'Failed to create invoice', details: invoiceError.message },
        { status: 500 }
      )
    }

    // Create payment link
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      const paymentLinkRes = await fetch(`${baseUrl}/api/payments/revolut/create-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.id }),
      })

      if (!paymentLinkRes.ok) {
        throw new Error('Failed to create payment link')
      }

      const paymentData = await paymentLinkRes.json()

      // Update client with new plan (but don't activate until payment)
      // We'll update the plan after payment is confirmed via webhook
      // For now, just return the payment link

      return NextResponse.json({
        success: true,
        invoiceId: invoice.id,
        paymentLink: paymentData.link,
        amount: finalAmount,
        planId,
        planName: plan.name,
      })
    } catch (paymentError) {
      console.error('Error creating payment link:', paymentError)
      // Still return invoice, user can pay later
      return NextResponse.json({
        success: true,
        invoiceId: invoice.id,
        paymentLink: null,
        amount: finalAmount,
        planId,
        planName: plan.name,
        message: 'Invoice created. Payment link will be available shortly.',
      })
    }
  } catch (error) {
    console.error('Error upgrading subscription:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

