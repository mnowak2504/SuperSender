/**
 * Prosty skrypt do utworzenia konta Superadmin
 * 
 * Użycie:
 * 1. Edytuj poniżej hasło i email (opcjonalnie)
 * 2. Uruchom: node scripts/create-superadmin-simple.js
 * 
 * Wymaga: npm run dev musi być uruchomione (serwer na localhost:3000)
 */

const http = require('http');

// ============================================
// KONFIGURACJA - ZMIEŃ TUTAJ
// ============================================
const EMAIL = 'm.nowak@makconsulting.pl';
const PASSWORD = 'N8i2mcwh!'; // ⚠️ ZMIEŃ TO HASŁO!
const NAME = 'Michał Nowak';
// ============================================

const postData = JSON.stringify({
  email: EMAIL,
  password: PASSWORD,
  name: NAME,
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/create-superadmin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('🚀 Tworzenie konta Superadmin...');
console.log(`📧 Email: ${EMAIL}`);
console.log(`👤 Imię: ${NAME}`);
console.log(`🔒 Hasło: ${PASSWORD ? '[USTAWIONE]' : 'BRAK!'}`);
console.log('');

if (!PASSWORD || PASSWORD === 'Admin@2024!') {
  console.warn('⚠️  UWAGA: Używasz domyślnego hasła! Zmień je po pierwszym logowaniu!');
  console.log('');
}

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ SUKCES! Konto Superadmin zostało utworzone!');
        console.log('');
        console.log('📋 Szczegóły konta:');
        console.log(`   ID: ${result.user?.id || 'N/A'}`);
        console.log(`   Email: ${result.user?.email || EMAIL}`);
        console.log(`   Rola: ${result.user?.role || 'SUPERADMIN'}`);
        console.log(`   Imię: ${result.user?.name || NAME}`);
        console.log('');
        console.log('🔐 Następne kroki:');
        console.log('   1. Otwórz: http://localhost:3000/auth/signin');
        console.log(`   2. Zaloguj się używając:`);
        console.log(`      Email: ${EMAIL}`);
        console.log(`      Hasło: ${PASSWORD}`);
        console.log('   3. Zostaniesz przekierowany do /superadmin/dashboard');
        console.log('   4. ⚠️  ZMIEŃ HASŁO po pierwszym logowaniu!');
      } else {
        console.error('❌ BŁĄD:', result.error || 'Unknown error');
        if (result.details) {
          console.error('   Szczegóły:', result.details);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Błąd parsowania odpowiedzi:', error.message);
      console.error('Odpowiedź serwera:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Błąd połączenia:', error.message);
  console.error('');
  console.error('💡 Upewnij się, że:');
  console.error('   1. Serwer deweloperski jest uruchomiony (npm run dev)');
  console.error('   2. Serwer działa na http://localhost:3000');
  process.exit(1);
});

req.write(postData);
req.end();

