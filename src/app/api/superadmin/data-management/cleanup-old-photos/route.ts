import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/superadmin/data-management/cleanup-old-photos
 * Cleanup photos older than 2 months after shipment delivery (only SUPERADMIN)
 * This can be called manually or scheduled via cron
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate date: 2 months ago from now
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

    console.log('[API /superadmin/data-management/cleanup-old-photos] Cleaning up photos older than:', twoMonthsAgo.toISOString())

    // Find all delivered shipments older than 2 months
    // Note: We use createdAt as proxy for delivery date since there's no deliveredAt field
    // In production, you might want to add a deliveredAt field to ShipmentOrder
    const { data: oldShipments, error: shipmentsError } = await supabase
      .from('ShipmentOrder')
      .select('id, clientId, createdAt')
      .eq('status', 'DELIVERED')
      .lt('createdAt', twoMonthsAgo.toISOString())

    if (shipmentsError) {
      console.error('Error fetching old shipments:', shipmentsError)
      return NextResponse.json({ 
        error: 'Failed to fetch old shipments',
        details: shipmentsError.message
      }, { status: 500 })
    }

    const oldShipmentIds = oldShipments?.map(s => s.id) || []
    console.log(`[API /superadmin/data-management/cleanup-old-photos] Found ${oldShipmentIds.length} old delivered shipments`)

    // Find warehouse orders related to these shipments
    const { data: warehouseOrders, error: woError } = await supabase
      .from('WarehouseOrder')
      .select('id, sourceDeliveryId, clientId')
      .in('clientId', oldShipments?.map(s => s.clientId) || [])

    if (woError) {
      console.error('Error fetching warehouse orders:', woError)
    }

    const warehouseOrderIds = warehouseOrders?.map(wo => wo.id) || []
    const deliveryIds = warehouseOrders?.map(wo => wo.sourceDeliveryId).filter(Boolean) || []

    // Find media records to delete:
    // 1. Media linked to deliveries older than 2 months after shipment delivery
    // 2. Media linked to warehouse orders from old shipments
    const mediaToDelete: string[] = []

    // Get media for old deliveries
    if (deliveryIds.length > 0) {
      const { data: deliveryMedia, error: deliveryMediaError } = await supabase
        .from('Media')
        .select('id, url, deliveryExpectedId, createdAt')
        .in('deliveryExpectedId', deliveryIds)

      if (!deliveryMediaError && deliveryMedia) {
        // Check if delivery is older than 2 months after shipment
        for (const media of deliveryMedia) {
          // Find the shipment for this delivery
          const warehouseOrder = warehouseOrders?.find(wo => wo.sourceDeliveryId === media.deliveryExpectedId)
          if (warehouseOrder) {
            const shipment = oldShipments?.find(s => s.clientId === warehouseOrder.clientId)
            if (shipment) {
              const mediaAge = new Date(media.createdAt)
              const shipmentDeliveryDate = new Date(shipment.createdAt)
              const monthsSinceDelivery = (new Date().getTime() - shipmentDeliveryDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
              
              if (monthsSinceDelivery >= 2) {
                mediaToDelete.push(media.id)
              }
            }
          }
        }
      }
    }

    // Get media for warehouse orders
    if (warehouseOrderIds.length > 0) {
      const { data: woMedia, error: woMediaError } = await supabase
        .from('Media')
        .select('id, url, warehouseOrderBeforeId, warehouseOrderAfterId, createdAt')
        .or(`warehouseOrderBeforeId.in.(${warehouseOrderIds.join(',')}),warehouseOrderAfterId.in.(${warehouseOrderIds.join(',')})`)

      if (!woMediaError && woMedia) {
        for (const media of woMedia) {
          const warehouseOrderId = media.warehouseOrderBeforeId || media.warehouseOrderAfterId
          const warehouseOrder = warehouseOrders?.find(wo => wo.id === warehouseOrderId)
          if (warehouseOrder) {
            const shipment = oldShipments?.find(s => s.clientId === warehouseOrder.clientId)
            if (shipment) {
              const monthsSinceDelivery = (new Date().getTime() - new Date(shipment.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
              
              if (monthsSinceDelivery >= 2) {
                mediaToDelete.push(media.id)
              }
            }
          }
        }
      }
    }

    console.log(`[API /superadmin/data-management/cleanup-old-photos] Found ${mediaToDelete.length} media records to delete`)

    if (mediaToDelete.length === 0) {
      return NextResponse.json({ 
        success: true,
        deletedCount: 0,
        message: 'No photos to clean up'
      })
    }

    // Get URLs before deleting (to remove from storage)
    const { data: mediaRecords, error: mediaFetchError } = await supabase
      .from('Media')
      .select('url')
      .in('id', mediaToDelete)

    if (mediaFetchError) {
      console.error('Error fetching media URLs:', mediaFetchError)
    }

    // Delete files from storage
    if (mediaRecords && mediaRecords.length > 0) {
      const filesToDelete: string[] = []
      
      for (const media of mediaRecords) {
        try {
          // Extract path from URL
          const urlParts = media.url.split('/delivery-photos/')
          if (urlParts.length > 1) {
            filesToDelete.push(urlParts[1])
          }
        } catch (error) {
          console.error('Error parsing media URL:', error)
        }
      }

      if (filesToDelete.length > 0) {
        console.log(`[API /superadmin/data-management/cleanup-old-photos] Deleting ${filesToDelete.length} files from storage`)
        
        // Delete in batches of 100 (Supabase limit)
        for (let i = 0; i < filesToDelete.length; i += 100) {
          const batch = filesToDelete.slice(i, i + 100)
          const { error: storageError } = await supabase.storage
            .from('delivery-photos')
            .remove(batch)

          if (storageError) {
            console.error(`Error deleting batch ${i / 100 + 1} from storage:`, storageError)
          }
        }
      }
    }

    // Delete media records from database
    const { count, error: deleteError } = await supabase
      .from('Media')
      .delete()
      .in('id', mediaToDelete)
      .select('*', { count: 'exact', head: false })

    if (deleteError) {
      console.error('[API /superadmin/data-management/cleanup-old-photos] Error deleting media:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete media records',
        details: deleteError.message
      }, { status: 500 })
    }

    const deletedCount = count || 0

    console.log(`[API /superadmin/data-management/cleanup-old-photos] Successfully deleted ${deletedCount} media records`)

    return NextResponse.json({ 
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} photos older than 2 months after delivery`
    })
  } catch (error) {
    console.error('Error in POST /api/superadmin/data-management/cleanup-old-photos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

