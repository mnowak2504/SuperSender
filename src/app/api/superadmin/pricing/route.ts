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

    const { data: rules, error } = await supabase
      .from('TransportPricing')
      .select('*')
      .order('priority', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching pricing rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
    const {
      name,
      type,
      transportType,
      weightMinKg,
      weightMaxKg,
      volumeMinCbm,
      volumeMaxCbm,
      palletCountMin,
      palletCountMax,
      priceEur,
      priority,
      isActive,
    } = body

    if (!name || !priceEur || !transportType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For pallets, we'll store count ranges in notes or use a workaround
    // Since we don't have palletCount fields in DB yet, we can extend the schema
    const { data: rule, error } = await supabase
      .from('TransportPricing')
      .insert({
        id: crypto.randomUUID(),
        name,
        type: type || 'FIXED_PER_UNIT',
        transportType,
        weightMinKg: weightMinKg || null,
        weightMaxKg: weightMaxKg || null,
        volumeMinCbm: volumeMinCbm || null,
        volumeMaxCbm: volumeMaxCbm || null,
        palletCountMin: palletCountMin || null,
        palletCountMax: palletCountMax || null,
        priceEur,
        priority: priority || 0,
        isActive: isActive !== false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error creating pricing rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

