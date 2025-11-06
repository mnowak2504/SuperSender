# Sprawdzanie problemu z zapisywaniem użytkowników

## Problem
Użytkownicy nie są zapisywani w bazie danych po rejestracji.

## Możliwe przyczyny

### 1. Row Level Security (RLS) w Supabase
Supabase domyślnie włącza RLS na wszystkich tabelach. To może blokować INSERT operacje.

**Rozwiązanie:**
1. Otwórz Supabase Dashboard → SQL Editor
2. Uruchom plik `prisma/fix-rls-policies.sql`
3. Najpierw wybierz **OPTION 1** (dla development):
   ```sql
   ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
   ```

### 2. Sprawdź czy użytkownik został faktycznie utworzony
Uruchom w Supabase SQL Editor:
```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
```

### 3. Sprawdź logi aplikacji
Po dodaniu szczegółowego logowania, sprawdź terminal gdzie działa `npm run dev`. 
Powinny pojawić się logi:
- "Registration attempt for email: ..."
- "Creating user in database..."
- "User created successfully: ..."
- "User verified in database: ..."

### 4. Sprawdź connection string
Upewnij się, że używasz połączenia z pełnymi uprawnieniami.
Aktualny connection string używa poolera. Jeśli problem persist, spróbuj:
- Direct connection (port 5432): `postgresql://postgres:N8i2mcwh!!@db.wsguzrwyagbnynghfquu.supabase.co:5432/postgres?sslmode=require`
- Zamiast poolera: `postgresql://postgres.wsguzrwyagbnynghfquu:N8i2mcwh%21%21@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require`

**UWAGA:** Pamiętaj o URL-encoding hasła (`!` = `%21`)

### 5. Sprawdź czy tabela User istnieje
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'User';
```

### 6. Sprawdź uprawnienia użytkownika PostgreSQL
Connection string używa `postgres` (superuser), więc powinien mieć pełne uprawnienia.
Sprawdź czy możesz wykonać:
```sql
INSERT INTO "User" ("id", "email", "passwordHash", "role") 
VALUES ('test-id', 'test@test.com', 'test-hash', 'CLIENT');
```

## Kroki diagnostyczne:

1. **Otwórz terminal z logami aplikacji** (gdzie działa `npm run dev`)
2. **Spróbuj zarejestrować nowego użytkownika**
3. **Sprawdź logi** - powinny pokazać każdy krok procesu rejestracji
4. **Sprawdź bazę danych** - uruchom `SELECT * FROM "User";` w Supabase SQL Editor
5. **Wyłącz RLS** - uruchom `ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;` w Supabase SQL Editor
6. **Spróbuj ponownie** zarejestrować użytkownika

## Po rozwiązaniu:

Gdy już wszystko działa, możesz włączyć RLS z odpowiednimi policies dla produkcji:
```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role to insert users"
ON "User"
FOR INSERT
TO service_role
WITH CHECK (true);
```

