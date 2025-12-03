import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { calculateVolumeCbm } from '@/lib/warehouse-calculations'

export const runtime = 'nodejs'

/**
 * API endpoint do pakowania całego shipmentu przez magazyn
 * 
 * Workflow:
 * 1. Tworzenie rekordów Package powiązanych z ShipmentOrder (nie WarehouseOrder)
 * 2. Aktualizacja statusu wszystkich WarehouseOrders na READY_TO_SHIP
 * 3. Obliczenie ceny transportu dla całego shipmentu
 * 4. Aktualizacja ShipmentOrder: calculatedPriceEur, status: AWAITING_ACCEPTANCE
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
        { error: 'Forbidden - Only warehouse users can pack shipments' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { shipmentId, warehouseOrderIds, shipmentType, items, notes } = body

    if (!shipmentId || !shipmentType || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: shipmentId, shipmentType, and items array' },
        { status: 400 }
      )
    }

    if (shipmentType !== 'PALLET' && shipmentType !== 'PACKAGE') {
      return NextResponse.json(
        { error: 'shipmentType must be either PALLET or PACKAGE' },
        { status: 400 }
      )
    }

    // Check if shipment exists and is in REQUESTED status
    const { data: shipment, error: shipmentError } = await supabase
      .from('ShipmentOrder')
      .select('id, status, clientId')
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      )
    }

    if (shipment.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: `Shipment cannot be packed. Current status: ${shipment.status}` },
        { status: 400 }
      )
    }

    // Verify all warehouse orders belong to this shipment and are marked as packed
    const { data: shipmentItems } = await supabase
      .from('ShipmentItem')
      .select('warehouseOrderId, isPacked')
      .eq('shipmentId', shipmentId)

    const validOrderIds = shipmentItems?.map((item: any) => item.warehouseOrderId) || []
    const allOrdersValid = warehouseOrderIds.every((id: string) => validOrderIds.includes(id))

    if (!allOrdersValid) {
      return NextResponse.json(
        { error: 'Some warehouse orders do not belong to this shipment' },
        { status: 400 }
      )
    }

    // Check if all orders are marked as packed
    const allPacked = shipmentItems?.every((item: any) => 
      item.isPacked === true && warehouseOrderIds.includes(item.warehouseOrderId)
    )

    if (!allPacked) {
      return NextResponse.json(
        { error: 'All warehouse orders must be marked as packed before finalizing shipment dimensions' },
        { status: 400 }
      )
    }

    // Create Package records linked to ShipmentOrder (not WarehouseOrder)
    const packageInserts = items.map((item: any) => {
      const volumeCbm = calculateVolumeCbm(item.widthCm, item.lengthCm, item.heightCm)
      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'cl'
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      return {
        id: generateCUID(),
        shipmentId: shipmentId,
        warehouseOrderId: null, // Packages belong to shipment, not individual warehouse orders
        type: item.type || shipmentType,
        widthCm: item.widthCm,
        lengthCm: item.lengthCm,
        heightCm: item.heightCm,
        weightKg: item.weightKg,
        volumeCbm: volumeCbm,
      }
    })

    const { error: packageError } = await supabase
      .from('Package')
      .insert(packageInserts)

    if (packageError) {
      console.error('Error creating packages:', packageError)
      return NextResponse.json(
        { error: 'Failed to create packages', details: packageError.message },
        { status: 500 }
      )
    }

    // Update warehouse capacity for the client
    // This will free up space because:
    // 1. WarehouseOrders are already IN_PREPARATION (excluded from capacity calculation)
    // 2. Packages are now linked to ShipmentOrder, not WarehouseOrder (so they don't count)
    try {
      await supabase.rpc('update_client_warehouse_capacity', { client_id: shipment.clientId })
      
      // Automatically update monthly additional charges (over-space)
      const { updateMonthlyAdditionalCharges } = await import('@/lib/update-additional-charges')
      await updateMonthlyAdditionalCharges(shipment.clientId)
    } catch (capacityError) {
      console.warn('Could not update warehouse capacity:', capacityError)
      // Don't fail the operation if capacity update fails
    }

    // Note: We do NOT change WarehouseOrder status to PACKED
    // WarehouseOrders remain in IN_PREPARATION status (they are part of a ShipmentOrder)
    // The ShipmentOrder itself changes to QUOTED status, which is what matters
    // This ensures that:
    // 1. WarehouseOrders in IN_PREPARATION don't count towards space usage
    // 2. Packages linked to ShipmentOrder don't count towards space usage
    // 3. Only WarehouseOrders with status AT_WAREHOUSE count towards space usage

    // Calculate total volume, weight, and pallet count
    let totalVolume = 0
    let totalWeight = 0
    let totalPallets = 0

    packageInserts.forEach((pkg: any) => {
      totalVolume += pkg.volumeCbm
      totalWeight += pkg.weightKg
      if (pkg.type === 'PALLET') {
        totalPallets++
      }
    })

    // Calculate transport price
    let transportPrice = 0
    let transportPricingId: string | null = null

    try {
      const { data: pricingRules } = await supabase
        .from('TransportPricing')
        .select('*')
        .eq('isActive', true)
        .order('priority', { ascending: false })

      if (pricingRules && pricingRules.length > 0) {
        if (shipmentType === 'PALLET' && totalPallets > 0) {
          const matchingRule = pricingRules.find((rule: any) => {
            const countMatch = (!rule.palletCountMin || totalPallets >= rule.palletCountMin) &&
                              (!rule.palletCountMax || totalPallets <= rule.palletCountMax)
            const weightMatch = (!rule.weightMinKg || totalWeight >= rule.weightMinKg) &&
                               (!rule.weightMaxKg || totalWeight <= rule.weightMaxKg)
            return rule.transportType === 'PALLET' && countMatch && weightMatch
          })

          if (matchingRule) {
            transportPrice = matchingRule.type === 'FIXED_PER_UNIT'
              ? matchingRule.priceEur * totalPallets
              : matchingRule.priceEur
            transportPricingId = matchingRule.id
          }
        } else {
          // Package pricing
          const matchingRule = pricingRules.find((rule: any) => {
            const weightMatch = (!rule.weightMinKg || totalWeight >= rule.weightMinKg) &&
                              (!rule.weightMaxKg || totalWeight <= rule.weightMaxKg)
            const volumeMatch = (!rule.volumeMinCbm || totalVolume >= rule.volumeMinCbm) &&
                               (!rule.volumeMaxCbm || totalVolume <= rule.volumeMaxCbm)
            return rule.transportType === 'PACKAGE' && weightMatch && volumeMatch
          })

          if (matchingRule) {
            transportPrice = matchingRule.priceEur
            transportPricingId = matchingRule.id
          }
        }
      }
    } catch (pricingError) {
      console.warn('Could not calculate transport pricing:', pricingError)
    }

    // Update ShipmentOrder with calculated price and status
    // After packing, status changes to QUOTED (ready for client to choose transport)
    if (transportPrice > 0) {
      const { error: updateShipmentError } = await supabase
        .from('ShipmentOrder')
        .update({
          calculatedPriceEur: transportPrice,
          transportPricingId: transportPricingId,
          status: 'QUOTED',
        })
        .eq('id', shipmentId)

      if (updateShipmentError) {
        console.error('Error updating shipment order:', updateShipmentError)
      } else {
        // Get client info for email
        const { data: shipmentData } = await supabase
          .from('ShipmentOrder')
          .select('clientId, Client:clientId(email, displayName)')
          .eq('id', shipmentId)
          .single()

        if (shipmentData) {
          const clientEmail = (shipmentData.Client as any)?.email
          const clientName = (shipmentData.Client as any)?.displayName

          // Try to call Edge Function to send email
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            if (supabaseUrl && supabaseAnonKey) {
              await fetch(`${supabaseUrl}/functions/v1/send-shipment-ready-email`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  shipmentId,
                  clientEmail,
                  clientName,
                  calculatedPrice: transportPrice,
                }),
              }).catch((err) => {
                console.warn('Could not call email function:', err)
              })
            }
          } catch (emailError) {
            console.warn('Email notification error:', emailError)
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: 'Shipment packed successfully',
        shipmentId,
        status: 'AWAITING_ACCEPTANCE',
        shipmentType,
        totalPallets: shipmentType === 'PALLET' ? totalPallets : null,
        totalVolume,
        totalWeight,
        transportPrice,
        transportPricingId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error packing shipment:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

