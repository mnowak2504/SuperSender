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

    // Delete related records in correct order (due to foreign key constraints with RESTRICT)
    // Order matters: delete child records before parent records

    // 1. Delete ProformaInvoice (references Client)
    const { error: deleteProformasError } = await supabase
      .from('ProformaInvoice')
      .delete()
      .eq('clientId', id)
    if (deleteProformasError) {
      console.error('Error deleting proforma invoices:', deleteProformasError)
    }

    // 2. Delete MonthlyAdditionalCharges (references Client)
    const { error: deleteChargesError } = await supabase
      .from('MonthlyAdditionalCharges')
      .delete()
      .eq('clientId', id)
    if (deleteChargesError) {
      console.error('Error deleting monthly charges:', deleteChargesError)
    }

    // 3. Delete ShipmentItem (references ShipmentOrder)
    // First, get all shipment orders for this client
    const { data: shipmentOrders } = await supabase
      .from('ShipmentOrder')
      .select('id')
      .eq('clientId', id)
    
    if (shipmentOrders && shipmentOrders.length > 0) {
      const shipmentIds = shipmentOrders.map(so => so.id)
      for (const shipmentId of shipmentIds) {
        const { error: deleteItemsError } = await supabase
          .from('ShipmentItem')
          .delete()
          .eq('shipmentId', shipmentId)
        if (deleteItemsError) {
          console.error('Error deleting shipment items:', deleteItemsError)
        }
      }
    }

    // 4. Delete Package (references ShipmentOrder and WarehouseOrder)
    if (shipmentOrders && shipmentOrders.length > 0) {
      const shipmentIds = shipmentOrders.map(so => so.id)
      for (const shipmentId of shipmentIds) {
        const { error: deletePackagesError } = await supabase
          .from('Package')
          .delete()
          .eq('shipmentId', shipmentId)
        if (deletePackagesError) {
          console.error('Error deleting packages:', deletePackagesError)
        }
      }
    }

    // 5. Delete ShipmentOrder (references Client and Address)
    const { error: deleteShipmentsError } = await supabase
      .from('ShipmentOrder')
      .delete()
      .eq('clientId', id)
    if (deleteShipmentsError) {
      console.error('Error deleting shipment orders:', deleteShipmentsError)
      return NextResponse.json(
        { error: 'Failed to delete shipment orders', details: deleteShipmentsError.message },
        { status: 500 }
      )
    }

    // 6. Delete WarehouseOrder (references Client and DeliveryExpected)
    // First, get warehouse orders to delete related packages
    const { data: warehouseOrders } = await supabase
      .from('WarehouseOrder')
      .select('id')
      .eq('clientId', id)
    
    if (warehouseOrders && warehouseOrders.length > 0) {
      const warehouseOrderIds = warehouseOrders.map(wo => wo.id)
      // Delete packages linked to warehouse orders
      for (const warehouseOrderId of warehouseOrderIds) {
        const { error: deleteWOPackagesError } = await supabase
          .from('Package')
          .delete()
          .eq('warehouseOrderId', warehouseOrderId)
        if (deleteWOPackagesError) {
          console.error('Error deleting warehouse order packages:', deleteWOPackagesError)
        }
      }
    }

    const { error: deleteWarehouseOrdersError } = await supabase
      .from('WarehouseOrder')
      .delete()
      .eq('clientId', id)
    if (deleteWarehouseOrdersError) {
      console.error('Error deleting warehouse orders:', deleteWarehouseOrdersError)
      return NextResponse.json(
        { error: 'Failed to delete warehouse orders', details: deleteWarehouseOrdersError.message },
        { status: 500 }
      )
    }

    // 7. Delete Media (references DeliveryExpected and WarehouseOrder)
    // Delete media linked to warehouse orders (before deleting warehouse orders)
    if (warehouseOrders && warehouseOrders.length > 0) {
      const warehouseOrderIds = warehouseOrders.map(wo => wo.id)
      for (const warehouseOrderId of warehouseOrderIds) {
        // Delete photos before wrap
        const { error: deleteBeforeWrapError } = await supabase
          .from('Media')
          .delete()
          .eq('warehouseOrderBeforeId', warehouseOrderId)
        if (deleteBeforeWrapError) {
          console.error('Error deleting before wrap photos:', deleteBeforeWrapError)
        }
        // Delete photos after wrap
        const { error: deleteAfterWrapError } = await supabase
          .from('Media')
          .delete()
          .eq('warehouseOrderAfterId', warehouseOrderId)
        if (deleteAfterWrapError) {
          console.error('Error deleting after wrap photos:', deleteAfterWrapError)
        }
      }
    }

    // Delete media linked to delivery expected
    const { data: deliveries } = await supabase
      .from('DeliveryExpected')
      .select('id')
      .eq('clientId', id)
    
    if (deliveries && deliveries.length > 0) {
      const deliveryIds = deliveries.map(d => d.id)
      for (const deliveryId of deliveryIds) {
        const { error: deleteMediaError } = await supabase
          .from('Media')
          .delete()
          .eq('deliveryExpectedId', deliveryId)
        if (deleteMediaError) {
          console.error('Error deleting media:', deleteMediaError)
        }
      }
    }

    // 8. Delete DeliveryExpected (references Client)
    const { error: deleteDeliveriesError } = await supabase
      .from('DeliveryExpected')
      .delete()
      .eq('clientId', id)
    if (deleteDeliveriesError) {
      console.error('Error deleting expected deliveries:', deleteDeliveriesError)
      return NextResponse.json(
        { error: 'Failed to delete expected deliveries', details: deleteDeliveriesError.message },
        { status: 500 }
      )
    }

    // 9. Delete Invoice (references Client)
    const { error: deleteInvoicesError } = await supabase
      .from('Invoice')
      .delete()
      .eq('clientId', id)
    if (deleteInvoicesError) {
      console.error('Error deleting invoices:', deleteInvoicesError)
      return NextResponse.json(
        { error: 'Failed to delete invoices', details: deleteInvoicesError.message },
        { status: 500 }
      )
    }

    // 10. Delete Address (references Client)
    const { error: deleteAddressesError } = await supabase
      .from('Address')
      .delete()
      .eq('clientId', id)
    if (deleteAddressesError) {
      console.error('Error deleting addresses:', deleteAddressesError)
      return NextResponse.json(
        { error: 'Failed to delete addresses', details: deleteAddressesError.message },
        { status: 500 }
      )
    }

    // 11. Delete WarehouseCapacity (has onDelete: Cascade, but delete explicitly)
    const { error: deleteCapacityError } = await supabase
      .from('WarehouseCapacity')
      .delete()
      .eq('clientId', id)
    if (deleteCapacityError) {
      console.error('Error deleting warehouse capacity:', deleteCapacityError)
    }

    // 12. Delete User (references Client with SET NULL, but delete explicitly)
    const { error: deleteUsersError } = await supabase
      .from('User')
      .delete()
      .eq('clientId', id)
    if (deleteUsersError) {
      console.error('Error deleting client users:', deleteUsersError)
    }

    // 13. Finally, delete the client
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

