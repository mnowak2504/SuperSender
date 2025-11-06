# MAK Consulting Supersender - MVP

System zarządzania magazynem i wysyłkami dla MAK Consulting.

## Funkcjonalności MVP

### Role użytkowników
- **Klient** - widzi wyłącznie własne dane
- **Magazyn** - widzi i edytuje wszystkie dostawy/zamówienia operacyjne
- **Biuro/Administrator** - pełny dostęp, konfiguracja cen/planów, płatności, transport

### Główne funkcje

#### Panel Klienta
- Dashboard z informacjami o kodzie klienta, opiekunie, planie, zajętości przestrzeni
- Zgłaszanie dostaw (formularz)
- Przegląd dostaw i zamówień na magazynie
- Wizard do zlecania wysyłki (wybór zamówień → adres → tryb transportu)
- Przegląd faktur i płatności (abonament/transport/operacje)

#### Panel Magazynu
- Lista oczekujących dostaw
- Formularz przyjęcia dostawy (liczba paczek, stan, uwagi, min. 2 zdjęcia)
- Lista zamówień do spakowania
- Wprowadzanie wagi i wymiarów po spakowaniu
- Zarządzanie wysyłkami (statusy: gotowe do załadunku → w trasie → dostarczone)

#### Panel Biura/Admin
- Zarządzanie klientami (tworzenie, aktywacja, nadawanie kodów MN-IE-001)
- Wycena transportu
- Generowanie faktur (3 typy)
- Konfiguracja planów abonamentowych

### Płatności
- Integracja z Revolut (stub - wymaga implementacji)
- Generowanie linków płatniczych
- Webhook potwierdzenia płatności

## Technologie

- **Framework**: Next.js 15 (App Router)
- **Baza danych**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Autentykacja**: NextAuth.js
- **Stylowanie**: Tailwind CSS
- **Języki**: TypeScript

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone <repo-url>
cd supersender
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj zmienne środowiskowe:
Skopiuj `.env.example` do `.env` i uzupełnij:
- `DATABASE_URL` - connection string do Supabase PostgreSQL
  Format: `postgresql://postgres:[PASSWORD]@db.ewqthhqjxxujpcmjtfme.supabase.co:5432/postgres`
- `NEXTAUTH_SECRET` - losowy sekret (np. wygeneruj przez `openssl rand -base64 32`)
- `NEXTAUTH_URL` - URL aplikacji (dla dev: `http://localhost:3000`)

4. Uruchom migracje Prisma:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Uruchom serwer deweloperski:
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Konfiguracja bazy danych

### Supabase Setup
1. Zaloguj się do Supabase Dashboard
2. Pobierz hasło bazy danych z Settings > Database
3. Użyj connection string w formacie:
```
postgresql://postgres:[YOUR-PASSWORD]@db.ewqthhqjxxujpcmjtfme.supabase.co:5432/postgres
```

### Struktura bazy danych
Schema Prisma zawiera wszystkie modele:
- User (z rolami)
- Client
- Plan
- DeliveryExpected
- WarehouseOrder
- ShipmentOrder
- Invoice
- Address
- Media
- ChangeLog

## Użycie

### Rejestracja
Domyślnie rejestracja tworzy użytkownika z rolą CLIENT. Admin musi:
1. Zaakceptować klienta
2. Ustawić kod klienta (format: MN-IE-001)
3. Przypisać plan abonamentowy

### Przepływ pracy

1. **Klient zgłasza dostawę** → status: EXPECTED
2. **Magazyn przyjmuje dostawę** → status: RECEIVED, tworzy WarehouseOrder
3. **Klient zleca wysyłkę** → wybiera zamówienia, adres, tryb transportu
4. **Magazyn pakuje** → wprowadza wymiary/wagę, status: READY_FOR_QUOTE
5. **Biuro wycenia** → proponuje cenę, klient akceptuje
6. **Generowanie faktury** → jeśli MAK transport, faktura przed załadunkiem
7. **Płatność** → przez Revolut link
8. **Załadunek** → status: READY_FOR_LOADING → IN_TRANSIT → DELIVERED

## TODO / Do implementacji

- [ ] Upload zdjęć do cloud storage (obecnie stub)
- [ ] Integracja z rzeczywistym API Revolut
- [ ] System powiadomień e-mail (obecnie stub)
- [ ] RLS (Row Level Security) w Supabase
- [ ] Implementacja pełnego i18n (obecnie podstawowe)
- [ ] Testy jednostkowe i E2E
- [ ] CI/CD pipeline

## Notatki techniczne

- **Języki**: EN dla klienta, PL dla magazynu/biura (podstawowa implementacja)
- **Mobile-friendly**: Magazyn zoptymalizowany pod upload zdjęć
- **Log zmian**: ChangeLog zapisuje wszystkie operacje magazynowe

## Licencja

Wewnętrzny projekt MAK Consulting.
