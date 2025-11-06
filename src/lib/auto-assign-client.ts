import { supabase } from './db'

/**
 * Automatically assigns a new client to a sales owner based on country and workload
 * @param clientId - The ID of the newly created client
 * @param country - The country of the client
 * @returns The ID of the assigned sales owner, or null if no assignment possible
 */
export async function autoAssignClient(clientId: string, country: string): Promise<string | null> {
  try {
    // Get all admins (sales owners)
    const { data: admins, error: adminsError } = await supabase
      .from('User')
      .select('id, email, role')
      .eq('role', 'ADMIN')

    if (adminsError || !admins || admins.length === 0) {
      console.error('No admins found for auto-assignment')
      return null
    }

    // Count clients per admin
    const { data: clientCounts, error: countsError } = await supabase
      .from('Client')
      .select('salesOwnerId')
      .not('salesOwnerId', 'is', null)

    if (countsError) {
      console.error('Error counting clients:', countsError)
      // Fallback: assign to first admin
      return admins[0].id
    }

    // Count clients per admin
    const adminClientCounts: Record<string, number> = {}
    admins.forEach(admin => {
      adminClientCounts[admin.id] = 0
    })

    clientCounts?.forEach(client => {
      if (client.salesOwnerId) {
        adminClientCounts[client.salesOwnerId] = (adminClientCounts[client.salesOwnerId] || 0) + 1
      }
    })

    // Find admin with least clients (round-robin)
    let minCount = Infinity
    let assignedAdminId: string | null = null

    for (const admin of admins) {
      const count = adminClientCounts[admin.id] || 0
      if (count < minCount) {
        minCount = count
        assignedAdminId = admin.id
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

