import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

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

    const body = await req.json()
    const { code } = body

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 })
    }

    // Find client
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

    // Find voucher
    const { data: voucher, error: voucherError } = await supabase
      .from('Voucher')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single()

    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 })
    }

    // Check if voucher is already used
    if (voucher.isOneTime && voucher.usedByClientId) {
      return NextResponse.json({ error: 'This voucher has already been used' }, { status: 400 })
    }

    // Check if voucher is expired
    if (voucher.expiresAt) {
      const expiresAt = new Date(voucher.expiresAt)
      if (expiresAt < new Date()) {
        return NextResponse.json({ error: 'This voucher has expired' }, { status: 400 })
      }
    }

    // Check if client already used this voucher
    if (voucher.isOneTime && voucher.usedByClientId === clientId) {
      return NextResponse.json({ error: 'You have already used this voucher' }, { status: 400 })
    }

    return NextResponse.json({
      voucher: {
        id: voucher.id,
        code: voucher.code,
        amountEur: voucher.amountEur,
      },
    })
  } catch (error) {
    console.error('Error validating voucher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

