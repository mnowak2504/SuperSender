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
    const { 
      displayName, 
      phone, 
      country, 
      invoiceName, 
      businessName, 
      vatNumber, 
      invoiceAddress,
      invoiceAddressLine1,
      invoiceAddressLine2,
      invoiceCity,
      invoicePostCode
    } = body

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
      console.log('[API /client/profile PUT] No client found, creating new Client record for user:', session.user.email)
      
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
      const tempClientCode = generateTempClientCode(country || 'Unknown')
      const displayNameValue = displayName || (session.user as any)?.name || session.user.email?.split('@')[0] || 'Client'
      
      // Create new Client record
      const { data: newClient, error: createError } = await supabase
        .from('Client')
        .insert({
          id: newClientId,
          displayName: displayNameValue,
          email: session.user.email || '',
          phone: phone || (session.user as any)?.phone || null,
          country: country || 'Unknown',
          clientCode: tempClientCode,
          salesOwnerCode: 'TBD',
          status: 'ACTIVE',
        })
        .select()
        .single()
      
      if (createError || !newClient) {
        console.error('[API /client/profile PUT] Error creating Client:', createError)
        return NextResponse.json({ 
          error: 'Failed to create client account',
          details: createError?.message || 'Could not create client record'
        }, { status: 500 })
      }
      
      clientId = newClient.id
      console.log('[API /client/profile PUT] Created new Client:', clientId)
      
      // Update user with clientId
      await supabase
        .from('User')
        .update({ clientId })
        .eq('id', (session.user as any)?.id)
      
      // Auto-assign client to sales rep
      await autoAssignClient(clientId, country || 'Unknown')
    }

    // Build update object only with provided fields
    // Convert empty strings to null for optional fields
    const updateData: any = {}
    
    if (displayName !== undefined) updateData.displayName = displayName?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (country !== undefined) updateData.country = country?.trim() || null
    if (invoiceName !== undefined) updateData.invoiceName = invoiceName?.trim() || null
    if (businessName !== undefined) updateData.businessName = businessName?.trim() || null
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber?.trim() || null
    if (invoiceAddress !== undefined) updateData.invoiceAddress = invoiceAddress?.trim() || null
    if (invoiceAddressLine1 !== undefined) updateData.invoiceAddressLine1 = invoiceAddressLine1?.trim() || null
    if (invoiceAddressLine2 !== undefined) updateData.invoiceAddressLine2 = invoiceAddressLine2?.trim() || null
    if (invoiceCity !== undefined) updateData.invoiceCity = invoiceCity?.trim() || null
    if (invoicePostCode !== undefined) updateData.invoicePostCode = invoicePostCode?.trim() || null

    console.log('[API /client/profile PUT] Updating client:', {
      clientId,
      updateData,
    })

    const { data: updatedClient, error } = await supabase
      .from('Client')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      console.error('[API /client/profile PUT] Error updating client:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        clientId,
        updateData,
        fullError: JSON.stringify(error, null, 2),
      })
      
      // Check if error is about missing columns
      if (error.message?.includes('column') && (error.message?.includes('does not exist') || error.code === '42703')) {
        return NextResponse.json({ 
          error: 'Database schema outdated',
          details: 'Please run the migration for invoice address fields. The columns invoiceAddressLine1, invoiceAddressLine2, invoiceCity, or invoicePostCode may not exist in the database.',
          migrationRequired: true,
          errorCode: error.code,
        }, { status: 500 })
      }
      
      // Check for RLS (Row Level Security) issues
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return NextResponse.json({ 
          error: 'Permission denied',
          details: 'You do not have permission to update this client. Please check Row Level Security settings.',
          errorCode: error.code,
        }, { status: 403 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update client data',
        details: error.message || error.details || 'Database error occurred',
        errorCode: error.code,
        hint: error.hint,
      }, { status: 500 })
    }

    if (!updatedClient) {
      console.error('[API /client/profile PUT] Updated client is null')
      return NextResponse.json({ 
        error: 'Failed to update client data',
        details: 'Client record not found after update'
      }, { status: 500 })
    }

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    console.error('Error in PUT /api/client/profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

