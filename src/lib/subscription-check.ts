import { supabase } from './db'

/**
 * Checks if a client has an active subscription
 * @param clientId - The client ID to check
 * @returns Object with hasActiveSubscription boolean and optional error message
 */
export async function checkActiveSubscription(clientId: string): Promise<{
  hasActiveSubscription: boolean
  status?: string
  error?: string
  subscriptionEndDate?: Date | null
  subscriptionStartDate?: Date | null
}> {
  try {
    const { data: client, error } = await supabase
      .from('Client')
      .select('planId, status, subscriptionStartDate, subscriptionEndDate')
      .eq('id', clientId)
      .single()

    if (error) {
      console.error('Error checking subscription:', error)
      return {
        hasActiveSubscription: false,
        error: 'Failed to check subscription status',
      }
    }

    if (!client) {
      return {
        hasActiveSubscription: false,
        error: 'Client not found',
      }
    }

    // No plan = no subscription
    if (!client.planId) {
      return {
        hasActiveSubscription: false,
        status: client.status || 'INACTIVE',
        subscriptionStartDate: client.subscriptionStartDate ? new Date(client.subscriptionStartDate) : null,
        subscriptionEndDate: client.subscriptionEndDate ? new Date(client.subscriptionEndDate) : null,
      }
    }

    // Check if subscription has expired
    const now = new Date()
    const endDate = client.subscriptionEndDate ? new Date(client.subscriptionEndDate) : null
    
    if (endDate && endDate < now) {
      return {
        hasActiveSubscription: false,
        status: 'EXPIRED',
        subscriptionStartDate: client.subscriptionStartDate ? new Date(client.subscriptionStartDate) : null,
        subscriptionEndDate: endDate,
      }
    }

    // Check if subscription has started (if startDate is set)
    const startDate = client.subscriptionStartDate ? new Date(client.subscriptionStartDate) : null
    if (startDate && startDate > now) {
      return {
        hasActiveSubscription: false,
        status: 'PENDING_START',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      }
    }

    // Subscription is active
    return {
      hasActiveSubscription: true,
      status: client.status || 'ACTIVE',
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
    }
  } catch (error) {
    console.error('Error in checkActiveSubscription:', error)
    return {
      hasActiveSubscription: false,
      error: 'Internal error checking subscription',
    }
  }
}

/**
 * Middleware helper to require active subscription
 * Returns NextResponse with error if subscription is not active
 */
export async function requireActiveSubscription(
  clientId: string | null | undefined
): Promise<{ allowed: boolean; response?: Response }> {
  if (!clientId) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: 'Client account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  const subscriptionCheck = await checkActiveSubscription(clientId)

  if (!subscriptionCheck.hasActiveSubscription) {
    const message = subscriptionCheck.status === 'EXPIRED'
      ? 'Your subscription has expired. Please renew your subscription to continue using this feature.'
      : subscriptionCheck.status === 'PENDING_START'
      ? 'Your subscription has not started yet. Please wait until the start date.'
      : 'Please activate your subscription to use this feature.'
    
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Active subscription required',
          message,
          redirect: '/client/settings?tab=billing',
          subscriptionEndDate: subscriptionCheck.subscriptionEndDate,
          subscriptionStartDate: subscriptionCheck.subscriptionStartDate,
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  return { allowed: true }
}

