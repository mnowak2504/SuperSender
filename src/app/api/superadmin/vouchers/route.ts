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
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: vouchers, error } = await supabase
      .from('Voucher')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching vouchers:', error)
      return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 })
    }

    // Fetch createdBy data separately
    const vouchersWithUsers = await Promise.all(
      (vouchers || []).map(async (voucher) => {
        const { data: user } = await supabase
          .from('User')
          .select('name, email')
          .eq('id', voucher.createdById)
          .single()

        return {
          ...voucher,
          createdBy: user || { name: null, email: null },
        }
      })
    )

    return NextResponse.json({ vouchers: vouchersWithUsers })
  } catch (error) {
    console.error('Error in GET /api/superadmin/vouchers:', error)
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
    if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { code, amountEur, expiresAt } = body

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 })
    }

    if (!amountEur || amountEur <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('Voucher')
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Voucher code already exists' }, { status: 400 })
    }

    const userId = (session.user as any)?.id

    // Create voucher
    const { data: voucher, error: createError } = await supabase
      .from('Voucher')
      .insert({
        code: code.trim().toUpperCase(),
        amountEur: parseFloat(amountEur.toString()),
        isOneTime: true,
        createdById: userId,
        expiresAt: expiresAt || null,
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating voucher:', createError)
      return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 })
    }

    // Fetch createdBy data
    const { data: user } = await supabase
      .from('User')
      .select('name, email')
      .eq('id', userId)
      .single()

    const voucherWithUser = {
      ...voucher,
      createdBy: user || { name: null, email: null },
    }

    return NextResponse.json({ voucher: voucherWithUser })
  } catch (error) {
    console.error('Error in POST /api/superadmin/vouchers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

