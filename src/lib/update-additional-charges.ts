/**
 * Utility functions for automatically updating MonthlyAdditionalCharges
 * Called when warehouse capacity changes or additional services are used
 */

import { supabase } from './db'
import { calculateOverSpaceCharge } from './warehouse-calculations'

/**
 * Update or create MonthlyAdditionalCharges for a client
 * Automatically calculates over-space charges based on current warehouse capacity
 */
export async function updateMonthlyAdditionalCharges(
  clientId: string,
  month?: number,
  year?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date()
    const targetMonth = month || now.getMonth() + 1 // 1-12
    const targetYear = year || now.getFullYear()

    // Get client with plan
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select(`
        *,
        plan:Plan (
          id,
          name,
          spaceLimitCbm,
          overSpaceRateEur
        )
      `)
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      console.error('[updateMonthlyAdditionalCharges] Client not found:', clientError)
      return { success: false, error: 'Client not found' }
    }

    // Get warehouse capacity
    const { data: capacity } = await supabase
      .from('WarehouseCapacity')
      .select('*')
      .eq('clientId', clientId)
      .single()

    const usedCbm = capacity?.usedCbm || client.usedCbm || 0
    const limitCbm = capacity?.limitCbm || client.limitCbm || (client.plan as any)?.spaceLimitCbm || 0

    // Calculate over-space charge
    const overSpaceRateEur = (client.plan as any)?.overSpaceRateEur || client.individualOverSpaceRateEur || 20 // Default €20/CBM
    const overSpaceAmountEur = calculateOverSpaceCharge(usedCbm, limitCbm, overSpaceRateEur)

    // Get existing charges to preserve additionalServicesAmountEur
    const { data: existingCharges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', clientId)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single()

    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'mac' // Monthly Additional Charges prefix
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // Preserve additionalServicesAmountEur (local collection, extra deliveries, etc.)
    const additionalServicesAmountEur = existingCharges?.additionalServicesAmountEur || 0
    const totalAmountEur = overSpaceAmountEur + additionalServicesAmountEur

    if (existingCharges) {
      // Update existing charges
      const { error: updateError } = await supabase
        .from('MonthlyAdditionalCharges')
        .update({
          overSpaceAmountEur,
          totalAmountEur,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingCharges.id)

      if (updateError) {
        console.error('[updateMonthlyAdditionalCharges] Error updating charges:', updateError)
        return { success: false, error: 'Failed to update charges' }
      }
    } else {
      // Create new charges record
      const { error: insertError } = await supabase
        .from('MonthlyAdditionalCharges')
        .insert({
          id: generateCUID(),
          clientId: clientId,
          month: targetMonth,
          year: targetYear,
          overSpaceAmountEur,
          additionalServicesAmountEur: 0, // Will be added separately for local collection, etc.
          totalAmountEur,
        })

      if (insertError) {
        console.error('[updateMonthlyAdditionalCharges] Error creating charges:', insertError)
        return { success: false, error: 'Failed to create charges' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[updateMonthlyAdditionalCharges] Error:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * Add additional service charge (e.g., local collection) to MonthlyAdditionalCharges
 * Preserves existing over-space charges
 */
export async function addAdditionalServiceCharge(
  clientId: string,
  amountEur: number,
  month?: number,
  year?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date()
    const targetMonth = month || now.getMonth() + 1
    const targetYear = year || now.getFullYear()

    // Get existing charges
    const { data: existingCharges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', clientId)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single()

    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'mac'
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    if (existingCharges) {
      // Add to existing additional services amount
      const newAdditionalServices = (existingCharges.additionalServicesAmountEur || 0) + amountEur
      const newTotal = (existingCharges.totalAmountEur || 0) + amountEur

      const { error: updateError } = await supabase
        .from('MonthlyAdditionalCharges')
        .update({
          additionalServicesAmountEur: newAdditionalServices,
          totalAmountEur: newTotal,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingCharges.id)

      if (updateError) {
        console.error('[addAdditionalServiceCharge] Error updating charges:', updateError)
        return { success: false, error: 'Failed to update charges' }
      }
    } else {
      // Create new charges record with only additional service charge
      // Over-space will be calculated separately when warehouse capacity updates
      const { error: insertError } = await supabase
        .from('MonthlyAdditionalCharges')
        .insert({
          id: generateCUID(),
          clientId: clientId,
          month: targetMonth,
          year: targetYear,
          overSpaceAmountEur: 0, // Will be calculated on next warehouse capacity update
          additionalServicesAmountEur: amountEur,
          totalAmountEur: amountEur,
        })

      if (insertError) {
        console.error('[addAdditionalServiceCharge] Error creating charges:', insertError)
        return { success: false, error: 'Failed to create charges' }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[addAdditionalServiceCharge] Error:', error)
    return { success: false, error: 'Internal error' }
  }
}

