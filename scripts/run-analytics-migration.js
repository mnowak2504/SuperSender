const fs = require('fs')
const path = require('path')

async function main() {
  console.log('🚀 Analytics Migration - PageVisit Table\n')
  
  const migrationPath = path.join(__dirname, '../prisma/migrations/add-page-visit-analytics.sql')
  
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
  console.log('1. Go to: https://supabase.com/dashboard → Your Project → SQL Editor')
  console.log('2. Copy and paste the SQL above')
  console.log('3. Click "Run" to execute')
  console.log('4. Verify the table was created in the Table Editor')
  console.log('\n✅ After running the SQL, the analytics system will be ready!')
}

main().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})

