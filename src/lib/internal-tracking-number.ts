/**
 * Generates a unique internal tracking number for warehouse orders
 * Format: INT-YYYY-XXX (Internal - Year - Sequential number)
 * Example: INT-2025-001, INT-2025-002, etc.
 * 
 * This number is used internally by warehouse staff for quick identification
 * and is NOT shown to clients.
 */
export async function generateInternalTrackingNumber(supabase: any): Promise<string | null> {
  const year = new Date().getFullYear()
  const prefix = `INT-${year}-`

  // Find the highest number for this year
  const { data: existingOrders, error } = await supabase
    .from('WarehouseOrder')
    .select('internalTrackingNumber')
    .like('internalTrackingNumber', `${prefix}%`)
    .order('internalTrackingNumber', { ascending: false })
    .limit(1)

  if (error) {
    // Check if error is because column doesn't exist
    if (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
      console.warn('internalTrackingNumber column does not exist in database, skipping generation')
      return null
    }
    console.error('Error fetching existing internal tracking numbers:', error)
    // Fallback: generate based on timestamp
    return `${prefix}${Date.now().toString().slice(-6)}`
  }

  if (!existingOrders || existingOrders.length === 0) {
    // First order of the year
    return `${prefix}001`
  }

  // Extract the number from the highest tracking number
  const lastNumber = existingOrders[0]?.internalTrackingNumber
  if (!lastNumber) {
    return `${prefix}001`
  }

  const lastNumStr = lastNumber.replace(prefix, '')
  const lastNum = parseInt(lastNumStr, 10)

  if (isNaN(lastNum)) {
    // Fallback if parsing fails
    return `${prefix}001`
  }

  // Increment and pad with zeros
  const nextNum = lastNum + 1
  const paddedNum = nextNum.toString().padStart(3, '0')

  return `${prefix}${paddedNum}`
}

