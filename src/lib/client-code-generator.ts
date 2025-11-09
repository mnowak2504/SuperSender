import { supabase } from './db'

/**
 * Generates a client code in format: REP-<COUNTRY>-NNN
 * where REP is the sales rep identifier (2-3 chars)
 * COUNTRY is ISO-3166-1 alpha-2
 * NNN is 3-digit zero-padded sequence
 */
export async function generateClientCode(
  salesRepCode: string,
  country: string
): Promise<string> {
  // Find the highest sequence number for this rep+country combination
  const { data: existingClients, error } = await supabase
    .from('Client')
    .select('clientCode')
    .like('clientCode', `${salesRepCode}-${country}-%`)

  if (error) {
    console.error('Error fetching existing client codes:', error)
    // Fallback: use timestamp-based sequence
    const sequence = Math.floor(Math.random() * 999) + 1
    return `${salesRepCode}-${country}-${sequence.toString().padStart(3, '0')}`
  }

  // Extract sequence numbers and find max
  let maxSequence = 0
  existingClients?.forEach((client) => {
    const match = client.clientCode.match(/-(\d{3})$/)
    if (match) {
      const seq = parseInt(match[1], 10)
      if (seq > maxSequence) {
        maxSequence = seq
      }
    }
  })

  // Generate next sequence
  const nextSequence = maxSequence + 1
  return `${salesRepCode}-${country}-${nextSequence.toString().padStart(3, '0')}`
}

/**
 * Generates a temporary client code: TBD-<COUNTRY>-TEMP
 */
export function generateTempClientCode(country: string): string {
  return `TBD-${country}-TEMP`
}

/**
 * Gets sales rep code from User (ADMIN role)
 * For now, we'll use a simple mapping or extract from email/name
 * TODO: Add salesRepCode field to User table
 */
export async function getSalesRepCode(salesRepId: string): Promise<string> {
  const { data: user, error } = await supabase
    .from('User')
    .select('email, name')
    .eq('id', salesRepId)
    .single()

  if (error || !user) {
    console.error('Error fetching sales rep:', error)
    return 'SYS' // System fallback
  }

  // Extract initials from name or email
  if (user.name) {
    const initials = user.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
    if (initials.length >= 2) {
      return initials
    }
  }

  // Fallback: use first 3 chars of email (before @)
  if (user.email) {
    const emailPrefix = user.email.split('@')[0].toUpperCase().slice(0, 3)
    return emailPrefix || 'SYS'
  }

  return 'SYS'
}

