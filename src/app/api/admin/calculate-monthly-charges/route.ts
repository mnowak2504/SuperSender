import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'
import { calculateOverSpaceCharge } from '@/lib/warehouse-calculations'

export const runtime = 'nodejs'

/**
 * POST /api/admin/calculate-monthly-charges
 * Calculate monthly additional charges for a client (ADMIN/SUPERADMIN)
 * Can be called for specific month/year or current month
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { clientId, month, year } = body

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    // Use provided month/year or current month
    const now = new Date()
    const targetMonth = month || now.getMonth() + 1 // 1-12
    const targetYear = year || now.getFullYear()

    // Get client with plan
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select(`
        *,
        plan:Plan (
          id,
          name,
          spaceLimitCbm,
          overSpaceRateEur
        )
      `)
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get warehouse capacity
    const { data: capacity } = await supabase
      .from('WarehouseCapacity')
      .select('*')
      .eq('clientId', clientId)
      .single()

    const usedCbm = capacity?.usedCbm || client.usedCbm || 0
    const limitCbm = capacity?.limitCbm || client.limitCbm || (client.plan as any)?.spaceLimitCbm || 0

    // Calculate over-space charge
    const overSpaceRateEur = (client.plan as any)?.overSpaceRateEur || client.individualOverSpaceRateEur || 20 // Default €20/CBM
    const overSpaceAmountEur = calculateOverSpaceCharge(usedCbm, limitCbm, overSpaceRateEur)

    // TODO: Calculate additional services charges
    // This would include:
    // - Extra deliveries beyond plan limit
    // - Extra dispatches beyond plan limit
    // - Other additional services
    // For now, we'll set it to 0 and it can be manually adjusted by admin
    const additionalServicesAmountEur = 0

    const totalAmountEur = overSpaceAmountEur + additionalServicesAmountEur

    // Check if charges already exist for this month
    const { data: existingCharges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('id')
      .eq('clientId', clientId)
      .eq('month', targetMonth)
      .eq('year', targetYear)
      .single()

    if (existingCharges) {
      // Update existing charges
      const { data: updatedCharges, error: updateError } = await supabase
        .from('MonthlyAdditionalCharges')
        .update({
          overSpaceAmountEur,
          additionalServicesAmountEur,
          totalAmountEur,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingCharges.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating monthly charges:', updateError)
        return NextResponse.json({ error: 'Failed to update charges' }, { status: 500 })
      }

      return NextResponse.json({ charges: updatedCharges })
    } else {
      // Create new charges
      const generateCUID = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        let result = 'cl'
        for (let i = 0; i < 22; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
      }

      const chargesId = generateCUID()

      const { data: newCharges, error: createError } = await supabase
        .from('MonthlyAdditionalCharges')
        .insert({
          id: chargesId,
          clientId,
          month: targetMonth,
          year: targetYear,
          overSpaceAmountEur,
          additionalServicesAmountEur,
          totalAmountEur,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating monthly charges:', createError)
        return NextResponse.json({ error: 'Failed to create charges' }, { status: 500 })
      }

      return NextResponse.json({ charges: newCharges })
    }
  } catch (error) {
    console.error('Error in POST /api/admin/calculate-monthly-charges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

