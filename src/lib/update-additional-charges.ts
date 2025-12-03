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

    // Get effective limit (base limit + paid overspace that hasn't expired)
    const baseLimitCbm = capacity?.limitCbm || client.limitCbm || (client.plan as any)?.spaceLimitCbm || 0
    
    // Check for active paid overspace (not expired - within 1 month from charge date)
    // Use 'now' from line 19 (already defined at function start)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    
    const { data: activeOverspaceCharges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('overSpacePaidCbm, overSpaceChargedAt')
      .eq('clientId', clientId)
      .not('overSpaceChargedAt', 'is', null)
      .gte('overSpaceChargedAt', oneMonthAgo.toISOString())
      .gt('overSpacePaidCbm', 0)
    
    // Sum up all active paid overspace
    const activePaidCbm = activeOverspaceCharges?.reduce((sum, charge) => {
      return sum + (charge.overSpacePaidCbm || 0)
    }, 0) || 0
    
    // Effective limit = base limit + active paid overspace
    const effectiveLimitCbm = baseLimitCbm + activePaidCbm
    
    const usedCbm = capacity?.usedCbm || client.usedCbm || 0

    // Get existing charges first (needed to calculate increase)
    const { data: existingCharges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', clientId)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single()

    // Calculate over-space charge based on effective limit
    const overSpaceRateEur = (client.plan as any)?.overSpaceRateEur || client.individualOverSpaceRateEur || 20 // Default €20/CBM
    const overSpaceAmountEur = calculateOverSpaceCharge(usedCbm, effectiveLimitCbm, overSpaceRateEur)
    
    // Calculate how much NEW space was paid for (only the increase, not total)
    let newOverSpacePaidCbm = 0
    const previousOverSpaceAmount = existingCharges?.overSpaceAmountEur || 0
    const overSpaceIncrease = overSpaceAmountEur - previousOverSpaceAmount
    
    if (overSpaceIncrease > 0 && overSpaceRateEur > 0) {
      // Calculate how much m³ was paid for the increase: increase amount / rate
      newOverSpacePaidCbm = overSpaceIncrease / overSpaceRateEur
    }

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
      // Check if overspace charge increased (new charge was added)
      const previousOverSpaceAmount = existingCharges.overSpaceAmountEur || 0
      const overSpaceIncreased = overSpaceAmountEur > previousOverSpaceAmount
      
      // If overspace increased, update chargedAt and paidCbm
      const updateData: any = {
        overSpaceAmountEur,
        totalAmountEur,
        updatedAt: new Date().toISOString(),
      }
      
      if (overSpaceIncreased && newOverSpacePaidCbm > 0) {
        // New overspace was charged - update charge date and add to paid CBM
        // If this is the first time charging, set chargedAt. Otherwise, keep the original date
        if (!existingCharges.overSpaceChargedAt) {
          updateData.overSpaceChargedAt = new Date().toISOString()
        }
        updateData.overSpacePaidCbm = (existingCharges.overSpacePaidCbm || 0) + newOverSpacePaidCbm
      } else if (overSpaceAmountEur === 0 && previousOverSpaceAmount > 0) {
        // Overspace was cleared (client reduced usage below threshold)
        // Keep existing chargedAt and paidCbm for historical tracking
        // Don't reset them - they represent what was paid for and remain valid for 1 month
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
      
      // If overspace was charged, set charge date and paid CBM
      if (overSpaceAmountEur > 0 && newOverSpacePaidCbm > 0) {
        insertData.overSpaceChargedAt = new Date().toISOString()
        insertData.overSpacePaidCbm = newOverSpacePaidCbm
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

