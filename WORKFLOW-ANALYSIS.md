# Analiza Workflow - MAK Consulting Supersender

## Obecny stan aplikacji

### Utworzone modele danych:

1. **User** - Użytkownicy (CLIENT, WAREHOUSE, ADMIN, SUPERADMIN)
2. **Client** - Klienci
3. **Plan** - Plany subskrypcyjne
4. **DeliveryExpected** - Oczekiwane dostawy (EXPECTED, RECEIVED, REJECTED)
5. **WarehouseOrder** - Zamówienia magazynowe (AT_WAREHOUSE, TO_PACK, READY_FOR_QUOTE, READY_TO_SHIP, SHIPPED, DELIVERED)
6. **ShipmentOrder** - Zamówienia wysyłkowe (REQUESTED, QUOTED, AWAITING_ACCEPTANCE, AWAITING_PAYMENT, READY_FOR_LOADING, IN_TRANSIT, DELIVERED)
7. **ShipmentItem** - Pozycje w wysyłce (łączy WarehouseOrder z ShipmentOrder)
8. **Invoice** - Faktury (SUBSCRIPTION, TRANSPORT, OPERATIONS)
9. **Address** - Adresy dostaw
10. **Media** - Zdjęcia/pliki
11. **ChangeLog** - Historia zmian

### Obecne statusy/enumy:

#### DeliveryExpectedStatus:
- EXPECTED - Oczekiwana
- RECEIVED - Otrzymana
- REJECTED - Odrzucona

#### WarehouseOrderStatus:
- AT_WAREHOUSE - W magazynie
- TO_PACK - Do pakowania
- READY_FOR_QUOTE - Gotowe do wyceny
- READY_TO_SHIP - Gotowe do wysyłki
- SHIPPED - Wysłane
- DELIVERED - Dostarczone

#### ShipmentStatus:
- REQUESTED - Zgłoszone
- QUOTED - Wycenione
- AWAITING_ACCEPTANCE - Oczekuje na akceptację
- AWAITING_PAYMENT - Oczekuje na płatność
- READY_FOR_LOADING - Gotowe do załadunku
- IN_TRANSIT - W transporcie
- DELIVERED - Dostarczone

#### InvoiceType:
- SUBSCRIPTION - Abonament
- TRANSPORT - Transport
- OPERATIONS - Operacje

#### InvoiceStatus:
- ISSUED - Wystawiona
- PAID - Opłacona
- OVERDUE - Przeterminowana

### Obecnie zaimplementowane funkcjonalności:

✅ Rejestracja i logowanie użytkowników
✅ Dashboard dla klienta
✅ Zgłaszanie oczekiwanych dostaw (Report Delivery)
✅ Lista dostaw klienta
✅ Moduł Superadmin z dashboardem
✅ Automatyczne tworzenie klienta przy pierwszej dostawie

### Brakujące funkcjonalności:

❌ Panel magazynu (Warehouse)
❌ Panel admina
❌ Zarządzanie zamówieniami magazynowymi
❌ Przetwarzanie dostaw (EXPECTED → RECEIVED → WarehouseOrder)
❌ Pakowanie i wycena (TO_PACK → READY_FOR_QUOTE)
❌ Tworzenie zamówień wysyłkowych
❌ Akceptacja i płatność za wysyłki
❌ Generowanie faktur
❌ Integracja z Revolut
❌ Zarządzanie adresami dostaw
❌ Upload zdjęć

---

## OPISZ SWOJE WORKFLOW TUTAJ:

Proszę opisz krok po kroku, jak powinien działać proces biznesowy, np.:

1. Klient zgłasza oczekiwaną dostawę → ...
2. Magazyn otrzymuje powiadomienie → ...
3. Dostawa przyjeżdża do magazynu → ...
4. Magazyn potwierdza otrzymanie → ...
5. Magazyn pakuje → ...
6. Magazyn mierzy/waży → ...
7. System generuje wycenę → ...
8. Klient akceptuje wycenę → ...
9. Klient płaci → ...
10. Magazyn przygotowuje do wysyłki → ...
11. Wysyłka → ...
12. Dostarczenie → ...
13. Faktura → ...

---

## Po otrzymaniu opisu workflow:

1. Przeanalizuję obecny stan
2. Zidentyfikuję brakujące kroki/statusy
3. Zaproponuję zmiany w schemacie (jeśli potrzebne)
4. Zaimplementuję brakujące funkcjonalności
5. Utworzę interfejsy dla wszystkich ról

