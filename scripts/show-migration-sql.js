const fs = require('fs')
const path = require('path')

console.log('📋 SQL do wykonania w Supabase SQL Editor:\n')
console.log('='.repeat(70))
console.log('\n')

// Migration 1: Add individual plan fields
const migration1Path = path.join(__dirname, '../prisma/migrations/add-individual-plan-fields.sql')
if (fs.existsSync(migration1Path)) {
  const sql1 = fs.readFileSync(migration1Path, 'utf8')
  console.log(sql1)
  console.log('\n')
}

console.log('='.repeat(70))
console.log('\n📝 Instrukcja:')
console.log('1. Otwórz: https://supabase.com/dashboard')
console.log('2. Wybierz swój projekt')
console.log('3. Przejdź do: SQL Editor')
console.log('4. Skopiuj i wklej powyższy SQL')
console.log('5. Kliknij "Run" lub Ctrl+Enter')
console.log('\n✅ Plan "Individual" został już utworzony automatycznie!')

