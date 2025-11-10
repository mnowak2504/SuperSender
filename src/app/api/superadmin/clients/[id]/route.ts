import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/superadmin/clients/[id]
 * Get single client with full details (only SUPERADMIN)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: client, error } = await supabase
      .from('Client')
      .select(`
        *,
        plan: planId (*),
        salesOwner: salesOwnerId (*),
        users: User (*),
        warehouseCapacity: WarehouseCapacity (*)
      `)
      .eq('id', id)
      .single()

    if (error || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Error in GET /api/superadmin/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/superadmin/clients/[id]
 * Update client (only SUPERADMIN)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      displayName,
      email,
      phone,
      country,
      status,
      planId,
      subscriptionDiscount,
      additionalServicesDiscount,
      salesOwnerId,
      invoiceName,
      businessName,
      vatNumber,
      invoiceAddress,
    } = body

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (displayName !== undefined) updateData.displayName = displayName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone || null
    if (country !== undefined) updateData.country = country
    if (status !== undefined) updateData.status = status
    if (planId !== undefined) updateData.planId = planId || null
    if (subscriptionDiscount !== undefined) updateData.subscriptionDiscount = subscriptionDiscount || null
    if (additionalServicesDiscount !== undefined) updateData.additionalServicesDiscount = additionalServicesDiscount || null
    if (salesOwnerId !== undefined) updateData.salesOwnerId = salesOwnerId || null
    if (invoiceName !== undefined) updateData.invoiceName = invoiceName || null
    if (businessName !== undefined) updateData.businessName = businessName || null
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber || null
    if (invoiceAddress !== undefined) updateData.invoiceAddress = invoiceAddress || null

    // Update client
    const { data: updatedClient, error } = await supabase
      .from('Client')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        plan: planId (*),
        salesOwner: salesOwnerId (*),
        users: User (*)
      `)
      .single()

    if (error) {
      console.error('Error updating client:', error)
      return NextResponse.json(
        { error: 'Failed to update client', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    console.error('Error in PUT /api/superadmin/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

