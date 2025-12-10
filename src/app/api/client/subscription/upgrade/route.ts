import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { sendInvoiceIssuedEmail } from '@/lib/email'
import { BANK_TRANSFER_INFO, formatBankTransferInstructions, getBankTransferTitle } from '@/lib/bank-transfer-info'
import { generateTempClientCode } from '@/lib/client-code-generator'
import { autoAssignClient } from '@/lib/auto-assign-client'

export const runtime = 'nodejs'

/**
 * POST /api/client/subscription/upgrade
 * Client upgrades their subscription plan
 * Creates an invoice and payment link
 */
export async function POST(req: NextRequest) {
  console.log('[API /client/subscription/upgrade] POST request received')
  
  try {
    const session = await auth()
    
    console.log('[API /client/subscription/upgrade] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
    })

    if (!session?.user) {
      console.error('[API /client/subscription/upgrade] No session or user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    console.log('[API /client/subscription/upgrade] User role:', role)
    
    if (role !== 'CLIENT') {
      console.error('[API /client/subscription/upgrade] Invalid role:', role)
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
        console.error('[API /client/subscription/upgrade] Error searching client by email:', {
          error: emailError,
          code: emailError.code,
          message: emailError.message,
          details: emailError.details,
        })
      }
      
      if (clientByEmail) {
        clientId = clientByEmail.id
        console.log('[API /client/subscription/upgrade] Found client by email:', clientId)
      } else {
        console.warn('[API /client/subscription/upgrade] No client found by email, will create new one')
      }
    } else {
      console.log('[API /client/subscription/upgrade] Using clientId from session:', clientId)
    }

    let wasClientCreated = false
    
    if (!clientId) {
      console.log('[API /client/subscription/upgrade] No client found, creating Client record for user:', session.user.email)
      
      // Create client if doesn't exist (similar to profile endpoint)
      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'cl'
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }
      
      const newClientId = generateCUID()
      const displayName = (session.user as any)?.name || session.user.email?.split('@')[0] || 'Client'
      
      // Generate temp client code
      const tempClientCode = generateTempClientCode('Unknown')
      
      // Create new Client record
      const { data: newClient, error: createError } = await supabase
        .from('Client')
        .insert({
          id: newClientId,
          displayName,
          email: session.user.email || '',
          phone: (session.user as any)?.phone || null,
          country: 'Unknown', // Default, can be updated later
          clientCode: tempClientCode,
          salesOwnerCode: 'TBD',
          status: 'ACTIVE',
        })
        .select()
        .single()
      
      if (createError || !newClient) {
        console.error('[API /client/subscription/upgrade] Error creating Client:', createError)
        return NextResponse.json({ 
          error: 'Failed to create client account',
          details: createError?.message || 'Could not create client record'
        }, { status: 500 })
      }
      
      clientId = newClient.id
      wasClientCreated = true
      console.log('[API /client/subscription/upgrade] Created new Client:', clientId)
      
      // Update user with clientId
      const { error: updateUserError } = await supabase
        .from('User')
        .update({ clientId })
        .eq('id', (session.user as any)?.id)
      
      if (updateUserError) {
        console.error('[API /client/subscription/upgrade] Error updating User with clientId:', updateUserError)
      }
      
      // Auto-assign client to sales rep
      await autoAssignClient(clientId, 'Unknown')
    }

    // Ensure clientId is set at this point
    console.log('[API /client/subscription/upgrade] Final clientId check:', {
      clientId,
      wasClientCreated,
      email: session.user.email,
    })
    
    if (!clientId) {
      console.error('[API /client/subscription/upgrade] clientId is still null after all attempts - returning 404')
      return NextResponse.json({ 
        error: 'Client not found',
        details: 'Could not find or create client record'
      }, { status: 404 })
    }
    
    console.log('[API /client/subscription/upgrade] clientId is set, proceeding with request body parsing')

    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('[API /client/subscription/upgrade] Error parsing request body:', parseError)
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: 'Request body is missing or invalid'
      }, { status: 400 })
    }
    
    const { planId, subscriptionPeriod = '1', paymentMethod = 'online', voucherCode, subscriptionStartDate } = body || {}

    if (!planId) {
      console.error('[API /client/subscription/upgrade] Missing planId in request body')
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
    }

    // Get client with current plan
    // If we just created the client, use the data we already have
    let client
    if (wasClientCreated) {
      // Use the client data from the creation response
      // We need to fetch it again to get all required fields
      const { data: fetchedClient, error: fetchError } = await supabase
        .from('Client')
        .select('id, planId, subscriptionDiscount, clientCode, email, subscriptionEndDate, subscriptionStartDate')
        .eq('id', clientId)
        .single()
      
      if (fetchError) {
        console.error('[API /client/subscription/upgrade] Error fetching newly created client:', {
          error: fetchError,
          clientId,
          email: session.user.email,
        })
        // Try one more time after a short delay
        await new Promise(resolve => setTimeout(resolve, 200))
        const { data: retryClient, error: retryError } = await supabase
          .from('Client')
          .select('id, planId, subscriptionDiscount, clientCode, email, subscriptionEndDate, subscriptionStartDate')
          .eq('id', clientId)
          .single()
        
        if (retryError || !retryClient) {
          console.error('[API /client/subscription/upgrade] Retry also failed:', retryError)
          return NextResponse.json({ 
            error: 'Client not found',
            details: retryError?.message || 'Could not fetch newly created client'
          }, { status: 500 })
        }
        
        client = retryClient
      } else {
        client = fetchedClient
      }
    } else {
      // Fetch existing client
      const { data: fetchedClient, error: clientError } = await supabase
        .from('Client')
        .select('id, planId, subscriptionDiscount, clientCode, email, subscriptionEndDate, subscriptionStartDate')
        .eq('id', clientId)
        .single()

      if (clientError) {
        console.error('[API /client/subscription/upgrade] Client fetch error:', {
          error: clientError,
          clientId,
          email: session.user.email,
        })
        return NextResponse.json({ 
          error: 'Client not found',
          details: clientError.message || 'Client record not found'
        }, { status: 404 })
      }

      if (!fetchedClient) {
        console.error('[API /client/subscription/upgrade] Client is null:', {
          clientId,
          email: session.user.email,
        })
        return NextResponse.json({ 
          error: 'Client not found',
          details: 'Client record is null'
        }, { status: 404 })
      }
      
      client = fetchedClient
    }
    
    if (!client) {
      console.error('[API /client/subscription/upgrade] Client is still null after all attempts')
      return NextResponse.json({ 
        error: 'Client not found',
        details: 'Client record could not be retrieved'
      }, { status: 500 })
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

    // Determine if this is extend (same plan) or upgrade (different plan)
    const isExtend = client.planId === planId && client.planId !== null
    const isUpgrade = client.planId !== null && client.planId !== planId
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    // Calculate subscription start date
    let subscriptionStartDateCalculated: Date
    let unusedPeriodCredit = 0
    
    if (isExtend && client.subscriptionEndDate) {
      // Extend: start from current subscription end date
      subscriptionStartDateCalculated = new Date(client.subscriptionEndDate)
      subscriptionStartDateCalculated.setHours(0, 0, 0, 0)
    } else if (isUpgrade && client.subscriptionEndDate && client.subscriptionStartDate) {
      // Upgrade: start from today, calculate credit for unused period
      subscriptionStartDateCalculated = now
      
      const currentEndDate = new Date(client.subscriptionEndDate)
      currentEndDate.setHours(23, 59, 59, 999)
      
      // Only calculate credit if subscription is still active (not expired)
      if (currentEndDate > now) {
        // Get current plan details
        const { data: currentPlan } = await supabase
          .from('Plan')
          .select('operationsRateEur')
          .eq('id', client.planId)
          .single()
        
        if (currentPlan) {
          // Calculate unused days
          const totalDays = Math.ceil((currentEndDate.getTime() - new Date(client.subscriptionStartDate).getTime()) / (1000 * 60 * 60 * 24))
          const unusedDays = Math.ceil((currentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          // Calculate monthly rate (considering discounts)
          const monthlyRate = currentPlan.operationsRateEur * (1 - (client.subscriptionDiscount || 0) / 100)
          
          // Calculate credit: (unused days / total days) * monthly rate
          // Proportionally calculate based on actual subscription period
          if (totalDays > 0) {
            unusedPeriodCredit = (unusedDays / totalDays) * monthlyRate
          } else {
            unusedPeriodCredit = 0
          }
          
          // Round to 2 decimal places
          unusedPeriodCredit = Math.round(unusedPeriodCredit * 100) / 100
        }
      }
    } else {
      // New subscription or restart: use provided date or today
      subscriptionStartDateCalculated = subscriptionStartDate ? new Date(subscriptionStartDate) : now
      subscriptionStartDateCalculated.setHours(0, 0, 0, 0)
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
    
    // Apply unused period credit for upgrades
    if (isUpgrade && unusedPeriodCredit > 0) {
      finalAmount = Math.max(0, finalAmount - unusedPeriodCredit)
    }

    // Determine if setup fee should be charged
    // Setup fee is NOT charged if:
    // - Client has EVER had a subscription (subscriptionEndDate is not null)
    //   This covers: extend (same plan), upgrade (different plan), restart (previously activated)
    // Setup fee IS charged if:
    // - Client has never had a subscription (subscriptionEndDate is null) - new client
    let shouldChargeSetupFee = true
    
    // If client has EVER had a subscription (even if expired), don't charge setup fee
    // This covers extend, upgrade, and restart scenarios
    if (client.subscriptionEndDate !== null && client.subscriptionEndDate !== undefined) {
      shouldChargeSetupFee = false
    }

    // Get setup fee and add it if needed
    if (shouldChargeSetupFee) {
      const { data: setupFeeData, error: setupFeeError } = await supabase
        .from('SetupFee')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Use nullish coalescing (??) instead of || to handle 0 correctly
      // If setupFeeData exists, use its currentAmountEur (even if 0)
      // Only use default if setupFeeData is null/undefined
      // If error or no data, default to 0 (no setup fee)
      const setupFee = setupFeeError || !setupFeeData ? 0 : (setupFeeData.currentAmountEur ?? 0)
      if (setupFee > 0) {
        finalAmount += setupFee
        console.log('[API /client/subscription/upgrade] Adding setup fee:', setupFee)
      } else {
        console.log('[API /client/subscription/upgrade] No setup fee (amount is 0 or not found)')
      }
    }

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

    // Let database generate the invoice ID using cuid() default
    // This ensures proper format and avoids conflicts

    // Use calculated start date (override with provided date if specified for new subscriptions)
    const startDate = subscriptionStartDate && !isExtend && !isUpgrade 
      ? new Date(subscriptionStartDate) 
      : subscriptionStartDateCalculated
    startDate.setHours(0, 0, 0, 0)
    
    // Verify plan exists before creating invoice
    const { data: planCheck, error: planCheckError } = await supabase
      .from('Plan')
      .select('id')
      .eq('id', planId)
      .single()

    if (planCheckError || !planCheck) {
      console.error('[API /client/subscription/upgrade] Plan not found:', {
        planId,
        error: planCheckError,
      })
      return NextResponse.json(
        { 
          error: 'Invalid plan selected', 
          details: planCheckError?.message || 'Plan not found',
        },
        { status: 400 }
      )
    }

    // Verify client exists before creating invoice
    const { data: clientCheck, error: clientCheckError } = await supabase
      .from('Client')
      .select('id')
      .eq('id', clientId)
      .single()

    if (clientCheckError || !clientCheck) {
      console.error('[API /client/subscription/upgrade] Client not found:', {
        clientId,
        error: clientCheckError,
      })
      return NextResponse.json(
        { 
          error: 'Client account not found', 
          details: clientCheckError?.message || 'Client not found',
        },
        { status: 404 }
      )
    }
    
    // Store planId in invoice metadata (we'll add a planId field to Invoice or use metadata JSON)
    // For now, we'll store it in a way that webhook can access it
    // Note: We need to update Client with planId after payment, so we'll get it from invoice.clientId -> Client.planId
    
    const invoiceData = {
      clientId,
      type: 'PROFORMA', // Subscription invoices are proformas - final invoices are sent manually
      amountEur: finalAmount,
      currency: 'EUR',
      status: 'ISSUED',
      dueDate: dueDate.toISOString(),
      subscriptionStartDate: startDate.toISOString(),
      subscriptionPeriod: subscriptionPeriod,
      subscriptionPlanId: planId,
      paymentMethod: paymentMethod === 'online' ? 'PAYMENT_LINK_REQUESTED' : paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : null,
    }

    console.log('[API /client/subscription/upgrade] Creating invoice with data:', {
      clientId,
      planId,
      finalAmount,
      subscriptionPeriod,
      paymentMethod,
      invoiceData,
    })
    
    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .insert(invoiceData)
      .select()
      .single()

    if (invoiceError) {
      console.error('[API /client/subscription/upgrade] Error creating invoice:', {
        error: invoiceError,
        code: invoiceError.code,
        message: invoiceError.message,
        details: invoiceError.details,
        hint: invoiceError.hint,
        clientId,
        planId,
        finalAmount,
        invoiceData,
      })
      return NextResponse.json(
        { 
          error: 'Failed to create invoice', 
          details: invoiceError.message || invoiceError.details || 'Unknown error',
          code: invoiceError.code,
          hint: invoiceError.hint,
        },
        { status: 500 }
      )
    }

    // Send invoice issued email notification (non-blocking)
    sendInvoiceIssuedEmail(
      clientId,
      invoice.id,
      invoice.invoiceNumber || null,
      finalAmount,
      'PROFORMA', // Subscription invoices are proformas
      dueDate.toISOString(),
      null // Payment link will be added after creation
    ).catch((error) => {
      console.error('Error sending invoice issued email:', error)
      // Don't fail the request if email fails
    })

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

    // If bank transfer, activate account immediately
    if (paymentMethod === 'bank_transfer') {
      // Use calculated start date
      const endDate = new Date(startDate)
      const months = parseInt(subscriptionPeriod) || 1
      endDate.setMonth(endDate.getMonth() + months)
      endDate.setHours(23, 59, 59, 999)
      
      const { error: updatePlanError } = await supabase
        .from('Client')
        .update({
          planId: planId,
          subscriptionStartDate: startDate.toISOString(),
          subscriptionEndDate: endDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', clientId)

      if (updatePlanError) {
        console.error('[API /client/subscription/upgrade] Error updating client plan for bank transfer:', updatePlanError)
      }
    }

    // For online payment, activate subscription immediately when payment link is requested
    // Payment link will be created manually by admin/superadmin
    if (paymentMethod === 'online') {
      // Activate subscription immediately when payment link is requested
      // Use calculated start date
      const endDate = new Date(startDate)
      const months = parseInt(subscriptionPeriod) || 1
      endDate.setMonth(endDate.getMonth() + months)
      endDate.setHours(23, 59, 59, 999)
      
      const { error: updatePlanError } = await supabase
        .from('Client')
        .update({
          planId: planId,
          subscriptionStartDate: startDate.toISOString(),
          subscriptionEndDate: endDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', clientId)

      if (updatePlanError) {
        console.error('[API /client/subscription/upgrade] Error activating subscription for payment link requested:', updatePlanError)
      } else {
        console.log('[API /client/subscription/upgrade] Subscription activated immediately for payment link requested')
      }
    }

    // Prepare bank transfer info if applicable
    const bankTransferInfo = paymentMethod === 'bank_transfer' ? {
      instructions: formatBankTransferInstructions(client.clientCode || 'N/A', invoice.invoiceNumber || undefined, finalAmount),
      transferTitle: getBankTransferTitle(client.clientCode || 'N/A', invoice.invoiceNumber || undefined),
      accountDetails: BANK_TRANSFER_INFO,
    } : null

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      paymentLink: null, // No automatic payment link - will be created by admin
      paymentLinkRequested: paymentMethod === 'online', // Indicate that payment link was requested
      amount: finalAmount,
      planId,
      planName: plan.name,
      paymentMethod,
      bankTransferInfo,
      clientCode: client.clientCode,
      isExtend,
      isUpgrade,
      unusedPeriodCredit: isUpgrade ? unusedPeriodCredit : 0,
      subscriptionStartDate: startDate.toISOString(),
    })
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

