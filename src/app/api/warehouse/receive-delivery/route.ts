import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { calculateVolumeCbm } from '@/lib/warehouse-calculations'
import { generateDeliveryNumber } from '@/lib/delivery-number'
import { sendDeliveryReceivedEmail } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * API endpoint do przyjmowania dostawy przez magazyn
 * 
 * Workflow:
 * 1. Zmiana statusu DeliveryExpected z EXPECTED na RECEIVED (lub DAMAGED)
 * 2. Utworzenie WarehouseOrder ze statusem AT_WAREHOUSE
 * 3. Aktualizacja zajętości przestrzeni klienta
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const role = (session.user as any)?.role
    if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only warehouse users can receive deliveries' },
        { status: 403 }
      )
    }

    // Handle FormData (for file uploads) or JSON
    let deliveryId: string
    let receivedById: string
    let clientId: string
    let items: any[] = []
    let condition: string = 'OK'
    let warehouseLocation: string | null = null
    let notes: string | null = null
    let photos: File[] = []

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      deliveryId = formData.get('deliveryId') as string
      receivedById = formData.get('receivedById') as string
      clientId = formData.get('clientId') as string
      const itemsStr = formData.get('items') as string
      if (itemsStr) {
        try {
          items = JSON.parse(itemsStr)
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid items JSON format' },
            { status: 400 }
          )
        }
      }
      condition = (formData.get('condition') as string) || 'OK'
      warehouseLocation = (formData.get('warehouseLocation') as string) || null
      notes = (formData.get('notes') as string) || null
      
      // Get photos
      const photoFiles = formData.getAll('photos') as File[]
      photos = photoFiles.filter(file => file && file.size > 0)
    } else {
      const body = await req.json()
      deliveryId = body.deliveryId
      receivedById = body.receivedById
      clientId = body.clientId
      items = body.items || []
      condition = body.condition || 'OK'
      warehouseLocation = body.warehouseLocation || null
      notes = body.notes || null
    }

    if (!deliveryId || !receivedById || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: deliveryId, receivedById, clientId' },
        { status: 400 }
      )
    }

    // Sprawdź czy dostawa istnieje i ma status EXPECTED
    const { data: delivery, error: deliveryError } = await supabase
      .from('DeliveryExpected')
      .select('*')
      .eq('id', deliveryId)
      .single()

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    if (delivery.status !== 'EXPECTED') {
      return NextResponse.json(
        { error: `Delivery already processed. Current status: ${delivery.status}` },
        { status: 400 }
      )
    }

    // Określ status na podstawie condition
    const newStatus = condition === 'DAMAGED' ? 'DAMAGED' : 'RECEIVED'

    // Generate delivery number if not already set
    let deliveryNumber = delivery.deliveryNumber
    if (!deliveryNumber) {
      deliveryNumber = await generateDeliveryNumber(supabase)
    }

    // 1. Aktualizuj DeliveryExpected
    const { error: updateError } = await supabase
      .from('DeliveryExpected')
      .update({
        status: newStatus,
        deliveryNumber: deliveryNumber, // Set generated number
        quantity: items.length || null,
        condition: condition || 'OK',
        warehouseLocation: warehouseLocation || null,
        notes: notes || null,
        receivedAt: new Date().toISOString(),
        receivedById: receivedById,
      })
      .eq('id', deliveryId)

    if (updateError) {
      console.error('Error updating delivery:', updateError)
      return NextResponse.json(
        { error: 'Failed to update delivery', details: updateError.message },
        { status: 500 }
      )
    }

    // 2. Utworz WarehouseOrder (tylko jeśli status RECEIVED, nie DAMAGED)
    let warehouseOrderId: string | null = null

    if (newStatus === 'RECEIVED') {
      // Generuj ID dla WarehouseOrder (używamy funkcji pomocniczej jeśli dostępna, lub prostej generacji)
      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'cl'
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }
      warehouseOrderId = generateCUID()

      const { error: warehouseOrderError } = await supabase
        .from('WarehouseOrder')
        .insert({
          id: warehouseOrderId,
          clientId: clientId,
          sourceDeliveryId: deliveryId,
          status: 'AT_WAREHOUSE',
          warehouseLocation: warehouseLocation || null,
          notes: notes || null,
          receivedAt: new Date().toISOString(),
        })

      if (warehouseOrderError) {
        console.error('Error creating warehouse order:', warehouseOrderError)
        return NextResponse.json(
          { error: 'Failed to create warehouse order', details: warehouseOrderError.message },
          { status: 500 }
        )
      }

      // 2.5. Create Package records for each item (if RECEIVED and items provided)
      if (items.length > 0) {
        const packageInserts = items.map((item: any) => ({
          id: crypto.randomUUID(),
          warehouseOrderId: warehouseOrderId!,
          type: item.type || 'PALLET',
          widthCm: item.widthCm,
          lengthCm: item.lengthCm,
          heightCm: item.heightCm,
          weightKg: item.weightKg,
          volumeCbm: item.volumeCbm || calculateVolumeCbm(item.widthCm, item.lengthCm, item.heightCm),
        }))

        const { error: packageError } = await supabase
          .from('Package')
          .insert(packageInserts)

        if (packageError) {
          console.error('Error creating packages:', packageError)
          // Don't fail the whole operation, just log it
        } else {
          // Trigger warehouse capacity update
          try {
            await supabase.rpc('update_client_warehouse_capacity', { client_id: clientId })
          } catch (capacityError) {
            console.warn('Could not update warehouse capacity:', capacityError)
          }
        }
      }

      // 3. Upload zdjęć do Supabase Storage i zapisz do Media (jeśli są)
      if (photos.length > 0) {
        const uploadedPhotos: { id: string; url: string }[] = []

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const fileExt = photo.name.split('.').pop() || 'jpg'
          const fileName = `deliveries/${deliveryId}/${Date.now()}-${i}.${fileExt}`
          
          // Convert File to ArrayBuffer for upload
          const arrayBuffer = await photo.arrayBuffer()
          const fileBuffer = Buffer.from(arrayBuffer)

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('delivery-photos')
            .upload(fileName, fileBuffer, {
              contentType: photo.type || 'image/jpeg',
              upsert: false,
            })

          if (uploadError) {
            console.error(`Error uploading photo ${i}:`, uploadError)
            continue // Skip this photo but continue with others
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('delivery-photos')
            .getPublicUrl(fileName)

          const photoUrl = urlData.publicUrl

          // Generate ID for Media record
          const photoId = 'cl' + Math.random().toString(36).substring(2, 24)
          
          // Save to Media table
          const { error: mediaError } = await supabase
            .from('Media')
            .insert({
              id: photoId,
              url: photoUrl,
              kind: 'delivery_received',
              deliveryExpectedId: deliveryId,
            })

          if (mediaError) {
            console.error(`Error saving photo ${i} to database:`, mediaError)
            // Try to delete uploaded file
            await supabase.storage
              .from('delivery-photos')
              .remove([fileName])
            continue
          }

          uploadedPhotos.push({ id: photoId, url: photoUrl })
        }

        console.log(`Successfully uploaded ${uploadedPhotos.length} photos for delivery ${deliveryId}`)
      }
    }

    // 4. Aktualizuj zajętość przestrzeni klienta (uproszczone - w przyszłości można dodać dokładne obliczenia)
    // Na razie po prostu zwiększamy licznik dostaw
    const { data: client } = await supabase
      .from('Client')
      .select('deliveriesThisMonth')
      .eq('id', clientId)
      .single()

    if (client) {
      await supabase
        .from('Client')
        .update({
          deliveriesThisMonth: (client.deliveriesThisMonth || 0) + 1,
        })
        .eq('id', clientId)
    }

    // 5. Send delivery received email notification (only if status is RECEIVED)
    if (newStatus === 'RECEIVED') {
      // Get delivery details for email
      const { data: updatedDelivery } = await supabase
        .from('DeliveryExpected')
        .select('deliveryNumber, supplierName')
        .eq('id', deliveryId)
        .single()

      // Count photos
      const { count: photosCount } = await supabase
        .from('Media')
        .select('*', { count: 'exact', head: true })
        .eq('deliveryExpectedId', deliveryId)
        .eq('kind', 'delivery_received')

      // Send email (non-blocking)
      sendDeliveryReceivedEmail(
        clientId,
        updatedDelivery?.deliveryNumber || deliveryNumber || 'N/A',
        updatedDelivery?.supplierName || delivery.supplierName || 'Unknown',
        photosCount || photos.length || 0
      ).catch((error) => {
        console.error('Error sending delivery received email:', error)
        // Don't fail the request if email fails
      })
    }

    return NextResponse.json(
      {
        message: 'Delivery received successfully',
        deliveryId,
        warehouseOrderId,
        status: newStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error receiving delivery:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

