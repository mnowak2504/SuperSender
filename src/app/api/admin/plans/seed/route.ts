import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabase } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * POST /api/admin/plans/seed
 * Seed default plans into the database
 * Only accessible by ADMIN or SUPERADMIN
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

    // Generate CUID function
    const generateCUID = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = 'cl'
      for (let i = 0; i < 22; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const plans = [
      {
        name: 'Basic',
        deliveriesPerMonth: 4,
        spaceLimitCbm: 2.5,
        overSpaceRateEur: 20.0,
        operationsRateEur: 59.0,
      },
      {
        name: 'Standard',
        deliveriesPerMonth: 8,
        spaceLimitCbm: 5.0,
        overSpaceRateEur: 20.0,
        operationsRateEur: 99.0,
      },
      {
        name: 'Professional',
        deliveriesPerMonth: 12,
        spaceLimitCbm: 20.0, // 15 CBM + 5 CBM buffer
        overSpaceRateEur: 20.0,
        operationsRateEur: 229.0,
      },
      {
        name: 'Enterprise',
        deliveriesPerMonth: 999, // Unlimited
        spaceLimitCbm: 50.0, // 50 CBM+
        overSpaceRateEur: 20.0,
        operationsRateEur: 0, // Custom pricing
      },
    ]

    const createdPlans = []
    const skippedPlans = []

    for (const plan of plans) {
      // Check if plan already exists
      const { data: existing } = await supabase
        .from('Plan')
        .select('id')
        .eq('name', plan.name)
        .single()

      if (existing) {
        skippedPlans.push(plan.name)
        continue
      }

      const { data, error } = await supabase
        .from('Plan')
        .insert({
          id: generateCUID(),
          ...plan,
        })
        .select()
        .single()

      if (error) {
        console.error(`Error creating plan "${plan.name}":`, error)
        return NextResponse.json(
          { error: `Failed to create plan "${plan.name}"`, details: error.message },
          { status: 500 }
        )
      }

      createdPlans.push(plan.name)
    }

    return NextResponse.json({
      success: true,
      message: 'Plans seeded successfully',
      created: createdPlans,
      skipped: skippedPlans,
    })
  } catch (error) {
    console.error('Error seeding plans:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

