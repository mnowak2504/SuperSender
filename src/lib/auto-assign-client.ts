import { supabase } from './db'

/**
 * Automatically assigns a new client to a sales owner based on country and workload
 * Logic: Select rep with least accounts for that country; tiebreaker: FIFO (created_at)
 * @param clientId - The ID of the newly created client
 * @param country - The country of the client (ISO-3166-1 alpha-2)
 * @returns The ID of the assigned sales owner, or null if no assignment possible
 */
export async function autoAssignClient(clientId: string, country: string): Promise<string | null> {
  try {
    // Get all admins (sales owners) - these are the sales reps
    const { data: admins, error: adminsError } = await supabase
      .from('User')
      .select('id, email, role, createdAt')
      .in('role', ['ADMIN', 'SUPERADMIN'])

    if (adminsError || !admins || admins.length === 0) {
      console.error('No admins found for auto-assignment')
      return null
    }

    // Count active clients per admin for this specific country
    const { data: clientCounts, error: countsError } = await supabase
      .from('Client')
      .select('salesOwnerId, country')
      .not('salesOwnerId', 'is', null)
      .eq('country', country)

    if (countsError) {
      console.error('Error counting clients:', countsError)
      // Fallback: assign to first admin (oldest)
      const sortedAdmins = [...admins].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      return sortedAdmins[0]?.id || null
    }

    // Count clients per admin for this country
    const adminClientCounts: Record<string, number> = {}
    admins.forEach(admin => {
      adminClientCounts[admin.id] = 0
    })

    clientCounts?.forEach(client => {
      if (client.salesOwnerId && client.country === country) {
        adminClientCounts[client.salesOwnerId] = (adminClientCounts[client.salesOwnerId] || 0) + 1
      }
    })

    // Find admin with least clients for this country
    // Tiebreaker: FIFO (oldest admin first)
    let minCount = Infinity
    let assignedAdminId: string | null = null
    let assignedAdminCreatedAt: Date | null = null

    for (const admin of admins) {
      const count = adminClientCounts[admin.id] || 0
      const adminCreatedAt = new Date(admin.createdAt)

      if (count < minCount) {
        minCount = count
        assignedAdminId = admin.id
        assignedAdminCreatedAt = adminCreatedAt
      } else if (count === minCount && assignedAdminCreatedAt) {
        // Tiebreaker: choose older admin (FIFO)
        if (adminCreatedAt < assignedAdminCreatedAt) {
          assignedAdminId = admin.id
          assignedAdminCreatedAt = adminCreatedAt
        }
      }
    }

    if (assignedAdminId) {
      // Update client with assigned sales owner
      const { error: updateError } = await supabase
        .from('Client')
        .update({ salesOwnerId: assignedAdminId })
        .eq('id', clientId)

      if (updateError) {
        console.error('Error assigning client to admin:', updateError)
        return null
      }

      return assignedAdminId
    }

    return null
  } catch (error) {
    console.error('Error in auto-assignment:', error)
    return null
  }
}

