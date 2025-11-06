import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(
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

    // Unset all other defaults
    await supabase
      .from('Address')
      .update({ isDefault: false })
      .eq('clientId', clientId)

    // Set this address as default
    const { data: updatedAddress, error } = await supabase
      .from('Address')
      .update({ isDefault: true })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error setting default address:', error)
      return NextResponse.json({ error: 'Failed to set default address' }, { status: 500 })
    }

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error('Error in POST /api/client/addresses/[id]/set-default:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

