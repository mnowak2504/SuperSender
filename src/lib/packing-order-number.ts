/**
 * Generates a unique packing order number in format: IE-{COUNTRY_CODE}-{MONTH}-XXX
 * Example: IE-PL-12-001, IE-DE-12-002, etc.
 * 
 * Format: IE (Internal Export) - Country Code - Month (2 digits) - Sequential number (3 digits)
 */
export async function generatePackingOrderNumber(
  supabase: any,
  countryCode: string = 'PL'
): Promise<string> {
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0') // 01-12
  const prefix = `IE-${countryCode}-${month}-`

  // Find the highest number for this country and month
  const { data: existingOrders, error } = await supabase
    .from('ShipmentOrder')
    .select('packingOrderNumber')
    .like('packingOrderNumber', `${prefix}%`)
    .order('packingOrderNumber', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching existing packing order numbers:', error)
    // Fallback: generate based on timestamp
    return `${prefix}${Date.now().toString().slice(-3)}`
  }

  if (!existingOrders || existingOrders.length === 0) {
    // First packing order for this country/month
    return `${prefix}001`
  }

  // Extract the number from the highest packing order number
  const lastNumber = existingOrders[0]?.packingOrderNumber
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

/**
 * Get country code from country name
 */
export function getCountryCode(country: string): string {
  const countryMap: Record<string, string> = {
    'Poland': 'PL',
    'Polska': 'PL',
    'PL': 'PL',
    'Germany': 'DE',
    'Deutschland': 'DE',
    'DE': 'DE',
    'France': 'FR',
    'FR': 'FR',
    'Italy': 'IT',
    'Italia': 'IT',
    'IT': 'IT',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'GB': 'GB',
    'Ireland': 'IE',
    'IE': 'IE',
    'Spain': 'ES',
    'España': 'ES',
    'ES': 'ES',
    'Netherlands': 'NL',
    'Nederland': 'NL',
    'NL': 'NL',
    'Belgium': 'BE',
    'België': 'BE',
    'BE': 'BE',
  }
  
  return countryMap[country] || 'PL' // Default to PL
}

