import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { logChange, formatDiscountChange, formatIndividualPlanChange } from '@/lib/change-log'

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
      .select('*')
      .eq('id', id)
      .single()

    if (error || !client) {
      console.error('Error fetching client:', error)
      return NextResponse.json({ 
        error: 'Client not found',
        details: error?.message 
      }, { status: 404 })
    }

    // Fetch related data separately
    let plan = null
    if (client.planId) {
      const { data: planData } = await supabase
        .from('Plan')
        .select('*')
        .eq('id', client.planId)
        .single()
      plan = planData
    }

    let salesOwner = null
    if (client.salesOwnerId) {
      const { data: ownerData } = await supabase
        .from('User')
        .select('id, name, email')
        .eq('id', client.salesOwnerId)
        .single()
      salesOwner = ownerData
    }

    const { data: users } = await supabase
      .from('User')
      .select('id, email, name, phone, role, clientId')
      .eq('clientId', id)

    const { data: warehouseCapacity } = await supabase
      .from('WarehouseCapacity')
      .select('*')
      .eq('clientId', id)
      .single()

    // Format response
    const formattedClient = {
      ...client,
      plan: plan,
      salesOwner: salesOwner,
      users: users || [],
      warehouseCapacity: warehouseCapacity,
    }

    return NextResponse.json({ client: formattedClient })
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
      individualCbm,
      individualDeliveriesPerMonth,
      individualShipmentsPerMonth,
      individualOperationsRateEur,
      individualOverSpaceRateEur,
      individualAdditionalServicesRateEur,
    } = body

    // Get current client data for change logging
    const { data: currentClient, error: fetchError } = await supabase
      .from('Client')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

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
    // Individual plan fields
    if (individualCbm !== undefined) updateData.individualCbm = individualCbm || null
    if (individualDeliveriesPerMonth !== undefined) updateData.individualDeliveriesPerMonth = individualDeliveriesPerMonth || null
    if (individualShipmentsPerMonth !== undefined) updateData.individualShipmentsPerMonth = individualShipmentsPerMonth || null
    if (individualOperationsRateEur !== undefined) updateData.individualOperationsRateEur = individualOperationsRateEur || null
    if (individualOverSpaceRateEur !== undefined) updateData.individualOverSpaceRateEur = individualOverSpaceRateEur || null
    if (individualAdditionalServicesRateEur !== undefined) updateData.individualAdditionalServicesRateEur = individualAdditionalServicesRateEur || null

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

    // Log changes
    const userId = (session.user as any)?.id
    const changes: string[] = []

    // Log discount changes
    if (subscriptionDiscount !== undefined || additionalServicesDiscount !== undefined) {
      const discountDetails = formatDiscountChange(
        currentClient.subscriptionDiscount || null,
        subscriptionDiscount !== undefined ? subscriptionDiscount : currentClient.subscriptionDiscount || null,
        currentClient.additionalServicesDiscount || null,
        additionalServicesDiscount !== undefined ? additionalServicesDiscount : currentClient.additionalServicesDiscount || null
      )
      if (discountDetails) {
        changes.push(discountDetails)
      }
    }

    // Log individual plan changes
    if (individualCbm !== undefined || individualDeliveriesPerMonth !== undefined || 
        individualShipmentsPerMonth !== undefined || individualOperationsRateEur !== undefined ||
        individualOverSpaceRateEur !== undefined || individualAdditionalServicesRateEur !== undefined) {
      const individualDetails = formatIndividualPlanChange(
        {
          cbm: currentClient.individualCbm,
          deliveries: currentClient.individualDeliveriesPerMonth,
          shipments: currentClient.individualShipmentsPerMonth,
          operationsRate: currentClient.individualOperationsRateEur,
          overSpaceRate: currentClient.individualOverSpaceRateEur,
          additionalServicesRate: currentClient.individualAdditionalServicesRateEur,
        },
        {
          cbm: individualCbm !== undefined ? individualCbm : currentClient.individualCbm,
          deliveries: individualDeliveriesPerMonth !== undefined ? individualDeliveriesPerMonth : currentClient.individualDeliveriesPerMonth,
          shipments: individualShipmentsPerMonth !== undefined ? individualShipmentsPerMonth : currentClient.individualShipmentsPerMonth,
          operationsRate: individualOperationsRateEur !== undefined ? individualOperationsRateEur : currentClient.individualOperationsRateEur,
          overSpaceRate: individualOverSpaceRateEur !== undefined ? individualOverSpaceRateEur : currentClient.individualOverSpaceRateEur,
          additionalServicesRate: individualAdditionalServicesRateEur !== undefined ? individualAdditionalServicesRateEur : currentClient.individualAdditionalServicesRateEur,
        }
      )
      if (individualDetails) {
        changes.push(individualDetails)
      }
    }

    // Log plan change
    if (planId !== undefined && planId !== currentClient.planId) {
      const { data: newPlan } = await supabase
        .from('Plan')
        .select('name')
        .eq('id', planId)
        .single()
      changes.push(`Plan: ${currentClient.planId ? 'zmieniony' : 'przypisany'} → ${newPlan?.name || planId}`)
    }

    if (changes.length > 0) {
      await logChange({
        actorId: userId,
        entityType: 'CLIENT',
        entityId: id,
        action: 'Zaktualizowano klienta',
        details: changes.join('; '),
      })
    }

    return NextResponse.json({ client: updatedClient })
  } catch (error) {
    console.error('Error in PUT /api/superadmin/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/superadmin/clients/[id]
 * Delete client (only SUPERADMIN)
 */
export async function DELETE(
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

    // Check if client exists
    const { data: client, error: fetchError } = await supabase
      .from('Client')
      .select('id, displayName')
      .eq('id', id)
      .single()

    if (fetchError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete client (cascade should handle related records, but we'll delete explicitly if needed)
    // First, delete related records that might not cascade
    const { error: deleteUsersError } = await supabase
      .from('User')
      .delete()
      .eq('clientId', id)

    if (deleteUsersError) {
      console.error('Error deleting client users:', deleteUsersError)
      // Continue anyway, might be no users
    }

    // Delete the client
    const { error: deleteError } = await supabase
      .from('Client')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting client:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete client', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Client deleted successfully' 
    })
  } catch (error) {
    console.error('Error in DELETE /api/superadmin/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

