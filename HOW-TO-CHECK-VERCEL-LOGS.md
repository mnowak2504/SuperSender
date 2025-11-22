# Jak sprawdzić logi Vercel - Instrukcja krok po kroku

## Metoda 1: Logi z konkretnego deploymentu

1. **Zaloguj się do Vercel Dashboard**
   - Przejdź do: https://vercel.com
   - Zaloguj się kontem GitHub

2. **Wybierz projekt**
   - Kliknij na projekt "SuperSender" (lub nazwę Twojego projektu)

3. **Sprawdź Deployments**
   - Kliknij zakładkę **"Deployments"** u góry
   - Kliknij na **najnowszy deployment** (najwyżej na liście, powinien mieć status "Ready" lub "Building")
   - W sekcji **"Build Logs"** zobaczysz logi z builda
   - W sekcji **"Runtime Logs"** lub **"Function Logs"** zobaczysz logi z działania aplikacji

## Metoda 2: Logi w czasie rzeczywistym (Runtime Logs)

1. **W projekcie Vercel**
   - Kliknij zakładkę **"Logs"** w menu bocznym (lub przejdź do: `https://vercel.com/[twoj-username]/[nazwa-projektu]/logs`)

2. **Filtruj logi**
   - W polu wyszukiwania wpisz: `subscription/upgrade`
   - Lub wpisz: `[API /client/subscription/upgrade]` aby zobaczyć tylko logi z tego endpointu

3. **Sprawdź szczegóły**
   - Kliknij na konkretny log, aby zobaczyć szczegóły
   - Zobaczysz pełny stack trace i szczegóły błędu

## Metoda 3: Logi przez Vercel CLI (opcjonalnie)

Jeśli masz zainstalowany Vercel CLI:

```bash
# Zainstaluj Vercel CLI (jeśli nie masz)
npm i -g vercel

# Zaloguj się
vercel login

# Pobierz logi
vercel logs [nazwa-projektu] --follow
```

## Co szukać w logach:

1. **Czy endpoint jest wywoływany?**
   - Szukaj: `[API /client/subscription/upgrade] POST request received`
   - Jeśli tego nie widzisz, endpoint może nie być dostępny

2. **Czy jest błąd autoryzacji?**
   - Szukaj: `No session or user` lub `Unauthorized`
   - Oznacza to problem z sesją/autoryzacją

3. **Czy jest problem z klientem?**
   - Szukaj: `Client not found` lub `clientId is still null`
   - Oznacza to, że klient nie został znaleziony lub utworzony

4. **Czy jest błąd bazy danych?**
   - Szukaj: `Error creating Client` lub `Error fetching client`
   - Oznacza to problem z połączeniem do Supabase

## Najczęstsze problemy:

### Problem 1: Endpoint zwraca 404
**Możliwe przyczyny:**
- Endpoint nie został wdrożony (sprawdź czy deployment się powiódł)
- Błędna ścieżka w kodzie
- Problem z routingiem Next.js

**Rozwiązanie:**
- Sprawdź czy plik `src/app/api/client/subscription/upgrade/route.ts` istnieje
- Sprawdź czy deployment się powiódł w Vercel
- Sprawdź czy endpoint jest poprawnie eksportowany (`export async function POST`)

### Problem 2: "Client not found"
**Możliwe przyczyny:**
- Użytkownik nie ma `clientId` w sesji
- Klient nie został utworzony w bazie danych
- Problem z RLS (Row Level Security) w Supabase

**Rozwiązanie:**
- Sprawdź logi Vercel - powinny pokazać, czy klient został utworzony
- Sprawdź czy RLS jest wyłączone dla tabeli Client (uruchom migrację SQL)
- Sprawdź czy użytkownik ma poprawną sesję

### Problem 3: Błąd 500 (Internal Server Error)
**Możliwe przyczyny:**
- Problem z połączeniem do Supabase
- Błąd w kodzie endpointu
- Brakujące zmienne środowiskowe

**Rozwiązanie:**
- Sprawdź logi Vercel - pokażą szczegóły błędu
- Sprawdź czy wszystkie zmienne środowiskowe są ustawione w Vercel
- Sprawdź czy Supabase jest dostępne

## Szybki test:

1. **Sprawdź czy endpoint istnieje:**
   - Otwórz w przeglądarce: `https://www.supersender.eu/api/client/subscription/upgrade`
   - Powinieneś zobaczyć błąd 405 (Method Not Allowed) lub 401 (Unauthorized)
   - Jeśli widzisz 404, endpoint nie jest dostępny

2. **Sprawdź logi Vercel:**
   - Przejdź do Vercel Dashboard → Logs
   - Spróbuj wykonać zakup ponownie
   - Zobaczysz logi w czasie rzeczywistym

3. **Sprawdź Network tab w przeglądarce:**
   - Otwórz DevTools (F12) → Network
   - Spróbuj wykonać zakup
   - Kliknij na request do `/api/client/subscription/upgrade`
   - Zobaczysz szczegóły odpowiedzi (status, headers, body)

