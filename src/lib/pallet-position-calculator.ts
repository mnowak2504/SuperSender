/**
 * Pallet position calculator
 * Calculates how many standard pallet positions (120x80cm) a pallet occupies
 */

const STANDARD_PALLET_WIDTH = 120 // cm
const STANDARD_PALLET_LENGTH = 80 // cm
const STANDARD_PALLET_AREA = STANDARD_PALLET_WIDTH * STANDARD_PALLET_LENGTH // 9600 cm²

/**
 * Calculate how many standard pallet positions a pallet occupies
 * Standard position: 120x80cm
 * 
 * @param widthCm - Pallet width in cm
 * @param lengthCm - Pallet length in cm
 * @returns Number of pallet positions (can be fractional, e.g., 0.5, 1.5, 2.0)
 */
export function calculatePalletPositions(
  widthCm: number,
  lengthCm: number
): number {
  // Normalize dimensions (always use larger dimension as width)
  const width = Math.max(widthCm, lengthCm)
  const length = Math.min(widthCm, lengthCm)
  
  // Calculate area
  const palletArea = width * length
  
  // Calculate positions based on area
  const positions = palletArea / STANDARD_PALLET_AREA
  
  return positions
}

/**
 * Calculate pricing multiplier for a pallet based on positions
 * - If >= 1.5 positions: round up to nearest integer
 * - If < 1.5 positions: add 33% surcharge
 * 
 * @param positions - Number of pallet positions (from calculatePalletPositions)
 * @returns Pricing multiplier (e.g., 1.0, 1.33, 2.0)
 */
export function calculatePalletPricingMultiplier(positions: number): number {
  if (positions >= 1.5) {
    // Round up to nearest integer
    return Math.ceil(positions)
  } else {
    // Add 33% surcharge for pallets smaller than 1.5 positions
    return 1.33
  }
}

/**
 * Calculate total pallet positions for multiple pallets
 * 
 * @param pallets - Array of pallet dimensions
 * @returns Total positions count
 */
export function calculateTotalPalletPositions(
  pallets: Array<{ widthCm: number; lengthCm: number }>
): number {
  return pallets.reduce((total, pallet) => {
    return total + calculatePalletPositions(pallet.widthCm, pallet.lengthCm)
  }, 0)
}

/**
 * Calculate total pricing positions (with rounding/surcharge logic)
 * 
 * @param pallets - Array of pallet dimensions
 * @returns Total pricing positions (sum of multipliers)
 */
export function calculateTotalPricingPositions(
  pallets: Array<{ widthCm: number; lengthCm: number }>
): number {
  return pallets.reduce((total, pallet) => {
    const positions = calculatePalletPositions(pallet.widthCm, pallet.lengthCm)
    const multiplier = calculatePalletPricingMultiplier(positions)
    return total + multiplier
  }, 0)
}

