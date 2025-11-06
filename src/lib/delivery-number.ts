/**
 * Generates a unique delivery number in format: DEL-YYYY-XXX
 * Example: DEL-2024-001, DEL-2024-002, etc.
 */
export async function generateDeliveryNumber(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `DEL-${year}-`

  // Find the highest number for this year
  const { data: existingDeliveries, error } = await supabase
    .from('DeliveryExpected')
    .select('deliveryNumber')
    .like('deliveryNumber', `${prefix}%`)
    .order('deliveryNumber', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching existing delivery numbers:', error)
    // Fallback: generate based on timestamp
    return `${prefix}${Date.now().toString().slice(-6)}`
  }

  if (!existingDeliveries || existingDeliveries.length === 0) {
    // First delivery of the year
    return `${prefix}001`
  }

  // Extract the number from the highest delivery number
  const lastNumber = existingDeliveries[0]?.deliveryNumber
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

