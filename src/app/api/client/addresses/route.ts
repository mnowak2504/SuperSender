import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

// Get all addresses for the client
export async function GET(req: NextRequest) {
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

    const { data: addresses, error } = await supabase
      .from('Address')
      .select('*')
      .eq('clientId', clientId)
      .order('isDefault', { ascending: false })
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching addresses:', error)
      return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 })
    }

    return NextResponse.json({ addresses: addresses || [] })
  } catch (error) {
    console.error('Error in GET /api/client/addresses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new address
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
    const { contactName, contactPhone, line1, line2, city, postalCode, country, isDefault } = body

    if (!contactName || !contactPhone || !line1 || !city || !postalCode || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('Address')
        .update({ isDefault: false })
        .eq('clientId', clientId)
    }

    // Generate ID
    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'cl'
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const { data: newAddress, error } = await supabase
      .from('Address')
      .insert({
        id: generateCUID(),
        clientId,
        contactName,
        contactPhone,
        line1,
        line2: line2 || null,
        city,
        postalCode,
        country,
        isDefault: isDefault || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating address:', error)
      return NextResponse.json({ error: 'Failed to create address' }, { status: 500 })
    }

    return NextResponse.json({ address: newAddress }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/client/addresses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
