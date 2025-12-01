import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/client/additional-charges
 * Get additional charges for current month (client)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get clientId
    let clientId = (session.user as any)?.clientId
    if (!clientId) {
      const { data: client } = await supabase
        .from('Client')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (client) {
        clientId = client.id
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get current month/year
    const now = new Date()
    const month = now.getMonth() + 1 // 1-12
    const year = now.getFullYear()

    // Get monthly charges for current month
    const { data: charges, error } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', clientId)
      .eq('month', month)
      .eq('year', year)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching additional charges:', error)
      return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 })
    }

    // If no charges yet, return empty structure
    if (!charges) {
      return NextResponse.json({
        charges: {
          month,
          year,
          overSpaceAmountEur: 0,
          additionalServicesAmountEur: 0,
          totalAmountEur: 0,
        },
      })
    }

    return NextResponse.json({ charges })
  } catch (error) {
    console.error('Error in GET /api/client/additional-charges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

