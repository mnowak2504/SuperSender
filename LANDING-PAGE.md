# Landing Page - Wielojęzyczna strona główna

## ✅ Utworzona struktura:

### Pliki:
- `src/lib/i18n.ts` - System tłumaczeń (5 języków)
- `src/app/landing/[lang]/page.tsx` - Główna strona landing page
- `src/app/landing/[lang]/LandingPageContent.tsx` - Komponenty strony
- `src/app/landing/page.tsx` - Redirect do `/landing/en`

### Języki:
- 🇬🇧 Angielski (en) - `/landing/en`
- 🇩🇪 Niemiecki (de) - `/landing/de`
- 🇫🇷 Francuski (fr) - `/landing/fr`
- 🇮🇹 Włoski (it) - `/landing/it`
- 🇵🇱 Polski (pl) - `/landing/pl`

### Sekcje landing page:

1. **Hero Section**
   - Duży nagłówek z opisem
   - Przyciski CTA (Get Started / Learn More)
   - Gradient tła

2. **About Section**
   - Opis firmy MAK Consulting
   - 4 karty z cechami:
     - Secure Storage (Bezpieczne przechowywanie)
     - Fast Processing (Szybkie przetwarzanie)
     - Real-Time Tracking (Śledzenie w czasie rzeczywistym)
     - Expert Support (Ekspertowe wsparcie)

3. **Process Section**
   - 5 kroków procesu:
     1. Report Delivery (Zgłoś dostawę)
     2. Warehouse Receipt (Przyjęcie do magazynu)
     3. Storage & Management (Przechowywanie i zarządzanie)
     4. Packaging & Quote (Pakowanie i wycena)
     5. Shipping (Wysyłka)

4. **Pricing Section**
   - 3 plany cenowe:
     - Basic - €99/miesiąc
     - Professional - €249/miesiąc (Popular)
     - Enterprise - Custom pricing
   - Informacje o nadprzestrzeni i opłatach operacyjnych

5. **CTA Section**
   - Call-to-action do rejestracji
   - Gradient tła

6. **Footer**
   - Adres magazynu
   - Informacje kontaktowe
   - Copyright

### Funkcjonalności:

- ✅ Responsywny design (mobile-first)
- ✅ Przełącznik języków w nawigacji
- ✅ Płynne przejścia i animacje hover
- ✅ Linki do rejestracji i logowania
- ✅ Smooth scrolling do sekcji
- ✅ Mobile menu dla mniejszych ekranów

### Integracja z aplikacją:

- ✅ Strona główna (`/`) przekierowuje:
  - Zalogowani użytkownicy → ich dashboard
  - Niezalogowani → `/landing/en`
- ✅ Middleware pozwala na dostęp do `/landing/*` bez logowania
- ✅ Link "Back to homepage" na stronie logowania

### Dostępne URL-e:

- `/` - redirect do `/landing/en` (jeśli niezalogowany)
- `/landing` - redirect do `/landing/en`
- `/landing/en` - Landing page po angielsku
- `/landing/de` - Landing page po niemiecku
- `/landing/fr` - Landing page po francusku
- `/landing/it` - Landing page po włosku
- `/landing/pl` - Landing page po polsku

### Design:

- Nowoczesny, czysty design
- Kolory: Niebieski (#2563eb) jako główny
- Responsywny grid layout
- Cards z cieniami i efektami hover
- Gradient backgrounds dla sekcji hero i CTA

---

**Gotowe do użycia!** Landing page jest w pełni funkcjonalna i gotowa do testów.

