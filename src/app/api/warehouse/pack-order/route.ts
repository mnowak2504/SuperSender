import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { calculateVolumeCbm, findTransportPricing } from '@/lib/warehouse-calculations'

export const runtime = 'nodejs'

/**
 * API endpoint do pakowania zamówienia przez magazyn
 * 
 * Workflow:
 * 1. Dla PACZEK: tworzenie rekordów Package z wymiarami i obliczonym m³
 * 2. Dla PALET: zapisanie ilości palet i wagi (bez wymiarów - miejsca paletowe)
 * 3. Aktualizacja statusu WarehouseOrder na READY_TO_SHIP
 * 4. Automatyczne obliczanie zajętości magazynowej (tylko dla paczek)
 * 5. Wyliczenie ceny transportu na podstawie typu (palety wg ilości, paczki wg m³)
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
        { error: 'Forbidden - Only warehouse users can pack orders' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { orderId, shipmentType, items, notes } = body

    if (!orderId || !shipmentType || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, shipmentType, and items array' },
        { status: 400 }
      )
    }

    if (shipmentType !== 'PALLET' && shipmentType !== 'PACKAGE') {
      return NextResponse.json(
        { error: 'shipmentType must be either PALLET or PACKAGE' },
        { status: 400 }
      )
    }

    // Sprawdź czy zamówienie istnieje
    const { data: order, error: orderError } = await supabase
      .from('WarehouseOrder')
      .select('*, clientId')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Sprawdź czy zamówienie może być pakowane
    if (order.status !== 'AT_WAREHOUSE' && order.status !== 'TO_PACK') {
      return NextResponse.json(
        { error: `Order cannot be packed. Current status: ${order.status}` },
        { status: 400 }
      )
    }

    let totalWeight = 0
    let totalVolume = 0
    let totalPallets = 0
    let packageInserts: any[] = []

    if (shipmentType === 'PALLET') {
      // Validate and process pallets
      for (const item of items) {
        if (!item.count || item.count <= 0) {
          return NextResponse.json(
            { error: 'Each pallet must have count > 0' },
            { status: 400 }
          )
        }
        if (!item.totalWeightKg || item.totalWeightKg <= 0) {
          return NextResponse.json(
            { error: 'Each pallet must have totalWeightKg > 0' },
            { status: 400 }
          )
        }
        totalPallets += item.count
        totalWeight += item.totalWeightKg
      }
      // For pallets, we don't create Package records (no dimensions stored)
      // Data will be stored in ShipmentOrder when shipment is created
    } else {
      // Validate and process packages
      for (const item of items) {
        if (!item.widthCm || !item.lengthCm || !item.heightCm || !item.weightKg) {
          return NextResponse.json(
            { error: 'Each package must have: widthCm, lengthCm, heightCm, weightKg' },
            { status: 400 }
          )
        }
        if (item.widthCm <= 0 || item.lengthCm <= 0 || item.heightCm <= 0 || item.weightKg <= 0) {
          return NextResponse.json(
            { error: 'All dimensions and weight must be > 0' },
            { status: 400 }
          )
        }
        const volume = item.volumeCbm || calculateVolumeCbm(item.widthCm, item.lengthCm, item.heightCm)
        totalVolume += volume
        totalWeight += item.weightKg

        packageInserts.push({
          id: crypto.randomUUID(),
          warehouseOrderId: orderId,
          type: 'PACKAGE',
          widthCm: item.widthCm,
          lengthCm: item.lengthCm,
          heightCm: item.heightCm,
          weightKg: item.weightKg,
          volumeCbm: volume,
        })
      }

      // Create Package records for packages
      if (packageInserts.length > 0) {
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

        // Trigger warehouse capacity update for packages
        try {
          await supabase.rpc('update_client_warehouse_capacity', { client_id: order.clientId })
        } catch (capacityError) {
          console.warn('Could not update warehouse capacity:', capacityError)
        }
      }
    }

    // Update WarehouseOrder with aggregated data
    const updateData: any = {
      status: 'READY_TO_SHIP',
      packedAt: new Date().toISOString(),
      notes: notes ? `${order.notes || ''}\n[Pakowanie] ${notes}`.trim() : order.notes,
    }

    // Store shipment data in notes or separate field (for now in notes, later we can add fields)
    if (shipmentType === 'PALLET') {
      updateData.packedWeightKg = totalWeight
      // Store pallet count in notes
      updateData.notes = `${updateData.notes || ''}\n[Palety: ${totalPallets}, Waga: ${totalWeight}kg]`.trim()
    } else {
      const avgPackage = items[0]
      updateData.packedLengthCm = avgPackage.lengthCm
      updateData.packedWidthCm = avgPackage.widthCm
      updateData.packedHeightCm = avgPackage.heightCm
      updateData.packedWeightKg = totalWeight
    }

    const { error: updateError } = await supabase
      .from('WarehouseOrder')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order', details: updateError.message },
        { status: 500 }
      )
    }

    // Try to calculate transport pricing
    let transportPrice = null
    let transportPricingId = null

    try {
      const { data: pricingRules } = await supabase
        .from('TransportPricing')
        .select('*')
        .eq('isActive', true)
        .order('priority', { ascending: false })

      if (pricingRules && pricingRules.length > 0) {
        if (shipmentType === 'PALLET') {
          // For pallets: find pricing by count and weight
          const matchingRule = pricingRules.find((rule: any) => {
            const countMatch = (!rule.palletCountMin || totalPallets >= rule.palletCountMin) &&
                              (!rule.palletCountMax || totalPallets <= rule.palletCountMax)
            const weightMatch = (!rule.weightMinKg || totalWeight >= rule.weightMinKg) &&
                               (!rule.weightMaxKg || totalWeight <= rule.weightMaxKg)
            return rule.transportType === 'PALLET' && countMatch && weightMatch
          })

          if (matchingRule) {
            // For pallets, price is per pallet or total based on rule type
            if (matchingRule.type === 'FIXED_PER_UNIT') {
              transportPrice = matchingRule.priceEur * totalPallets
            } else {
              transportPrice = matchingRule.priceEur
            }
            transportPricingId = matchingRule.id
          }
        } else {
          // For packages: find pricing by m³ and weight
          const matchingRule = pricingRules.find((rule: any) => {
            const weightMatch = (!rule.weightMinKg || totalWeight >= rule.weightMinKg) &&
                              (!rule.weightMaxKg || totalWeight <= rule.weightMaxKg)
            const volumeMatch = (!rule.volumeMinCbm || totalVolume >= rule.volumeMinCbm) &&
                               (!rule.volumeMaxCbm || totalVolume <= rule.volumeMaxCbm)
            const typeMatch = rule.transportType === 'PACKAGE'

            return weightMatch && volumeMatch && typeMatch
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

    // Check if this WarehouseOrder is part of a ShipmentOrder
    // If all orders in the shipment are packed, calculate total price and update ShipmentOrder
    try {
      const { data: shipmentItems } = await supabase
        .from('ShipmentItem')
        .select('shipmentId')
        .eq('warehouseOrderId', orderId)

      if (shipmentItems && shipmentItems.length > 0) {
        const shipmentId = shipmentItems[0].shipmentId

        // Get all WarehouseOrders in this shipment
        const { data: allShipmentItems } = await supabase
          .from('ShipmentItem')
          .select('warehouseOrderId')
          .eq('shipmentId', shipmentId)

        if (allShipmentItems && allShipmentItems.length > 0) {
          const warehouseOrderIds = allShipmentItems.map((item: any) => item.warehouseOrderId)

          // Check if all WarehouseOrders are READY_TO_SHIP
          const { data: allOrders } = await supabase
            .from('WarehouseOrder')
            .select('id, status, packages:Package(*)')
            .in('id', warehouseOrderIds)

          const allPacked = allOrders?.every((o: any) => o.status === 'READY_TO_SHIP')

          if (allPacked && allOrders) {
            // Calculate total transport price for entire shipment
            let totalShipmentPrice = 0
            let totalShipmentVolume = 0
            let totalShipmentWeight = 0
            let totalShipmentPallets = 0
            let dominantShipmentType: 'PALLET' | 'PACKAGE' = 'PACKAGE'

            // Get pricing rules
            const { data: pricingRules } = await supabase
              .from('TransportPricing')
              .select('*')
              .eq('isActive', true)
              .order('priority', { ascending: false })

            for (const wo of allOrders) {
              // Calculate volume and weight from packages
              let woVolume = 0
              let woWeight = 0
              let woPallets = 0

              if (wo.packages && wo.packages.length > 0) {
                wo.packages.forEach((pkg: any) => {
                  woVolume += pkg.volumeCbm || 0
                  woWeight += pkg.weightKg || 0
                  if (pkg.type === 'PALLET') woPallets++
                })
              }

              totalShipmentVolume += woVolume
              totalShipmentWeight += woWeight
              totalShipmentPallets += woPallets

              if (woPallets > 0) dominantShipmentType = 'PALLET'
            }

            // Calculate price based on dominant type
            if (pricingRules && pricingRules.length > 0) {
              if (dominantShipmentType === 'PALLET' && totalShipmentPallets > 0) {
                const matchingRule = pricingRules.find((rule: any) => {
                  const countMatch = (!rule.palletCountMin || totalShipmentPallets >= rule.palletCountMin) &&
                                    (!rule.palletCountMax || totalShipmentPallets <= rule.palletCountMax)
                  const weightMatch = (!rule.weightMinKg || totalShipmentWeight >= rule.weightMinKg) &&
                                     (!rule.weightMaxKg || totalShipmentWeight <= rule.weightMaxKg)
                  return rule.transportType === 'PALLET' && countMatch && weightMatch
                })

                if (matchingRule) {
                  totalShipmentPrice = matchingRule.type === 'FIXED_PER_UNIT'
                    ? matchingRule.priceEur * totalShipmentPallets
                    : matchingRule.priceEur
                  transportPricingId = matchingRule.id
                }
              } else {
                // Package pricing
                const matchingRule = pricingRules.find((rule: any) => {
                  const weightMatch = (!rule.weightMinKg || totalShipmentWeight >= rule.weightMinKg) &&
                                    (!rule.weightMaxKg || totalShipmentWeight <= rule.weightMaxKg)
                  const volumeMatch = (!rule.volumeMinCbm || totalShipmentVolume >= rule.volumeMinCbm) &&
                                     (!rule.volumeMaxCbm || totalShipmentVolume <= rule.volumeMaxCbm)
                  return rule.transportType === 'PACKAGE' && weightMatch && volumeMatch
                })

                if (matchingRule) {
                  totalShipmentPrice = matchingRule.priceEur
                  transportPricingId = matchingRule.id
                }
              }
            }

            // Update ShipmentOrder with calculated price and status
            if (totalShipmentPrice > 0) {
              const { error: updateError } = await supabase
                .from('ShipmentOrder')
                .update({
                  calculatedPriceEur: totalShipmentPrice,
                  transportPricingId: transportPricingId,
                  status: 'AWAITING_ACCEPTANCE',
                })
                .eq('id', shipmentId)

              // The database trigger will send email notification
              // If trigger doesn't work, we can call an Edge Function here
              if (updateError) {
                console.error('Error updating shipment order:', updateError)
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
                          calculatedPrice: totalShipmentPrice,
                        }),
                      }).catch((err) => {
                        console.warn('Could not call email function:', err)
                      })
                    }
                  } catch (emailError) {
                    console.warn('Email notification error:', emailError)
                    // Don't fail the packing operation if email fails
                  }
                  
                  console.log('Shipment ready for client:', {
                    shipmentId,
                    clientEmail,
                    price: totalShipmentPrice,
                  })
                }
              }
            }
          }
        }
      }
    } catch (shipmentError) {
      console.warn('Could not update shipment order:', shipmentError)
      // Don't fail the packing operation if shipment update fails
    }

    return NextResponse.json(
      {
        message: 'Order packed successfully',
        orderId,
        status: 'READY_TO_SHIP',
        shipmentType,
        totalPallets: shipmentType === 'PALLET' ? totalPallets : null,
        totalVolume: shipmentType === 'PACKAGE' ? totalVolume : null,
        totalWeight,
        transportPrice,
        transportPricingId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error packing order:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
