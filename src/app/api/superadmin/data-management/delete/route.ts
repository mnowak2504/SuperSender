import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * DELETE /api/superadmin/data-management/delete
 * Delete old data (only SUPERADMIN)
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

    const searchParams = req.nextUrl.searchParams
    const entityType = searchParams.get('entityType')
    const beforeDate = searchParams.get('beforeDate')

    if (!entityType) {
      return NextResponse.json({ error: 'Entity type is required' }, { status: 400 })
    }

    let deletedCount = 0
    let query: any

    switch (entityType) {
      case 'deliveries':
        query = supabase.from('DeliveryExpected').delete()
        if (beforeDate) {
          query = query.lt('createdAt', beforeDate)
        } else {
          // Delete test deliveries (those with test emails or test data)
          query = query.or('supplierName.ilike.%test%,goodsDescription.ilike.%test%')
        }
        break

      case 'warehouseOrders':
        query = supabase.from('WarehouseOrder').delete()
        if (beforeDate) {
          query = query.lt('createdAt', beforeDate)
        }
        break

      case 'shipmentOrders':
        query = supabase.from('ShipmentOrder').delete()
        if (beforeDate) {
          query = query.lt('createdAt', beforeDate)
        }
        break

      case 'media':
        query = supabase.from('Media').delete()
        if (beforeDate) {
          query = query.lt('createdAt', beforeDate)
        }
        break

      case 'invoices':
        // Only delete unpaid invoices older than specified date
        query = supabase.from('Invoice').delete().eq('status', 'ISSUED')
        if (beforeDate) {
          query = query.lt('createdAt', beforeDate)
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    const { count, error } = await query.select('*', { count: 'exact', head: false })

    if (error) {
      console.error('[API /superadmin/data-management/delete] Error deleting data:', error)
      return NextResponse.json({ 
        error: 'Failed to delete data',
        details: error.message || 'Database error occurred'
      }, { status: 500 })
    }

    deletedCount = count || 0

    // If deleting media, also delete files from storage
    if (entityType === 'media' && beforeDate) {
      // Fetch media records to get URLs
      const { data: mediaRecords } = await supabase
        .from('Media')
        .select('url')
        .lt('createdAt', beforeDate)

      if (mediaRecords && mediaRecords.length > 0) {
        // Extract file paths from URLs and delete from storage
        for (const media of mediaRecords) {
          try {
            // Extract path from URL (e.g., https://xxx.supabase.co/storage/v1/object/public/delivery-photos/path/to/file.jpg)
            const urlParts = media.url.split('/delivery-photos/')
            if (urlParts.length > 1) {
              const filePath = urlParts[1]
              await supabase.storage
                .from('delivery-photos')
                .remove([filePath])
            }
          } catch (storageError) {
            console.error('Error deleting file from storage:', storageError)
            // Continue with other files even if one fails
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      deletedCount,
      entityType,
    })
  } catch (error) {
    console.error('Error in DELETE /api/superadmin/data-management/delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

