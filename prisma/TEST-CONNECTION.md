# Test połączenia z bazą danych

## Problem
Aplikacja pokazuje "User already exists", ale użytkownik nie jest w bazie Supabase i nie można się zalogować.

## Rozwiązanie krok po kroku

### 1. Sprawdź czy tabele istnieją w Supabase

Otwórz Supabase Dashboard → SQL Editor i uruchom:
```sql
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
```

Jeśli tabela nie istnieje, uruchom `prisma/create-tables.sql`.

### 2. Sprawdź RLS (Row Level Security)

Uruchom w Supabase SQL Editor:
```sql
-- Sprawdź czy RLS jest włączone
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'User';

-- Jeśli rowsecurity = true, wyłącz RLS dla developmentu:
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
```

### 3. Przetestuj połączenie bezpośrednio

Uruchom w Supabase SQL Editor:
```sql
-- Sprawdź czy możesz wstawić użytkownika bezpośrednio
INSERT INTO "User" ("id", "email", "passwordHash", "role") 
VALUES ('test-123', 'test-direct@test.com', 'test-hash', 'CLIENT')
RETURNING *;
```

Jeśli to działa, problem jest w aplikacji. Jeśli nie - problem z uprawnieniami/RLS.

### 4. Sprawdź connection string

Upewnij się, że `.env` ma:
```
DATABASE_URL="postgresql://postgres:N8i2mcwh%21%21@db.wsguzrwyagbnynghfquu.supabase.co:5432/postgres?sslmode=require"
```

### 5. Wyczyść cache i restart

1. Zatrzymaj serwer (Ctrl+C)
2. Usuń `.next`: `Remove-Item -Recurse -Force .next`
3. Wygeneruj Prisma Client: `npx prisma generate`
4. Uruchom ponownie: `npm run dev`

### 6. Sprawdź logi

Po próbie rejestracji, sprawdź logi w terminalu. Powinny pokazać:
- "Registration attempt for email: ..."
- "Creating user in database..."
- "User created successfully: ..."

Jeśli widzisz błędy połączenia, problem jest z connection string lub siecią.

