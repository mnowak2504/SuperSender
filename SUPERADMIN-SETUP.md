# Superadmin Setup Guide

## Utworzono strukturę dla 4 kategorii użytkowników:

1. **SUPERADMIN** - Najwyższy poziom uprawnień (m.nowak@makconsulting.pl)
2. **ADMIN** - Administratorzy systemu
3. **WAREHOUSE** - Użytkownicy magazynu
4. **CLIENT** - Klienci

## Co zostało zrobione:

✅ Dodano rolę `SUPERADMIN` do bazy danych  
✅ Zaktualizowano typy TypeScript (`db.ts`, `schema.prisma`)  
✅ Utworzono moduł backend dla superadmina (`/superadmin/*`)  
✅ Utworzono dashboard superadmina z statystykami  
✅ Dodano ochronę routów dla superadmina  

## Jak utworzyć konto Superadmin:

### Metoda 1: Prosty skrypt z pliku (najłatwiejsze! ⭐)

1. **Edytuj plik** `scripts/create-superadmin-simple.js`:
   - Zmień hasło w linii: `const PASSWORD = 'TwojeHaslo123!';`
   - (Opcjonalnie) zmień email lub imię

2. **Uruchom serwer deweloperski** (w jednym terminalu):
   ```bash
   npm run dev
   ```

3. **Uruchom skrypt** (w drugim terminalu):
   ```bash
   node scripts/create-superadmin-simple.js
   ```

Gotowe! Skrypt automatycznie utworzy konto i pokaże dane do logowania.

### Metoda 2: Przez API endpoint

Uruchom serwer deweloperski:
```bash
npm run dev
```

Następnie wywołaj endpoint (możesz użyć przeglądarki, Postman, lub curl):

```bash
curl -X POST http://localhost:3000/api/admin/create-superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "m.nowak@makconsulting.pl",
    "password": "TwojeBezpieczneHaslo123!",
    "name": "Michał Nowak"
  }'
```

Lub w przeglądarce, otwórz konsolę i wykonaj:
```javascript
fetch('/api/admin/create-superadmin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'm.nowak@makconsulting.pl',
    password: 'TwojeBezpieczneHaslo123!',
    name: 'Michał Nowak'
  })
})
.then(r => r.json())
.then(console.log)
```

### Metoda 3: Przez Supabase SQL Editor

1. Otwórz Supabase Dashboard → SQL Editor
2. Wykonaj następujące zapytanie (pamiętaj, że musisz najpierw zahashować hasło):

```sql
-- Użyj funkcji insert_user - musisz najpierw zahashować hasło
-- Hash możesz wygenerować przez API endpoint powyżej lub przez skrypt Node.js

SELECT insert_user(
  'm.nowak@makconsulting.pl',
  'ZAHASHOWANE_HASŁO', -- Zastąp prawdziwym hashem!
  'Michał Nowak',
  NULL,
  'SUPERADMIN'::"Role"
);
```

## Po utworzeniu konta:

1. **Zaloguj się** na `http://localhost:3000/auth/signin`
   - Email: `m.nowak@makconsulting.pl`
   - Password: (hasło które ustawiłeś)

2. **Zostaniesz przekierowany** do `/superadmin/dashboard`

3. **Zmień hasło** na bezpieczne (w przyszłości dodamy funkcję zmiany hasła)

## Struktura modułu Superadmin:

```
/src/app/superadmin/
  ├── layout.tsx          # Ochrona routów (tylko SUPERADMIN)
  ├── dashboard/
  │   └── page.tsx        # Dashboard z statystykami
  ├── users/              # (do utworzenia) Zarządzanie użytkownikami
  ├── clients/            # (do utworzenia) Zarządzanie klientami
  └── settings/           # (do utworzenia) Ustawienia systemu
```

## API Endpoints:

- `POST /api/admin/create-superadmin` - Utworzenie konta superadmin

## Uwagi bezpieczeństwa:

⚠️ **WAŻNE**: Endpoint `/api/admin/create-superadmin` nie jest obecnie zabezpieczony!  
⚠️ W produkcji dodaj autoryzację (np. wymagaj secret token lub autoryzacji przez innego superadmina)

## Następne kroki:

1. ✅ Utworzyć konto superadmin (użyj metody 1, 2 lub 3 powyżej - **zalecana metoda 1**)
2. ⏳ Dodać funkcję zarządzania użytkownikami (`/superadmin/users`)
3. ⏳ Dodać funkcję zarządzania klientami (`/superadmin/clients`)
4. ⏳ Dodać ustawienia systemu (`/superadmin/settings`)
5. ⏳ Zabezpieczyć endpoint tworzenia superadmina w produkcji

