# Rozwiązywanie problemów z Supabase

## Aktualne problemy:

### 1. Internal Server Error przy rejestracji
- **Status**: Kod używa już Supabase Client zamiast Prisma ✅
- **RLS**: Wyłączone dla wszystkich tabel ✅
- **Baza danych**: Gotowa, tabele istnieją ✅

### 2. Możliwe przyczyny błędów:

#### A. Service Role Key
Supabase Client z anon key może mieć ograniczone uprawnienia. Dla operacji INSERT/UPDATE/DELETE najlepiej użyć **service_role key**.

**Jak znaleźć service_role key:**
1. Otwórz Supabase Dashboard
2. Przejdź do: Settings → API
3. Znajdź sekcję "service_role key" (secret)
4. Skopiuj klucz i dodaj do `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key_tutaj
   ```

#### B. Cache Next.js
Stary cache może trzymać kompilowany kod używający Prisma.

**Rozwiązanie:**
```powershell
# Zatrzymaj wszystkie procesy Node.js
taskkill /F /IM node.exe

# Wyczyść cache
Remove-Item -Recurse -Force .next

# Uruchom ponownie
npm run dev
```

#### C. CamelCase kolumny
Supabase Client może wymagać konwersji camelCase na snake_case lub użycia dokładnych nazw.

**Sprawdź logi** w terminalu po próbie rejestracji - powinny pokazać dokładny błąd z Supabase.

### 3. Test połączenia przez MCP:
✅ Tabele istnieją
✅ RLS wyłączone  
✅ SQL INSERT działa bezpośrednio
❓ Supabase Client może mieć problem z uprawnieniami (anon key)

### 4. Następne kroki:
1. **Dodaj service_role key** do `.env`
2. **Wyczyść cache** i zrestartuj serwer
3. **Sprawdź logi** w terminalu - powinny pokazać szczegółowe błędy z Supabase
4. **Przetestuj rejestrację** ponownie

