# Implementacja Workflow - MAK Consulting Supersender

## Analiza wymagań vs. obecny stan

### ✅ Co już jest zaimplementowane:
1. Podstawowe modele danych
2. Statusy enumów
3. Rejestracja i logowanie
4. Zgłaszanie dostaw przez klienta
5. Dashboard klienta

### ❌ Co wymaga aktualizacji/implementacji:

#### 1. Rozszerzenie schematu bazy danych:

**DeliveryExpected:**
- ✅ clientReference (już dodane)
- ❌ quantity - liczba paczek/sztuk
- ❌ condition - stan opakowań (OK/DAMAGED)
- ❌ notes - uwagi magazynu
- ❌ warehouseLocation - lokalizacja magazynowa (np. A3-07)
- ❌ receivedAt - data przyjęcia
- ❌ receivedBy - kto przyjął (User.id)

**WarehouseOrder:**
- ❌ warehouseLocation - lokalizacja
- ❌ storageDays - dni składowania
- ❌ notes - uwagi
- ❌ receivedAt - data przyjęcia
- ❌ packedAt - data spakowania

**ShipmentOrder:**
- ❌ loadingSlotBooked - czy zarezerwowany slot
- ❌ loadingSlotFrom - okno załadunku od
- ❌ loadingSlotTo - okno załadunku do
- ❌ paymentConfirmedAt - potwierdzenie płatności Revolut
- ❌ quotedAt - data wyceny
- ❌ quotedBy - kto wycenił

**Client:**
- ❌ creditHold - blokada kredytowa
- ❌ storageOvercharge - nadmagazyn naliczony
- ❌ deliveriesThisMonth - dostawy w bieżącym miesiącu
- ❌ lastInvoiceDate - ostatnia faktura abonamentowa

**Invoice:**
- ✅ revolutLink (już jest)
- ❌ revolutPaymentId - ID płatności
- ❌ paymentWebhookReceivedAt - data webhooka
- ❌ invoiceNumber - numer faktury
- ❌ periodStart/periodEnd - dla abonamentów

**Nowe statusy:**
- DeliveryExpectedStatus: DAMAGED (uszkodzone)
- WarehouseOrderStatus: PACKED (spakowane)

#### 2. Nowe funkcjonalności do zaimplementowania:

**Moduł Magazyn (Warehouse):**
- Dashboard z listą oczekiwanych dostaw
- Formularz przyjęcia dostawy (zdjęcia, lokalizacja, stan)
- Lista zamówień na magazynie
- Formularz pakowania (zdjęcia przed/po, wymiary, waga)
- Zmiana statusów (AT_WAREHOUSE → TO_PACK → PACKED → READY_FOR_QUOTE)
- Rezerwacja slotów załadunkowych (pn-pt 8:00-16:00)

**Moduł Biuro (Admin):**
- Dashboard z zleceniami do wyceny
- Formularz wyceny transportu
- Planowanie wysyłek
- Generowanie faktur
- Zarządzanie klientami

**Moduł Klient (rozbudowa):**
- Lista pozycji na magazynie do wyboru
- Tworzenie zlecenia wysyłki (checkboxy wyboru)
- Zarządzanie adresami dostaw
- Akceptacja/odrzucenie wyceny
- Płatność przez Revolut
- Podgląd faktur

**Automatyzacje:**
- Naliczanie nadprzestrzeni (>100% planu)
- Naliczanie nadmagazynu (po 30 dniach, co tydzień)
- Generowanie faktur abonamentowych (1. dnia miesiąca)
- Generowanie faktur operacyjnych (ostatni dzień miesiąca)
- Credit hold (blokada przy braku płatności abonamentu)

**Integracje:**
- Revolut payment links
- Revolut webhook handler
- Email notifications (stub na razie)

**Powiadomienia:**
- "Dostawa przyjęta"
- "Wycena gotowa"
- "Wymagana płatność"
- "Płatność potwierdzona"
- "Przekroczono limit przestrzeni"
- "Faktura wystawiona"

---

## Plan implementacji:

### Faza 1: Aktualizacja schematu
1. SQL migration z nowymi polami
2. Aktualizacja TypeScript types

### Faza 2: Moduł Magazyn
3. Dashboard warehouse
4. Przyjęcie dostawy
5. Pakowanie zamówień

### Faza 3: Moduł Biuro
6. Dashboard admin
7. Wycena transportu
8. Generowanie faktur

### Faza 4: Rozbudowa Klienta
9. Zlecenie wysyłki
10. Akceptacja wyceny
11. Płatność Revolut

### Faza 5: Automatyzacje
12. Naliczanie nadprzestrzeni
13. Naliczanie nadmagazynu
14. Automatyczne faktury

### Faza 6: Integracje
15. Revolut webhook
16. Powiadomienia email (stub)

