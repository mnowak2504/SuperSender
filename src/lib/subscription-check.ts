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
}> {
  try {
    const { data: client, error } = await supabase
      .from('Client')
      .select('planId, status')
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

    // For now, subscription is active if planId is set
    // TODO: Add grace period logic (3 days past due)
    const hasActiveSubscription = !!client.planId

    return {
      hasActiveSubscription,
      status: client.status || 'INACTIVE',
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
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Active subscription required',
          message: 'Please activate your subscription to use this feature.',
          redirect: '/client/settings?tab=billing',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    }
  }

  return { allowed: true }
}

