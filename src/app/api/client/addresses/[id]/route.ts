import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

// Update address
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify address belongs to client
    const { data: address } = await supabase
      .from('Address')
      .select('clientId')
      .eq('id', params.id)
      .single()

    if (!address || address.clientId !== clientId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('Address')
        .update({ isDefault: false })
        .eq('clientId', clientId)
        .neq('id', params.id)
    }

    const { data: updatedAddress, error } = await supabase
      .from('Address')
      .update({
        contactName,
        contactPhone,
        line1,
        line2: line2 || null,
        city,
        postalCode,
        country,
        isDefault: isDefault || false,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating address:', error)
      return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
    }

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error('Error in PUT /api/client/addresses/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete address
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify address belongs to client
    const { data: address } = await supabase
      .from('Address')
      .select('clientId')
      .eq('id', params.id)
      .single()

    if (!address || address.clientId !== clientId) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('Address')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting address:', error)
      return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/client/addresses/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

