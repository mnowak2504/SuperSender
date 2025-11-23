import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * DELETE /api/superadmin/data-management/delete-test-data
 * Delete all test data (only SUPERADMIN)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deletedCounts: Record<string, number> = {}

    // 1. Find test clients (emails containing "test")
    const { data: testClients } = await supabase
      .from('Client')
      .select('id')
      .or('email.ilike.%test%,displayName.ilike.%test%')

    const testClientIds = testClients?.map(c => c.id) || []

    if (testClientIds.length > 0) {
      // Delete related data first (due to foreign key constraints)
      
      // Delete invoices for test clients
      const { count: invoicesCount } = await supabase
        .from('Invoice')
        .delete()
        .in('clientId', testClientIds)
        .select('*', { count: 'exact', head: false })
      deletedCounts.invoices = invoicesCount || 0

      // Delete media for test clients' deliveries
      const { data: testDeliveries } = await supabase
        .from('DeliveryExpected')
        .select('id')
        .in('clientId', testClientIds)

      const testDeliveryIds = testDeliveries?.map(d => d.id) || []
      
      if (testDeliveryIds.length > 0) {
        // Delete media files from storage first
        const { data: mediaRecords } = await supabase
          .from('Media')
          .select('url')
          .in('deliveryExpectedId', testDeliveryIds)

        if (mediaRecords && mediaRecords.length > 0) {
          for (const media of mediaRecords) {
            try {
              const urlParts = media.url.split('/delivery-photos/')
              if (urlParts.length > 1) {
                const filePath = urlParts[1]
                await supabase.storage
                  .from('delivery-photos')
                  .remove([filePath])
              }
            } catch (storageError) {
              console.error('Error deleting file from storage:', storageError)
            }
          }
        }

        // Delete media records
        const { count: mediaCount } = await supabase
          .from('Media')
          .delete()
          .in('deliveryExpectedId', testDeliveryIds)
          .select('*', { count: 'exact', head: false })
        deletedCounts.media = mediaCount || 0

        // Delete warehouse orders for test deliveries
        const { data: testWarehouseOrders } = await supabase
          .from('WarehouseOrder')
          .select('id')
          .in('sourceDeliveryId', testDeliveryIds)

        const testWarehouseOrderIds = testWarehouseOrders?.map(wo => wo.id) || []

        if (testWarehouseOrderIds.length > 0) {
          // Delete media for warehouse orders
          const { data: woMediaRecords } = await supabase
            .from('Media')
            .select('url')
            .or(`warehouseOrderBeforeId.in.(${testWarehouseOrderIds.join(',')}),warehouseOrderAfterId.in.(${testWarehouseOrderIds.join(',')})`)

          if (woMediaRecords && woMediaRecords.length > 0) {
            for (const media of woMediaRecords) {
              try {
                const urlParts = media.url.split('/delivery-photos/')
                if (urlParts.length > 1) {
                  const filePath = urlParts[1]
                  await supabase.storage
                    .from('delivery-photos')
                    .remove([filePath])
                }
              } catch (storageError) {
                console.error('Error deleting file from storage:', storageError)
              }
            }
          }

          await supabase
            .from('Media')
            .delete()
            .or(`warehouseOrderBeforeId.in.(${testWarehouseOrderIds.join(',')}),warehouseOrderAfterId.in.(${testWarehouseOrderIds.join(',')})`)

          // Delete shipment orders
          const { count: shipmentOrdersCount } = await supabase
            .from('ShipmentOrder')
            .delete()
            .in('clientId', testClientIds)
            .select('*', { count: 'exact', head: false })
          deletedCounts.shipmentOrders = shipmentOrdersCount || 0

          // Delete warehouse orders
          const { count: warehouseOrdersCount } = await supabase
            .from('WarehouseOrder')
            .delete()
            .in('id', testWarehouseOrderIds)
            .select('*', { count: 'exact', head: false })
          deletedCounts.warehouseOrders = warehouseOrdersCount || 0
        }

        // Delete deliveries
        const { count: deliveriesCount } = await supabase
          .from('DeliveryExpected')
          .delete()
          .in('id', testDeliveryIds)
          .select('*', { count: 'exact', head: false })
        deletedCounts.deliveries = deliveriesCount || 0
      }

      // Delete addresses
      const { count: addressesCount } = await supabase
        .from('Address')
        .delete()
        .in('clientId', testClientIds)
        .select('*', { count: 'exact', head: false })
      deletedCounts.addresses = addressesCount || 0

      // Delete users with test emails (but keep non-CLIENT roles)
      const { count: usersCount } = await supabase
        .from('User')
        .delete()
        .in('clientId', testClientIds)
        .select('*', { count: 'exact', head: false })
      deletedCounts.users = usersCount || 0

      // Finally, delete test clients
      const { count: clientsCount } = await supabase
        .from('Client')
        .delete()
        .in('id', testClientIds)
        .select('*', { count: 'exact', head: false })
      deletedCounts.clients = clientsCount || 0
    }

    // Also delete any standalone test data (deliveries, etc. with "test" in name)
    const { data: testDeliveriesStandalone } = await supabase
      .from('DeliveryExpected')
      .select('id')
      .or('supplierName.ilike.%test%,goodsDescription.ilike.%test%')
      .not('clientId', 'in', `(${testClientIds.join(',')})`)

    const standaloneDeliveryIds = testDeliveriesStandalone?.map(d => d.id) || []
    
    if (standaloneDeliveryIds.length > 0) {
      // Delete media
      const { data: mediaRecords } = await supabase
        .from('Media')
        .select('url')
        .in('deliveryExpectedId', standaloneDeliveryIds)

      if (mediaRecords && mediaRecords.length > 0) {
        for (const media of mediaRecords) {
          try {
            const urlParts = media.url.split('/delivery-photos/')
            if (urlParts.length > 1) {
              const filePath = urlParts[1]
              await supabase.storage
                .from('delivery-photos')
                .remove([filePath])
            }
          } catch (storageError) {
            console.error('Error deleting file from storage:', storageError)
          }
        }
      }

      await supabase
        .from('Media')
        .delete()
        .in('deliveryExpectedId', standaloneDeliveryIds)

      const { count: standaloneDeliveriesCount } = await supabase
        .from('DeliveryExpected')
        .delete()
        .in('id', standaloneDeliveryIds)
        .select('*', { count: 'exact', head: false })
      
      deletedCounts.standaloneDeliveries = (deletedCounts.standaloneDeliveries || 0) + (standaloneDeliveriesCount || 0)
    }

    return NextResponse.json({ 
      success: true,
      deletedCounts,
    })
  } catch (error) {
    console.error('Error in DELETE /api/superadmin/data-management/delete-test-data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

