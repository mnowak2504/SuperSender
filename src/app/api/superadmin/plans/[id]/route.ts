import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * PUT /api/superadmin/plans/[id]
 * Update plan pricing (SUPERADMIN only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      operationsRateEur,
      promotionalPriceEur,
    } = body

    // Validate required fields
    if (operationsRateEur === undefined) {
      return NextResponse.json({ error: 'operationsRateEur is required' }, { status: 400 })
    }

    if (operationsRateEur < 0) {
      return NextResponse.json({ error: 'operationsRateEur must be >= 0' }, { status: 400 })
    }

    if (promotionalPriceEur !== undefined && promotionalPriceEur !== null && promotionalPriceEur < 0) {
      return NextResponse.json({ error: 'promotionalPriceEur must be >= 0' }, { status: 400 })
    }

    // Update plan
    const updateData: any = {
      operationsRateEur,
      updatedAt: new Date().toISOString(),
    }

    // Set promotionalPriceEur (can be null to remove promotion)
    if (promotionalPriceEur !== undefined) {
      updateData.promotionalPriceEur = promotionalPriceEur === null || promotionalPriceEur === '' ? null : promotionalPriceEur
    }

    const { data: plan, error } = await supabase
      .from('Plan')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating plan:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error in PUT /api/superadmin/plans/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

