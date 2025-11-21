import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

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
          suggestedAmountEur: 119.0,
          currentAmountEur: 119.0,
          validUntil: null,
        },
      })
    }

    // Check if current amount is still valid
    const now = new Date()
    const validUntil = setupFee.validUntil ? new Date(setupFee.validUntil) : null
    const isCurrentValid = !validUntil || validUntil > now

    return NextResponse.json({
      setupFee: {
        suggestedAmountEur: setupFee.suggestedAmountEur,
        currentAmountEur: isCurrentValid ? setupFee.currentAmountEur : setupFee.suggestedAmountEur,
        validUntil: setupFee.validUntil,
        isPromotional: setupFee.currentAmountEur < setupFee.suggestedAmountEur && isCurrentValid,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/client/setup-fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

