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

    // Handle FormData or JSON
    let deliveryId: string
    let receivedById: string
    let clientId: string
    let items: any[] = []
    let condition: string = 'NO_REMARKS'
    let warehouseLocation: string | null = null
    let notes: string | null = null

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
      condition = (formData.get('condition') as string) || 'NO_REMARKS'
      warehouseLocation = (formData.get('warehouseLocation') as string) || null
      notes = (formData.get('notes') as string) || null
    } else {
      const body = await req.json()
      deliveryId = body.deliveryId
      receivedById = body.receivedById
      clientId = body.clientId
      items = body.items || []
      condition = body.condition || 'NO_REMARKS'
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

    // Jeśli dostawa już została przetworzona, sprawdź czy WarehouseOrder istnieje
    // Jeśli tak, pozwól na aktualizację (np. dodanie pakietów, zmiana lokalizacji)
    if (delivery.status !== 'EXPECTED') {
      // Sprawdź czy istnieje WarehouseOrder dla tej dostawy
      const { data: existingOrder } = await supabase
        .from('WarehouseOrder')
        .select('id')
        .eq('sourceDeliveryId', deliveryId)
        .maybeSingle()
      
      // Jeśli nie ma WarehouseOrder, to znaczy że coś poszło nie tak - zwróć błąd
      if (!existingOrder) {
        return NextResponse.json(
          { error: `Delivery already processed but no warehouse order found. Current status: ${delivery.status}` },
          { status: 400 }
        )
      }
      
      // Jeśli WarehouseOrder istnieje, kontynuuj (pozwól na aktualizację pakietów/lokalizacji)
      console.log('Delivery already processed, but allowing update. WarehouseOrder exists:', existingOrder.id)
    }

    // Określ status na podstawie condition
    // Wszystkie dostawy są przyjmowane (nie można odmówić), status zawsze RECEIVED
    // Informacja o uszkodzeniu jest zapisywana w notes
    const newStatus = 'RECEIVED'

    // Generate delivery number if not already set
    let deliveryNumber = delivery.deliveryNumber
    if (!deliveryNumber) {
      deliveryNumber = await generateDeliveryNumber(supabase)
    }

    // Get client language preference (default to 'en' if not available)
    // Try to get from Client table, or use default
    let clientLanguage: 'pl' | 'en' | 'de' | 'fr' | 'it' = 'en'
    const { data: clientData } = await supabase
      .from('Client')
      .select('country')
      .eq('id', clientId)
      .single()
    
    // Map country to language (default to English)
    if (clientData?.country) {
      const countryToLang: Record<string, 'pl' | 'en' | 'de' | 'fr' | 'it'> = {
        'Poland': 'pl',
        'Polska': 'pl',
        'PL': 'pl',
        'Germany': 'de',
        'Deutschland': 'de',
        'DE': 'de',
        'France': 'fr',
        'FR': 'fr',
        'Italy': 'it',
        'Italia': 'it',
        'IT': 'it',
      }
      clientLanguage = countryToLang[clientData.country] || 'en'
    }

    // Dodaj informację o stanie opakowania do notes jeśli jest uszkodzenie
    let finalNotes = notes || ''
    if (condition !== 'NO_REMARKS') {
      const { getConditionNote } = await import('@/lib/delivery-condition-translations')
      const conditionNote = getConditionNote(condition, clientLanguage)
      finalNotes = finalNotes ? finalNotes + conditionNote : conditionNote.trim()
    }

    // 1. Aktualizuj DeliveryExpected
    const { error: updateError } = await supabase
      .from('DeliveryExpected')
      .update({
        status: newStatus,
        deliveryNumber: deliveryNumber, // Set generated number
        quantity: items.length || null,
        condition: condition || 'NO_REMARKS',
        warehouseLocation: warehouseLocation || null,
        notes: finalNotes || null,
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
      // Sprawdź czy już istnieje WarehouseOrder dla tego deliveryId (sourceDeliveryId jest unique)
      const { data: existingOrder } = await supabase
        .from('WarehouseOrder')
        .select('id')
        .eq('sourceDeliveryId', deliveryId)
        .maybeSingle()

      if (existingOrder) {
        // WarehouseOrder już istnieje - użyj istniejącego ID i zaktualizuj dane jeśli potrzeba
        warehouseOrderId = existingOrder.id
        console.log('WarehouseOrder already exists for this delivery, using existing:', warehouseOrderId)
        
        // Zaktualizuj warehouseLocation i notes jeśli zostały podane
        if (warehouseLocation || notes) {
          const updateData: any = {}
          if (warehouseLocation) updateData.warehouseLocation = warehouseLocation
          if (notes) updateData.notes = notes
          
          await supabase
            .from('WarehouseOrder')
            .update(updateData)
            .eq('id', warehouseOrderId)
        }
      } else {
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

        // Generate internal tracking number for warehouse use (if column exists)
        const { generateInternalTrackingNumber } = await import('@/lib/internal-tracking-number')
        let internalTrackingNumber: string | null = null
        try {
          internalTrackingNumber = await generateInternalTrackingNumber(supabase)
        } catch (err) {
          console.warn('Could not generate internal tracking number, column may not exist:', err)
        }

        // Build insert data - only include internalTrackingNumber if it was generated
        const insertData: any = {
          id: warehouseOrderId,
          clientId: clientId,
          sourceDeliveryId: deliveryId,
          status: 'AT_WAREHOUSE',
          warehouseLocation: warehouseLocation || null,
          notes: notes || null,
          receivedAt: new Date().toISOString(),
        }
        
        // Only add internalTrackingNumber if column exists and value was generated
        if (internalTrackingNumber !== null) {
          insertData.internalTrackingNumber = internalTrackingNumber
        }

        const { error: warehouseOrderError } = await supabase
          .from('WarehouseOrder')
          .insert(insertData)

        if (warehouseOrderError) {
          console.error('Error creating warehouse order:', warehouseOrderError)
          return NextResponse.json(
            { error: 'Failed to create warehouse order', details: warehouseOrderError.message },
            { status: 500 }
          )
        }
      }

      // 2.5. Create Package records for each item (if RECEIVED and items provided)
      // Sprawdź czy już istnieją pakiety dla tego WarehouseOrder
      if (items.length > 0 && warehouseOrderId) {
        const { data: existingPackages } = await supabase
          .from('Package')
          .select('id')
          .eq('warehouseOrderId', warehouseOrderId)
          .limit(1)
        
        // Twórz pakiety tylko jeśli jeszcze nie istnieją
        if (!existingPackages || existingPackages.length === 0) {
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
              
              // Automatically update monthly additional charges (over-space)
              const { updateMonthlyAdditionalCharges } = await import('@/lib/update-additional-charges')
              await updateMonthlyAdditionalCharges(clientId)
            } catch (capacityError) {
              console.warn('Could not update warehouse capacity:', capacityError)
            }
          }
        } else {
          console.log('Packages already exist for this warehouse order, skipping creation')
        }
      }

      // 3. Zapisz informację o stanie opakowania w notes (jeśli condition != NO_REMARKS)
      // Zdjęcia będą wysyłane mailowo i zapisywane na dysku
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

      // Send email (non-blocking)
      // Note: Photos are sent via email separately, not uploaded to the system
      sendDeliveryReceivedEmail(
        clientId,
        updatedDelivery?.deliveryNumber || deliveryNumber || 'N/A',
        updatedDelivery?.supplierName || delivery.supplierName || 'Unknown',
        0 // No photos uploaded to system
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

