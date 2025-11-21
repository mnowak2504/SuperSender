const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQL(sql) {
  // Supabase doesn't have a direct SQL execution method via JS client
  // We need to use RPC or execute via psql
  // For now, let's use the REST API to execute SQL
  console.log('Executing SQL...')
  console.log(sql.substring(0, 100) + '...')
  
  // Note: Supabase JS client doesn't support raw SQL execution
  // We'll need to use the Supabase SQL Editor or create RPC functions
  // For now, let's just output the SQL to be run manually
  console.log('\n=== SQL TO EXECUTE IN SUPABASE SQL EDITOR ===\n')
  console.log(sql)
  console.log('\n=== END SQL ===\n')
  
  // Try to execute via REST API if possible
  try {
    // For individual fields, we can use the REST API
    if (sql.includes('ADD COLUMN')) {
      // Parse and execute column additions one by one
      const columnMatches = sql.matchAll(/ADD COLUMN IF NOT EXISTS "(\w+)"\s+(\w+(?:\([^)]+\))?)/g)
      for (const match of columnMatches) {
        const columnName = match[1]
        const columnType = match[2]
        console.log(`Would add column: ${columnName} ${columnType}`)
        // Note: Supabase JS client doesn't support ALTER TABLE directly
        // This needs to be run in SQL Editor
      }
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

async function main() {
  console.log('Running migrations for Individual plan support...\n')
  
  // Migration 1: Add individual plan fields
  const migration1Path = path.join(__dirname, '../prisma/migrations/add-individual-plan-fields.sql')
  if (fs.existsSync(migration1Path)) {
    console.log('1. Adding individual plan fields...')
    const sql1 = fs.readFileSync(migration1Path, 'utf8')
    await runSQL(sql1)
  } else {
    console.error('Migration file not found:', migration1Path)
  }
  
  // Migration 2: Create Individual plan
  const migration2Path = path.join(__dirname, '../prisma/migrations/create-individual-plan.sql')
  if (fs.existsSync(migration2Path)) {
    console.log('\n2. Creating Individual plan...')
    const sql2 = fs.readFileSync(migration2Path, 'utf8')
    await runSQL(sql2)
  } else {
    console.error('Migration file not found:', migration2Path)
  }
  
  console.log('\n=== IMPORTANT ===')
  console.log('Supabase JS client does not support direct SQL execution.')
  console.log('Please run the SQL above in Supabase SQL Editor:')
  console.log('1. Go to https://supabase.com/dashboard')
  console.log('2. Select your project')
  console.log('3. Go to SQL Editor')
  console.log('4. Paste and run the SQL statements shown above')
}

main().catch(console.error)

