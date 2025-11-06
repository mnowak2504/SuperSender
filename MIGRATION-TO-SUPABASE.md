# Migracja z Prisma do Supabase

## ✅ Co zostało zrobione:

1. ✅ Zainstalowano `@supabase/supabase-js`
2. ✅ Utworzono `src/lib/db.ts` z Supabase client
3. ✅ Zaktualizowano:
   - `src/lib/auth.ts` - logowanie
   - `src/app/api/auth/register/route.ts` - rejestracja
   - `src/types/next-auth.d.ts` - typy

## ⚠️ Co jeszcze wymaga aktualizacji:

Poniższe pliki nadal używają Prisma i wymagają migracji:

- `src/app/client/dashboard/page.tsx` - używa `prisma.client.findUnique` z include
- `src/app/client/deliveries/page.tsx`
- `src/app/client/invoices/page.tsx`
- `src/app/warehouse/dashboard/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/api/client/**/*.ts` - wszystkie API routes dla client
- `src/app/api/warehouse/**/*.ts` - wszystkie API routes dla warehouse
- `src/app/api/payments/**/*.ts` - API routes dla płatności

## 🔧 Następne kroki:

1. **Zrestartuj serwer** - connection string zmieniony na Supabase
2. **Wyłącz RLS w Supabase**:
   ```sql
   ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
   ```
3. **Przetestuj rejestrację i logowanie**
4. **Po sprawdzeniu że działa, można usunąć Prisma:**
   ```bash
   npm uninstall @prisma/client prisma
   rm -rf prisma
   ```

## 📝 Uwagi:

- Dashboard pages mogą wymagać kilku osobnych zapytań zamiast jednego z `include`
- Supabase automatycznie konwertuje camelCase na snake_case dla tabel
- Dla zaawansowanych relacji można użyć Supabase RPC functions

