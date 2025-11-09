/**
 * Seed default plans into the database
 * Run with: node scripts/seed-plans.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

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

async function seedPlans() {
  console.log('Seeding plans...')

  for (const plan of plans) {
    // Check if plan already exists
    const { data: existing } = await supabase
      .from('Plan')
      .select('id')
      .eq('name', plan.name)
      .single()

    if (existing) {
      console.log(`Plan "${plan.name}" already exists, skipping...`)
      continue
    }

    const { data, error } = await supabase
      .from('Plan')
      .insert(plan)
      .select()
      .single()

    if (error) {
      console.error(`Error creating plan "${plan.name}":`, error)
    } else {
      console.log(`✓ Created plan: ${plan.name}`)
    }
  }

  console.log('Done seeding plans!')
}

seedPlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

