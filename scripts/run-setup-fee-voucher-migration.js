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
  console.log('🚀 Running migration for SetupFee and Voucher tables...\n')
  
  const migrationPath = path.join(__dirname, '../prisma/migrations/add-setup-fee-and-voucher.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf8')
  
  console.log('⚠️  Supabase JS client does not support DDL (CREATE TABLE) directly.')
  console.log('Please run the following SQL in Supabase SQL Editor:\n')
  console.log('='.repeat(70))
  console.log(sql)
  console.log('='.repeat(70))
  console.log('\n📝 Instructions:')
  console.log('1. Go to: https://supabase.com/dashboard')
  console.log('2. Select your project')
  console.log('3. Go to: SQL Editor')
  console.log('4. Copy and paste the SQL above')
  console.log('5. Click "Run" or press Ctrl+Enter')
  console.log('\n✅ After running the migration, the SetupFee and Voucher tables will be created!')
}

main().catch(console.error)

