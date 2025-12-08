import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Get current setup fee (public endpoint for pricing display)
    const { data: setupFee, error } = await supabase
      .from('SetupFee')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching setup fee:', error)
      return NextResponse.json({ error: 'Failed to fetch setup fee' }, { status: 500 })
    }

    // If no setup fee exists, return default
    if (!setupFee) {
      return NextResponse.json({
        setupFee: {
          suggestedAmountEur: 99.0,
          currentAmountEur: 99.0,
          validUntil: null,
          shouldCharge: true, // Default to charging if no client context
        },
      })
    }

    // Check if current amount is still valid
    const now = new Date()
    const validUntil = setupFee.validUntil ? new Date(setupFee.validUntil) : null
    const isCurrentValid = !validUntil || validUntil > now

    // Check if setup fee should be charged for this client
    // Try to get client info from session if available
    let shouldChargeSetupFee = true
    try {
      const session = await auth()
      if (session?.user) {
        let clientId = (session.user as any)?.clientId
        
        if (!clientId) {
          const { data: clientByEmail } = await supabase
            .from('Client')
            .select('id, subscriptionEndDate')
            .eq('email', session.user.email)
            .single()
          
          if (clientByEmail) {
            clientId = clientByEmail.id
            
            // Check if subscription expired less than 1 month ago
            if (clientByEmail.subscriptionEndDate) {
              const subscriptionEndDate = new Date(clientByEmail.subscriptionEndDate)
              const oneMonthAgo = new Date(now)
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
              
              // If subscription is still active (end date in future) or expired less than 1 month ago, don't charge setup fee
              if (subscriptionEndDate >= oneMonthAgo) {
                shouldChargeSetupFee = false
              }
            }
          }
        } else {
          // Fetch client subscription end date
          const { data: client } = await supabase
            .from('Client')
            .select('subscriptionEndDate')
            .eq('id', clientId)
            .single()
          
          if (client?.subscriptionEndDate) {
            const subscriptionEndDate = new Date(client.subscriptionEndDate)
            const oneMonthAgo = new Date(now)
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
            
            // If subscription is still active (end date in future) or expired less than 1 month ago, don't charge setup fee
            if (subscriptionEndDate >= oneMonthAgo) {
              shouldChargeSetupFee = false
            }
          }
        }
      }
    } catch (authError) {
      // If auth fails, default to charging setup fee (for public pricing display)
      console.log('Could not check client subscription status, defaulting to charge setup fee')
    }

    return NextResponse.json({
      setupFee: {
        suggestedAmountEur: setupFee.suggestedAmountEur,
        currentAmountEur: isCurrentValid ? setupFee.currentAmountEur : setupFee.suggestedAmountEur,
        validUntil: setupFee.validUntil,
        isPromotional: setupFee.currentAmountEur < setupFee.suggestedAmountEur && isCurrentValid,
        shouldCharge: shouldChargeSetupFee,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/client/setup-fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

