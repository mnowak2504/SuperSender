const { createClient } = require('@supabase/supabase-js')

require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyMigration() {
  console.log('🔍 Verifying invoice address fields migration...\n')

  try {
    // Check if columns exist by trying to select them
    const { data, error } = await supabase
      .from('Client')
      .select('invoiceAddressLine1, invoiceAddressLine2, invoiceCity, invoicePostCode')
      .limit(1)

    if (error) {
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.error('❌ Migration not completed - columns do not exist')
        console.error('Error:', error.message)
        console.log('\n📝 Please run the migration SQL in Supabase SQL Editor')
        process.exit(1)
      } else {
        console.error('❌ Error checking columns:', error.message)
        process.exit(1)
      }
    } else {
      console.log('✅ Invoice address fields exist in database')
      console.log('   - invoiceAddressLine1')
      console.log('   - invoiceAddressLine2')
      console.log('   - invoiceCity')
      console.log('   - invoicePostCode')
      console.log('\n✅ Migration verified successfully!')
      console.log('\n📝 Next steps:')
      console.log('1. Try saving invoice information in the client profile')
      console.log('2. Check if data is saved correctly')
    }
  } catch (error) {
    console.error('❌ Error during verification:', error)
    process.exit(1)
  }
}

verifyMigration()

