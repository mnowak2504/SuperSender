/**
 * Utility functions for automatically updating MonthlyAdditionalCharges
 * Called when warehouse capacity changes or additional services are used
 */

import { supabase } from './db'
import { calculateWeeklyOverspaceCharge } from './calculate-weekly-overspace'

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
          bufferCbm,
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

    // Get base limit from plan (without buffer - buffer is handled separately)
    const baseLimitCbm = capacity?.limitCbm || client.limitCbm || (client.plan as any)?.spaceLimitCbm || 0
    
    // Get buffer from plan (e.g., 5m³ for Professional)
    const bufferCbm = (client.plan as any)?.bufferCbm || 0
    
    const usedCbm = capacity?.usedCbm || client.usedCbm || 0

    // Get existing charges first (needed to track period start)
    const { data: existingCharges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', clientId)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single()

    // Calculate weekly pro-rata over-space charge
    // €5/m³ per started week (new logic - no longer increases limit)
    const overSpaceRateEurPerWeek = 5 // €5/m³ per week
    const overspaceCalculation = calculateWeeklyOverspaceCharge(
      usedCbm,
      baseLimitCbm,
      bufferCbm,
      overSpaceRateEurPerWeek,
      existingCharges ? {
        overSpaceChargedAt: existingCharges.overSpaceChargedAt,
        overSpaceAmountEur: existingCharges.overSpaceAmountEur || 0,
      } : undefined
    )

    const overSpaceAmountEur = overspaceCalculation.chargeAmount
    const overSpaceCbm = overspaceCalculation.overSpaceCbm
    const periodStart = overspaceCalculation.periodStart

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
      // Update overspace charge (weekly pro-rata)
      const updateData: any = {
        overSpaceAmountEur,
        totalAmountEur,
        updatedAt: new Date().toISOString(),
      }
      
      // If overspace exists, set/update charge date (period start)
      if (overSpaceAmountEur > 0 && periodStart) {
        // If no charge date exists, set it to period start
        // Otherwise keep existing date (to track continuous period)
        if (!existingCharges.overSpaceChargedAt) {
          updateData.overSpaceChargedAt = periodStart.toISOString()
        }
        // Store over-space CBM for reference (not used for limit increase anymore)
        // We don't use overSpacePaidCbm anymore - overspace doesn't increase limit
      } else if (overSpaceAmountEur === 0 && existingCharges.overSpaceAmountEur > 0) {
        // Overspace was cleared (client reduced usage below limit)
        // Reset charge date - new period will start if overspace occurs again
        updateData.overSpaceChargedAt = null
      }
      
      const { error: updateError } = await supabase
        .from('MonthlyAdditionalCharges')
        .update(updateData)
        .eq('id', existingCharges.id)

      if (updateError) {
        console.error('[updateMonthlyAdditionalCharges] Error updating charges:', updateError)
        return { success: false, error: 'Failed to update charges' }
      }
    } else {
      // Create new charges record
      const insertData: any = {
        id: generateCUID(),
        clientId: clientId,
        month: targetMonth,
        year: targetYear,
        overSpaceAmountEur,
        additionalServicesAmountEur: 0, // Will be added separately for local collection, etc.
        totalAmountEur,
      }
      
      // If overspace was charged, set charge date (period start)
      if (overSpaceAmountEur > 0 && periodStart) {
        insertData.overSpaceChargedAt = periodStart.toISOString()
        // Note: We no longer use overSpacePaidCbm - overspace doesn't increase limit
      }
      
      const { error: insertError } = await supabase
        .from('MonthlyAdditionalCharges')
        .insert(insertData)

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

