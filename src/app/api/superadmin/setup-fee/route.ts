import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get setup fee (should be single row)
    const { data: setupFee, error } = await supabase
      .from('SetupFee')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching setup fee:', error)
      return NextResponse.json({ error: 'Failed to fetch setup fee' }, { status: 500 })
    }

    // If no setup fee exists, return default
    if (!setupFee) {
      return NextResponse.json({
        setupFee: {
          id: 'default',
          suggestedAmountEur: 99.0,
          currentAmountEur: 99.0,
          validUntil: null,
        },
      })
    }

    return NextResponse.json({ setupFee })
  } catch (error) {
    console.error('Error in GET /api/superadmin/setup-fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { currentAmountEur, validUntil } = body

    if (currentAmountEur === undefined) {
      return NextResponse.json({ error: 'currentAmountEur is required' }, { status: 400 })
    }

    // Get or create setup fee
    const { data: existing } = await supabase
      .from('SetupFee')
      .select('id')
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    let setupFee
    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabase
        .from('SetupFee')
        .update({
          currentAmountEur,
          validUntil: validUntil || null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating setup fee:', updateError)
        return NextResponse.json({ error: 'Failed to update setup fee' }, { status: 500 })
      }

      setupFee = updated
    } else {
      // Create new
      const { data: created, error: createError } = await supabase
        .from('SetupFee')
        .insert({
          id: 'setup_fee_1',
          suggestedAmountEur: 99.0,
          currentAmountEur,
          validUntil: validUntil || null,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating setup fee:', createError)
        return NextResponse.json({ error: 'Failed to create setup fee' }, { status: 500 })
      }

      setupFee = created
    }

    return NextResponse.json({ setupFee })
  } catch (error) {
    console.error('Error in PUT /api/superadmin/setup-fee:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

