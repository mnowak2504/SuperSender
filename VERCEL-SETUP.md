# Wdrożenie na Vercel - Krok po kroku

## Krok 1: Utwórz konto Vercel

1. Przejdź do: https://vercel.com
2. Kliknij **"Sign Up"**
3. Wybierz **"Continue with GitHub"**
4. Zaloguj się kontem `mnowak2504` (lub kontem, które ma dostęp do repozytorium)

## Krok 2: Zaimportuj projekt

1. Po zalogowaniu kliknij **"Add New Project"** (lub **"Import Project"**)
2. Znajdź repozytorium **"SuperSender"** (lub **"mnowak2504/SuperSender"**)
3. Kliknij **"Import"**

## Krok 3: Konfiguracja projektu

Vercel automatycznie wykryje, że to projekt Next.js. Sprawdź ustawienia:

- **Framework Preset**: Next.js (powinno być automatycznie)
- **Root Directory**: `./` (domyślnie)
- **Build Command**: `npm run build` (domyślnie)
- **Output Directory**: `.next` (domyślnie)
- **Install Command**: `npm install` (domyślnie)

**Kliknij "Deploy"** - pierwszy build może się nie powieść (brak zmiennych środowiskowych), ale to normalne.

## Krok 4: Dodaj zmienne środowiskowe

Po pierwszym deployu (nawet jeśli się nie powiódł):

1. Przejdź do **Project Settings** → **Environment Variables**
2. Dodaj następujące zmienne:

### Wymagane zmienne:

```
DATABASE_URL
```
Wartość: Twój connection string z Supabase (np. `postgresql://postgres:[password]@[host]:5432/postgres`)

```
NEXT_PUBLIC_SUPABASE_URL
```
Wartość: URL Twojego projektu Supabase (np. `https://xxxxx.supabase.co`)

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Wartość: Anon key z Supabase Dashboard → Settings → API

```
NEXTAUTH_SECRET
```
Wartość: Wygeneruj losowy string:
```bash
openssl rand -base64 32
```
Lub użyj: https://generate-secret.vercel.app/32

```
NEXTAUTH_URL
```
Wartość: URL Twojego projektu Vercel (np. `https://supersender.vercel.app`)
- **UWAGA**: Po pierwszym deployu Vercel da Ci URL - użyj tego URL tutaj

### Opcjonalne zmienne:

```
RESEND_API_KEY
```
Jeśli używasz Resend do emaili

```
NEXT_PUBLIC_WAREHOUSE_PHONE
```
Wartość: `+48 534 759 809` (lub inny numer)

```
REVOLUT_API_KEY
```
Jeśli używasz Revolut do płatności

```
REVOLUT_WEBHOOK_SECRET
```
Jeśli używasz Revolut webhooks

## Krok 5: Redeploy

1. Po dodaniu wszystkich zmiennych środowiskowych
2. Przejdź do **Deployments**
3. Kliknij **"..."** przy ostatnim deploymencie
4. Wybierz **"Redeploy"**
5. Lub zrób nowy commit i push - Vercel automatycznie zredeployuje

## Krok 6: Konfiguracja Supabase

1. Przejdź do Supabase Dashboard → **Settings** → **API**
2. W sekcji **"Redirect URLs"** dodaj:
   ```
   https://twoj-projekt.vercel.app/api/auth/callback/nextauth
   ```
3. Zapisz zmiany

## Krok 7: Sprawdź deployment

1. Po udanym deployu otrzymasz URL (np. `https://supersender.vercel.app`)
2. Otwórz URL w przeglądarce
3. Sprawdź czy strona się ładuje
4. Przetestuj logowanie/rejestrację

## Automatyczne wdrożenia

Po skonfigurowaniu:
- **Każdy push do `main`** → automatyczny deploy na produkcję
- **Pull Requesty** → automatyczne preview deployments
- **Wszystko dzieje się automatycznie!**

## Troubleshooting

### Build fails
- Sprawdź logi w Vercel Dashboard → Deployments → [deployment] → Build Logs
- Upewnij się, że wszystkie zmienne środowiskowe są ustawione
- Sprawdź czy `package.json` ma wszystkie wymagane dependencies

### Database connection errors
- Sprawdź czy `DATABASE_URL` jest poprawny
- Sprawdź czy Supabase pozwala na połączenia z zewnątrz
- Sprawdź czy IP nie jest zablokowane w Supabase

### Authentication not working
- Sprawdź czy `NEXTAUTH_URL` jest poprawny
- Sprawdź czy redirect URL jest dodany w Supabase
- Sprawdź czy `NEXTAUTH_SECRET` jest ustawiony

## Custom Domain (opcjonalnie)

1. W Vercel → Project Settings → Domains
2. Dodaj swoją domenę
3. Zaktualizuj DNS zgodnie z instrukcjami
4. Zaktualizuj `NEXTAUTH_URL` na nową domenę

