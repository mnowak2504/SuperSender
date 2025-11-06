/**
 * Script to create superadmin account
 * Run with: node scripts/create-superadmin.js
 * Or use the API endpoint: POST /api/admin/create-superadmin
 */

const fetch = require('node-fetch')

async function createSuperAdmin() {
  const email = 'm.nowak@makconsulting.pl'
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin@2024!'
  const name = 'Michał Nowak'

  console.log('Creating superadmin account...')
  console.log('Email:', email)
  console.log('Password:', password ? '[HIDDEN]' : 'NOT SET')
  console.log('Name:', name)

  if (!password || password === 'Admin@2024!') {
    console.warn('⚠️  WARNING: Using default password! Change it after first login!')
  }

  try {
    const response = await fetch('http://localhost:3000/api/admin/create-superadmin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', data.error || 'Unknown error')
      console.error('Details:', data.details)
      process.exit(1)
    }

    console.log('✅ Success:', data.message)
    console.log('User created:', {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
    })
    console.log('\n📝 Next steps:')
    console.log('1. Log in at http://localhost:3000/auth/signin')
    console.log(`2. Use email: ${email}`)
    console.log(`3. Use password: ${password}`)
    console.log('4. CHANGE YOUR PASSWORD after first login!')
  } catch (error) {
    console.error('❌ Failed to create superadmin:', error.message)
    console.error('\n💡 Make sure:')
    console.error('1. Development server is running (npm run dev)')
    console.error('2. Server is accessible at http://localhost:3000')
    process.exit(1)
  }
}

// Run the script
createSuperAdmin()

