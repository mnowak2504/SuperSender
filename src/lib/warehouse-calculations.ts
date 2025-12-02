/**
 * Warehouse calculation utilities
 * Handles m³ calculations, volume with buffer, and transport pricing
 */

/**
 * Calculate volume in m³ with 5% buffer
 * Formula: (width × length × height) / 1,000,000 × 1.05
 */
export function calculateVolumeCbm(
  widthCm: number,
  lengthCm: number,
  heightCm: number
): number {
  const baseVolume = (widthCm * lengthCm * heightCm) / 1_000_000
  return baseVolume * 1.05 // Add 5% buffer
}

/**
 * Calculate total volume from multiple packages
 */
export function calculateTotalVolumeCbm(packages: Array<{
  widthCm: number
  lengthCm: number
  heightCm: number
}>): number {
  return packages.reduce((total, pkg) => {
    return total + calculateVolumeCbm(pkg.widthCm, pkg.lengthCm, pkg.heightCm)
  }, 0)
}

/**
 * Calculate usage percentage
 */
export function calculateUsagePercent(usedCbm: number, limitCbm: number): number {
  if (limitCbm <= 0) return 0
  return (usedCbm / limitCbm) * 100
}

/**
 * Check if client is over limit
 */
export function isOverLimit(usedCbm: number, limitCbm: number): boolean {
  return usedCbm > limitCbm
}

/**
 * Calculate over-space charge (only for m³ over limit)
 * Charge is applied when usage exceeds limit by 20% or more
 */
export function calculateOverSpaceCharge(
  usedCbm: number,
  limitCbm: number,
  overSpaceRateEur: number
): number {
  const threshold = limitCbm * 1.2 // 20% over limit threshold
  if (usedCbm <= threshold) return 0
  const overSpace = usedCbm - threshold // Only charge for space over 120% of limit
  return overSpace * overSpaceRateEur
}

/**
 * Check if client should receive space usage warning (90-120% of limit)
 */
export function shouldShowSpaceWarning(usedCbm: number, limitCbm: number): boolean {
  const usagePercent = (usedCbm / limitCbm) * 100
  return usagePercent >= 90 && usagePercent <= 120
}

/**
 * Find matching transport pricing rule
 */
export function findTransportPricing(
  pricingRules: Array<{
    id: string
    type: 'FIXED_PER_UNIT' | 'DYNAMIC_M3_WEIGHT'
    weightMinKg?: number | null
    weightMaxKg?: number | null
    volumeMinCbm?: number | null
    volumeMaxCbm?: number | null
    priceEur: number
    transportType: string
    isActive: boolean
    priority: number
  }>,
  totalWeightKg: number,
  totalVolumeCbm: number,
  packageType: 'PACKAGE' | 'PALLET'
): {
  pricingId: string
  priceEur: number
  type: string
} | null {
  // Filter active rules matching package type, sorted by priority (highest first)
  const matchingRules = pricingRules
    .filter(rule => 
      rule.isActive &&
      rule.transportType === packageType &&
      (!rule.weightMinKg || totalWeightKg >= rule.weightMinKg) &&
      (!rule.weightMaxKg || totalWeightKg <= rule.weightMaxKg) &&
      (!rule.volumeMinCbm || totalVolumeCbm >= rule.volumeMinCbm) &&
      (!rule.volumeMaxCbm || totalVolumeCbm <= rule.volumeMaxCbm)
    )
    .sort((a, b) => b.priority - a.priority)

  if (matchingRules.length === 0) {
    return null
  }

  const bestMatch = matchingRules[0]

  if (bestMatch.type === 'FIXED_PER_UNIT') {
    // For fixed per unit, return the price as-is
    return {
      pricingId: bestMatch.id,
      priceEur: bestMatch.priceEur,
      type: bestMatch.type,
    }
  } else {
    // For dynamic pricing, could be based on m³ + weight
    // For now, return base price (can be enhanced later)
    return {
      pricingId: bestMatch.id,
      priceEur: bestMatch.priceEur,
      type: bestMatch.type,
    }
  }
}

/**
 * Format volume for display
 */
export function formatVolumeCbm(cbm: number, decimals: number = 2): string {
  return `${cbm.toFixed(decimals)} m³`
}

/**
 * Format usage percentage for display
 */
export function formatUsagePercent(percent: number, decimals: number = 1): string {
  return `${percent.toFixed(decimals)}%`
}

