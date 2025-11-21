const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSQL(sql) {
  // Supabase JS client doesn't support raw SQL execution
  // We need to use RPC functions or execute via SQL Editor
  // For now, we'll create a helper that shows what needs to be run
  
  // Try to execute via REST API using rpc
  try {
    // Check if we can use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    // RPC might not exist, that's okay
  }
  
  // If RPC doesn't work, return the SQL to be executed manually
  return { sql, needsManualExecution: true }
}

async function addColumn(table, column, type) {
  // Try to add column using Supabase REST API
  // Note: This might not work directly, but we'll try
  console.log(`Adding column ${column} to ${table}...`)
  
  // For now, we'll just return the SQL
  return `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${type};`
}

async function createIndividualPlan() {
  console.log('Creating Individual plan...')
  
  // Check if plan already exists
  const { data: existingPlan } = await supabase
    .from('Plan')
    .select('id')
    .eq('name', 'Individual')
    .single()
  
  if (existingPlan) {
    console.log('✅ Plan "Individual" already exists')
    return existingPlan.id
  }
  
  // Generate a unique ID
  const planId = 'ind_' + Math.random().toString(36).substring(2, 10)
  
  // Create the plan
  const { data: newPlan, error } = await supabase
    .from('Plan')
    .insert({
      id: planId,
      name: 'Individual',
      deliveriesPerMonth: 999,
      spaceLimitCbm: 999,
      overSpaceRateEur: 0,
      operationsRateEur: 0,
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ Error creating Individual plan:', error.message)
    return null
  }
  
  console.log('✅ Plan "Individual" created successfully')
  return newPlan.id
}

async function main() {
  console.log('🚀 Running migrations for Individual plan support...\n')
  
  // Step 1: Add individual plan fields to Client table
  console.log('Step 1: Adding individual plan fields to Client table...')
  const migration1Path = path.join(__dirname, '../prisma/migrations/add-individual-plan-fields.sql')
  
  if (fs.existsSync(migration1Path)) {
    const sql = fs.readFileSync(migration1Path, 'utf8')
    
    // Extract column additions
    const columnAdditions = [
      { name: 'individualCbm', type: 'DOUBLE PRECISION' },
      { name: 'individualDeliveriesPerMonth', type: 'INTEGER' },
      { name: 'individualShipmentsPerMonth', type: 'INTEGER' },
      { name: 'individualOperationsRateEur', type: 'DOUBLE PRECISION' },
      { name: 'individualOverSpaceRateEur', type: 'DOUBLE PRECISION' },
      { name: 'individualAdditionalServicesRateEur', type: 'DOUBLE PRECISION' },
    ]
    
    console.log('\n⚠️  Supabase JS client does not support ALTER TABLE directly.')
    console.log('Please run the following SQL in Supabase SQL Editor:\n')
    console.log('='.repeat(60))
    console.log(sql)
    console.log('='.repeat(60))
    console.log('\nOr go to: https://supabase.com/dashboard → Your Project → SQL Editor\n')
  } else {
    console.error('❌ Migration file not found:', migration1Path)
  }
  
  // Step 2: Create Individual plan
  console.log('\nStep 2: Creating Individual plan...')
  const planId = await createIndividualPlan()
  
  if (planId) {
    console.log(`✅ Individual plan ID: ${planId}`)
  }
  
  console.log('\n✅ Migration script completed!')
  console.log('\n📝 Next steps:')
  console.log('1. Run the SQL from Step 1 in Supabase SQL Editor')
  console.log('2. Verify that Individual plan appears in the plans list')
  console.log('3. Test creating/editing a client with Individual plan')
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})

