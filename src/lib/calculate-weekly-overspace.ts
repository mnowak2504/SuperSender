/**
 * Calculate weekly pro-rata over-space charges
 * €5/m³ per started week of over-limit usage
 * 
 * For Professional plan: 5m³ buffer is free, charge only for space above buffer
 */

interface OverspacePeriod {
  startDate: Date
  endDate: Date | null // null if still active
  overSpaceCbm: number // Amount of space over limit during this period
}

/**
 * Calculate over-space charge based on weekly pro-rata
 * @param usedCbm - Current used space in m³
 * @param limitCbm - Base limit from subscription (without buffer)
 * @param bufferCbm - Free buffer space (e.g., 5m³ for Professional plan)
 * @param overSpaceRateEurPerWeek - Rate per m³ per week (€5)
 * @param existingCharges - Existing MonthlyAdditionalCharges record to track periods
 * @returns Total charge amount in EUR
 */
export function calculateWeeklyOverspaceCharge(
  usedCbm: number,
  limitCbm: number,
  bufferCbm: number = 0,
  overSpaceRateEurPerWeek: number = 5,
  existingCharges?: {
    overSpaceChargedAt: string | null
    overSpaceAmountEur: number
  }
): {
  chargeAmount: number
  overSpaceCbm: number
  weeksCharged: number
  periodStart: Date | null
} {
  // Effective limit = base limit + buffer (buffer is free)
  const effectiveLimitCbm = limitCbm + bufferCbm
  
  // Check if currently over limit
  if (usedCbm <= effectiveLimitCbm) {
    // Not over limit - no charge
    return {
      chargeAmount: 0,
      overSpaceCbm: 0,
      weeksCharged: 0,
      periodStart: null,
    }
  }

  // Calculate over-space amount (only space above effective limit)
  const overSpaceCbm = usedCbm - effectiveLimitCbm

  // Determine period start date
  let periodStart: Date
  const now = new Date()

  if (existingCharges?.overSpaceChargedAt) {
    // Use existing charge date as period start
    periodStart = new Date(existingCharges.overSpaceChargedAt)
  } else {
    // New period - start from now
    periodStart = now
  }

  // Calculate number of started weeks since period start
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const msSinceStart = now.getTime() - periodStart.getTime()
  const weeksSinceStart = Math.floor(msSinceStart / msPerWeek)
  
  // Charge for at least 1 week (even if less than a week has passed)
  const weeksCharged = Math.max(1, weeksSinceStart + 1)

  // Calculate charge: €5/m³ per started week
  const chargeAmount = overSpaceCbm * overSpaceRateEurPerWeek * weeksCharged

  return {
    chargeAmount,
    overSpaceCbm,
    weeksCharged,
    periodStart,
  }
}

