/**
 * Update existing plans in the database with new values
 * Run with: node scripts/update-plans.js
 * 
 * This script updates:
 * - Deliveries per month (Basic: 7, Standard: 14, Professional: 28)
 * - Buffer CBM for Professional plan (5m³)
 * - Local pickup discount for Professional plan (15%)
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

const planUpdates = {
  'Basic': {
    deliveriesPerMonth: 7,
  },
  'Standard': {
    deliveriesPerMonth: 14,
  },
  'Professional': {
    deliveriesPerMonth: 28,
    bufferCbm: 5.0,
    localPickupDiscountPercent: 15.0,
  },
}

async function updatePlans() {
  console.log('Updating plans...\n')

  for (const [planName, updates] of Object.entries(planUpdates)) {
    console.log(`Updating plan "${planName}":`)
    
    // Check if plan exists
    const { data: existingPlan, error: fetchError } = await supabase
      .from('Plan')
      .select('id, name, deliveriesPerMonth, bufferCbm, localPickupDiscountPercent')
      .eq('name', planName)
      .single()

    if (fetchError || !existingPlan) {
      console.error(`  ❌ Plan "${planName}" not found. Skipping...`)
      continue
    }

    console.log(`  Current values:`)
    console.log(`    - Deliveries per month: ${existingPlan.deliveriesPerMonth}`)
    console.log(`    - Buffer CBM: ${existingPlan.bufferCbm || 0}`)
    console.log(`    - Local pickup discount: ${existingPlan.localPickupDiscountPercent || 0}%`)

    // Prepare update data
    const updateData = {}
    if (updates.deliveriesPerMonth !== undefined) {
      updateData.deliveriesPerMonth = updates.deliveriesPerMonth
    }
    if (updates.bufferCbm !== undefined) {
      updateData.bufferCbm = updates.bufferCbm
    }
    if (updates.localPickupDiscountPercent !== undefined) {
      updateData.localPickupDiscountPercent = updates.localPickupDiscountPercent
    }

    // Update plan
    const { data: updatedPlan, error: updateError } = await supabase
      .from('Plan')
      .update(updateData)
      .eq('id', existingPlan.id)
      .select()
      .single()

    if (updateError) {
      console.error(`  ❌ Error updating plan "${planName}":`, updateError.message)
    } else {
      console.log(`  ✅ Successfully updated plan "${planName}":`)
      console.log(`    - Deliveries per month: ${updatedPlan.deliveriesPerMonth}`)
      if (updatedPlan.bufferCbm) {
        console.log(`    - Buffer CBM: ${updatedPlan.bufferCbm}`)
      }
      if (updatedPlan.localPickupDiscountPercent) {
        console.log(`    - Local pickup discount: ${updatedPlan.localPickupDiscountPercent}%`)
      }
    }
    console.log('')
  }

  console.log('Done updating plans!')
}

updatePlans()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

