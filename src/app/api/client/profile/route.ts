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
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find client by email or clientId
    let clientId = (session.user as any)?.clientId
    
    console.log('[API /client/profile] Session info:', {
      userId: (session.user as any)?.id,
      email: session.user.email,
      clientId: clientId,
    })
    
    if (!clientId) {
      console.log('[API /client/profile] No clientId in session, searching by email:', session.user.email)
      const { data: clientByEmail, error: emailError } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (emailError) {
        console.error('[API /client/profile] Error searching client by email:', emailError)
      }
      
      if (clientByEmail) {
        clientId = clientByEmail.id
        console.log('[API /client/profile] Found client by email:', clientId)
      } else {
        console.warn('[API /client/profile] No client found by email')
      }
    }

    if (!clientId) {
      console.error('[API /client/profile] Client not found for user:', session.user.email)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: client, error } = await supabase
      .from('Client')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('[API /client/profile] Error fetching client:', error)
      return NextResponse.json({ error: 'Failed to fetch client data', details: error.message }, { status: 500 })
    }

    if (!client) {
      console.error('[API /client/profile] Client data is null for clientId:', clientId)
      return NextResponse.json({ error: 'Client data not found' }, { status: 404 })
    }

    console.log('[API /client/profile] Successfully fetched client:', {
      id: client.id,
      displayName: client.displayName,
      email: client.email,
    })

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error in GET /api/client/profile:', error)
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
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { displayName, phone, country } = body

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

    const { data: updatedClient, error } = await supabase
      .from('Client')
      .update({
        displayName: displayName || null,
        phone: phone || null,
        country: country || null,
      })
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json({ error: 'Failed to update client data' }, { status: 500 })
    }

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    console.error('Error in PUT /api/client/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

