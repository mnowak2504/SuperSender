import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/landing/pricing
 * Public endpoint to fetch plans and setup fee for landing page
 */
export async function GET(req: NextRequest) {
  try {
    // Fetch all plans (excluding Individual)
    const { data: plans, error: plansError } = await supabase
      .from('Plan')
      .select('*')
      .neq('name', 'Individual')
      .order('operationsRateEur', { ascending: true })

    if (plansError) {
      console.error('Error fetching plans:', plansError)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    // Fetch setup fee
    const { data: setupFeeData, error: setupFeeError } = await supabase
      .from('SetupFee')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (setupFeeError && setupFeeError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK
      console.error('Error fetching setup fee:', setupFeeError)
    }

    // Determine current setup fee amount
    let setupFeeEur = setupFeeData?.suggestedAmountEur || 99.0
    const suggestedAmountEur = setupFeeData?.suggestedAmountEur || 99.0
    
    // Check if promotional amount is valid
    if (setupFeeData?.currentAmountEur && setupFeeData.currentAmountEur !== suggestedAmountEur) {
      const now = new Date()
      const validUntil = setupFeeData.validUntil ? new Date(setupFeeData.validUntil) : null
      
      // Use promotional amount if validUntil is null or in the future
      if (!validUntil || validUntil >= now) {
        setupFeeEur = setupFeeData.currentAmountEur
      }
    }

    return NextResponse.json({
      plans: plans || [],
      setupFee: {
        suggestedAmountEur,
        currentAmountEur: setupFeeEur,
        isPromotional: setupFeeEur < suggestedAmountEur,
        validUntil: setupFeeData?.validUntil || null,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/landing/pricing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

