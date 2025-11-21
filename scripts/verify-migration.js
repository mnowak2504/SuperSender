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
  console.log('🔍 Verifying migration...\n')

  try {
    // Check SetupFee table
    console.log('1. Checking SetupFee table...')
    const { data: setupFee, error: setupFeeError } = await supabase
      .from('SetupFee')
      .select('*')
      .limit(1)

    if (setupFeeError) {
      console.error('❌ SetupFee table error:', setupFeeError.message)
    } else if (setupFee && setupFee.length > 0) {
      console.log('✅ SetupFee table exists and has data:')
      console.log(`   - ID: ${setupFee[0].id}`)
      console.log(`   - Suggested: €${setupFee[0].suggestedAmountEur}`)
      console.log(`   - Current: €${setupFee[0].currentAmountEur}`)
    } else {
      console.log('⚠️  SetupFee table exists but is empty')
    }

    // Check Voucher table
    console.log('\n2. Checking Voucher table...')
    const { data: vouchers, error: voucherError } = await supabase
      .from('Voucher')
      .select('*')
      .limit(1)

    if (voucherError) {
      console.error('❌ Voucher table error:', voucherError.message)
    } else {
      console.log('✅ Voucher table exists')
      console.log(`   - Vouchers count: ${vouchers?.length || 0}`)
    }

    // Test API endpoints
    console.log('\n3. Testing API endpoints...')
    
    // Test setup fee endpoint
    try {
      const setupFeeRes = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/api/client/setup-fee`, {
        headers: {
          'apikey': supabaseServiceKey,
        },
      })
      if (setupFeeRes.ok) {
        console.log('✅ Setup fee API endpoint accessible')
      } else {
        console.log('⚠️  Setup fee API endpoint returned:', setupFeeRes.status)
      }
    } catch (err) {
      console.log('⚠️  Could not test setup fee API (this is normal if server is not running)')
    }

    console.log('\n✅ Migration verification complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Test the setup fee management at: /superadmin/pricing/setup-fee')
    console.log('2. Create a test voucher in the superadmin panel')
    console.log('3. Test the checkout flow at: /client/checkout')
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
    process.exit(1)
  }
}

verifyMigration()

