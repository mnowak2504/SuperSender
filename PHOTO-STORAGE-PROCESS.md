# Proces przechowywania zdjęć dostaw

## Przegląd

Zdjęcia dostaw są przechowywane przez **2 miesiące** od momentu dostarczenia przesyłki do klienta. Po tym okresie zdjęcia są automatycznie usuwane, chyba że:
- Zostały zgłoszone reklamacje/zapytania dotyczące danej przesyłki
- Superadmin ręcznie przedłużył okres przechowywania

## Workflow

### 1. Przyjęcie dostawy (Warehouse)

**Gdzie:** `/warehouse/receive-delivery/[id]`

**Proces:**
- Magazyn przyjmuje dostawę i wgrywa zdjęcia (minimum 2 zdjęcia)
- Zdjęcia są zapisywane do:
  - **Supabase Storage**: `delivery-photos/deliveries/{deliveryId}/{timestamp}-{index}.{ext}`
  - **Tabela Media**: Rekordy z `kind: 'delivery_received'` i `deliveryExpectedId`

**Dostępność:**
- Zdjęcia są natychmiast widoczne dla:
  - Magazynu (po wgraniu)
  - Klienta (na stronie szczegółów dostawy)

### 2. Wyświetlanie zdjęć

**Dla klienta:**
- Strona: `/client/deliveries/[id]`
- Sekcja "Delivery Photos" wyświetla wszystkie zdjęcia związane z dostawą
- Zdjęcia są pobierane z tabeli `Media` gdzie `deliveryExpectedId` = ID dostawy

**Dla magazynu:**
- Po wgraniu zdjęć w formularzu przyjęcia, zdjęcia są widoczne w podglądzie
- Zdjęcia są również dostępne na stronie szczegółów dostawy

### 3. Automatyczne czyszczenie

**Endpoint:** `POST /api/superadmin/data-management/cleanup-old-photos`

**Logika:**
1. Znajduje wszystkie przesyłki ze statusem `DELIVERED` starsze niż 2 miesiące
2. Dla każdej przesyłki:
   - Znajduje powiązane zamówienia magazynowe
   - Znajduje powiązane dostawy
   - Znajduje zdjęcia związane z tymi dostawami i zamówieniami
3. Sprawdza, czy od momentu dostarczenia minęło 2+ miesiące
4. Usuwa:
   - Pliki z Supabase Storage
   - Rekordy z tabeli `Media`

**Uruchomienie:**
- **Ręcznie**: Panel superadmin → Zarządzanie danymi → "Wyczyść stare zdjęcia"
- **Automatycznie**: Można skonfigurować cron job (Vercel Cron lub Supabase Edge Function)

### 4. Ręczne zarządzanie (Superadmin)

**Panel:** `/superadmin/data-management`

**Funkcje:**
- Wyświetlanie statystyk danych (dostawy, zamówienia, zdjęcia, faktury)
- Usuwanie danych testowych (wszystkie dane z "test" w nazwie/emailu)
- Usuwanie starych danych według typu i daty
- Ręczne uruchomienie czyszczenia starych zdjęć

## Struktura danych

### Tabela Media

```sql
CREATE TABLE "Media" (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'delivery_received', 'before_wrap', 'after_wrap'
  deliveryExpectedId TEXT REFERENCES "DeliveryExpected"(id),
  warehouseOrderBeforeId TEXT REFERENCES "WarehouseOrder"(id),
  warehouseOrderAfterId TEXT REFERENCES "WarehouseOrder"(id),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Supabase Storage

**Bucket:** `delivery-photos`
- **Public**: Tak (publiczne odczyty)
- **Struktura:** `deliveries/{deliveryId}/{timestamp}-{index}.{ext}`

## Bezpieczeństwo

- Zdjęcia są publicznie dostępne (bucket jest publiczny)
- W przyszłości można zmienić na private bucket z podpisanymi URL-ami
- Superadmin może ręcznie usunąć zdjęcia w dowolnym momencie

## Przyszłe ulepszenia

1. **Automatyczne czyszczenie przez cron:**
   - Vercel Cron: Codziennie o 2:00 AM
   - Lub Supabase Edge Function z harmonogramem

2. **Przedłużenie okresu przechowywania:**
   - Jeśli klient zgłosi reklamację, automatyczne przedłużenie o kolejny miesiąc
   - Superadmin może ręcznie oznaczyć przesyłkę jako "wymaga dłuższego przechowywania"

3. **Kompresja zdjęć:**
   - Automatyczna kompresja przy wgrywaniu (zmniejszenie rozmiaru plików)

4. **Weryfikacja dostępności:**
   - Sprawdzanie czy pliki faktycznie istnieją w storage przed wyświetleniem
   - Fallback do placeholder jeśli plik nie istnieje

