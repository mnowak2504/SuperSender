const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🚀 Attempting to execute migration via Supabase RPC...\n')
  
  try {
    // First, create the RPC function
    const functionSQL = fs.readFileSync(
      path.join(__dirname, '../prisma/migrations/execute-migration-via-supabase.sql'),
      'utf8'
    )
    
    console.log('⚠️  Supabase JS client cannot execute DDL (ALTER TABLE) directly.')
    console.log('Please run the following SQL in Supabase SQL Editor:\n')
    console.log('='.repeat(70))
    console.log(functionSQL)
    console.log('='.repeat(70))
    
    // Try to call the function if it exists
    try {
      const { data, error } = await supabase.rpc('add_individual_plan_columns')
      
      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('\n📝 Function does not exist yet. Please run the SQL above first.')
        } else {
          console.error('❌ Error calling function:', error.message)
        }
      } else {
        console.log('✅ Migration executed successfully via RPC!')
      }
    } catch (rpcError) {
      console.log('\n📝 Function not found. Please run the SQL above in Supabase SQL Editor.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()

