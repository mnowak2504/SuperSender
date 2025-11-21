import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { sendInvoiceIssuedEmail } from '@/lib/email'

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
    
    console.log('[API /client/subscription/upgrade] Session info:', {
      userId: (session.user as any)?.id,
      email: session.user.email,
      clientId: clientId,
    })
    
    if (!clientId) {
      console.log('[API /client/subscription/upgrade] No clientId in session, searching by email:', session.user.email)
      const { data: clientByEmail, error: emailError } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (emailError) {
        console.error('[API /client/subscription/upgrade] Error searching client by email:', emailError)
      }
      
      if (clientByEmail) {
        clientId = clientByEmail.id
        console.log('[API /client/subscription/upgrade] Found client by email:', clientId)
      } else {
        console.warn('[API /client/subscription/upgrade] No client found by email')
      }
    }

    if (!clientId) {
      console.error('[API /client/subscription/upgrade] Client not found for user:', session.user.email)
      return NextResponse.json({ 
        error: 'Client not found',
        details: 'Please complete your profile first'
      }, { status: 404 })
    }

    const body = await req.json()
    const { planId, subscriptionPeriod = '1', paymentMethod = 'online', voucherCode } = body

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

    // Calculate subscription amount
    let baseAmount = plan.operationsRateEur || 0
    
    // Apply subscription period discount
    if (subscriptionPeriod === '3') {
      baseAmount = baseAmount * 3 * 0.9 // 10% discount for 3 months
    } else if (subscriptionPeriod === '6') {
      baseAmount = baseAmount * 6 * 0.85 // 15% discount for 6 months
    } else {
      baseAmount = baseAmount * 1 // 1 month
    }

    // Apply client discount if exists
    const discount = client.subscriptionDiscount || 0
    let finalAmount = baseAmount * (1 - discount / 100)

    // Get setup fee
    const { data: setupFeeData } = await supabase
      .from('SetupFee')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    const setupFee = setupFeeData?.currentAmountEur || 119.0
    finalAmount += setupFee

    // Apply voucher discount if provided
    let voucherId = null
    if (voucherCode) {
      const { data: voucher, error: voucherError } = await supabase
        .from('Voucher')
        .select('*')
        .eq('code', voucherCode.trim().toUpperCase())
        .single()

      if (!voucherError && voucher) {
        // Validate voucher
        if (!voucher.usedByClientId && (!voucher.expiresAt || new Date(voucher.expiresAt) > new Date())) {
          finalAmount = Math.max(0, finalAmount - voucher.amountEur)
          voucherId = voucher.id
        }
      }
    }

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

    // Send invoice issued email notification (non-blocking)
    sendInvoiceIssuedEmail(
      clientId,
      invoice.id,
      invoice.invoiceNumber || null,
      finalAmount,
      'SUBSCRIPTION',
      dueDate.toISOString(),
      null // Payment link will be added after creation
    ).catch((error) => {
      console.error('Error sending invoice issued email:', error)
      // Don't fail the request if email fails
    })

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

      // Mark voucher as used if applicable
      if (voucherId) {
        await supabase
          .from('Voucher')
          .update({
            usedByClientId: clientId,
            usedAt: new Date().toISOString(),
          })
          .eq('id', voucherId)
      }

      // Update client with new plan (but don't activate until payment)
      // We'll update the plan after payment is confirmed via webhook
      // For now, just return the payment link

      return NextResponse.json({
        success: true,
        invoiceId: invoice.id,
        paymentLink: paymentMethod === 'online' ? paymentData.link : null,
        amount: finalAmount,
        planId,
        planName: plan.name,
        paymentMethod,
      })
    } catch (paymentError) {
      console.error('Error creating payment link:', paymentError)
      
      // Mark voucher as used if applicable (even if payment link creation failed)
      if (voucherId) {
        await supabase
          .from('Voucher')
          .update({
            usedByClientId: clientId,
            usedAt: new Date().toISOString(),
          })
          .eq('id', voucherId)
      }
      
      // Still return invoice, user can pay later
      return NextResponse.json({
        success: true,
        invoiceId: invoice.id,
        paymentLink: null,
        amount: finalAmount,
        planId,
        planName: plan.name,
        paymentMethod,
        message: paymentMethod === 'online' 
          ? 'Invoice created. Payment link will be available shortly.'
          : 'Invoice created. Bank transfer instructions will be provided.',
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

