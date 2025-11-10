import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { autoAssignClient } from '@/lib/auto-assign-client'
import { generateTempClientCode } from '@/lib/client-code-generator'

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
      console.log('[API /client/profile] No client found, creating new Client record for user:', session.user.email)
      
      // Generate CUID for new client
      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'cl'
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }
      
      const newClientId = generateCUID()
      const tempClientCode = generateTempClientCode('Unknown')
      const displayName = (session.user as any)?.name || session.user.email?.split('@')[0] || 'Client'
      
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
        console.error('[API /client/profile] Error creating Client:', createError)
        return NextResponse.json(
          { error: 'Failed to create client account', details: createError?.message },
          { status: 500 }
        )
      }
      
      clientId = newClient.id
      console.log('[API /client/profile] Created new Client:', clientId)
      
      // Update user with clientId
      await supabase
        .from('User')
        .update({ clientId })
        .eq('id', (session.user as any)?.id)
      
      // Auto-assign client to sales rep
      await autoAssignClient(clientId, 'Unknown')
      
      // Fetch the newly created client
      const { data: client, error } = await supabase
        .from('Client')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (error || !client) {
        console.error('[API /client/profile] Error fetching newly created client:', error)
        return NextResponse.json({ error: 'Failed to fetch client data' }, { status: 500 })
      }
      
      console.log('[API /client/profile] Successfully fetched newly created client:', {
        id: client.id,
        displayName: client.displayName,
        email: client.email,
      })
      
      return NextResponse.json({ client })
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

