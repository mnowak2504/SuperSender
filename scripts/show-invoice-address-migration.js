const fs = require('fs')
const path = require('path')

console.log('📋 SQL do wykonania w Supabase SQL Editor dla pól adresu fakturowego:\n')
console.log('='.repeat(70))
console.log('\n')

const migrationPath = path.join(__dirname, '../prisma/migrations/add-invoice-address-fields-complete.sql')
if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, 'utf8')
  console.log(sql)
} else {
  console.log('-- Add separate invoice address fields')
  console.log('ALTER TABLE "Client"')
  console.log('ADD COLUMN IF NOT EXISTS "invoiceAddressLine1" TEXT,')
  console.log('ADD COLUMN IF NOT EXISTS "invoiceAddressLine2" TEXT,')
  console.log('ADD COLUMN IF NOT EXISTS "invoiceCity" TEXT,')
  console.log('ADD COLUMN IF NOT EXISTS "invoicePostCode" TEXT;')
}

console.log('\n')
console.log('='.repeat(70))
console.log('\n📝 Instrukcja:')
console.log('1. Otwórz: https://supabase.com/dashboard')
console.log('2. Wybierz swój projekt')
console.log('3. Przejdź do: SQL Editor')
console.log('4. Skopiuj i wklej powyższy SQL')
console.log('5. Kliknij "Run" lub Ctrl+Enter')
console.log('\n✅ Po wykonaniu migracji pola adresu fakturowego będą dostępne!')

