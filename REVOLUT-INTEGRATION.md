# Revolut Pay Integration Guide

## Wymagania do podłączenia aplikacji z płatnościami Revolut

### 1. Konto Revolut Business
- **Wymagane**: Konto Revolut Business (plany: Grow, Scale lub Enterprise)
- **Dostęp do API**: Właściciel konta musi włączyć dostęp do API w sekcji Ustawienia

### 2. API Credentials
Potrzebne będą następujące dane:
- **API Key** (Secret Key) - do autoryzacji żądań
- **Webhook Secret** - do weryfikacji webhooków (HMAC)
- **Merchant ID** - identyfikator konta merchant

### 3. Revolut Pay API Endpoints

#### Tworzenie płatności (Payment Link)
```
POST https://b2b.revolut.com/api/1.0/orders
```

**Headers:**
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 10000,  // w najmniejszych jednostkach (100.00 EUR = 10000)
  "currency": "EUR",
  "description": "Subscription payment",
  "customer_email": "customer@example.com",
  "metadata": {
    "client_id": "client-uuid",
    "invoice_id": "invoice-uuid",
    "type": "subscription"
  }
}
```

**Response:**
```json
{
  "id": "order-id",
  "public_id": "public-order-id",
  "checkout_url": "https://pay.revolut.com/checkout/...",
  "state": "PENDING"
}
```

### 4. Webhook Configuration

#### Endpoint URL
```
POST https://your-domain.com/api/webhooks/revolut
```

#### Webhook Events do obsługi:
- `ORDER_COMPLETED` - płatność zakończona pomyślnie
- `ORDER_PAYMENT_CAPTURED` - płatność przechwycona
- `ORDER_PAYMENT_DECLINED` - płatność odrzucona
- `ORDER_CANCELLED` - zamówienie anulowane

#### Webhook Verification (HMAC)
Revolut wysyła nagłówek `Revolut-Signature` z HMAC-SHA256 podpisem.

**Przykład weryfikacji:**
```typescript
import crypto from 'crypto'

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const calculatedSignature = hmac.digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  )
}
```

### 5. Database Schema Updates

Potrzebne pola w tabeli `Invoice`:
```sql
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "revolutOrderId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "revolutPublicId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "revolutCheckoutUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "revolutState" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "providerCustomerId" TEXT;
```

Potrzebne pola w tabeli `Client`:
```sql
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "revolutCustomerId" TEXT;
```

### 6. Environment Variables

Dodaj do `.env`:
```env
REVOLUT_API_KEY=your_api_key_here
REVOLUT_WEBHOOK_SECRET=your_webhook_secret_here
REVOLUT_MERCHANT_ID=your_merchant_id_here
REVOLUT_API_URL=https://b2b.revolut.com/api/1.0
REVOLUT_ENVIRONMENT=sandbox  # sandbox or production
```

### 7. Implementation Steps

1. **Create Payment Link Endpoint**
   - `/api/client/payment/create-link`
   - Tworzy Revolut Pay link dla faktury/subskrypcji
   - Zwraca `checkout_url` do przekierowania użytkownika

2. **Webhook Handler**
   - `/api/webhooks/revolut`
   - Weryfikuje HMAC signature
   - Aktualizuje status faktury/subskrypcji
   - Idempotency: sprawdza czy webhook już został przetworzony

3. **Payment Status Check**
   - Polling endpoint do sprawdzania statusu płatności
   - Fallback jeśli webhook nie dotrze

4. **Customer Management**
   - Zapisz `revolutCustomerId` dla reuse
   - Użyj tego samego customer ID dla kolejnych płatności

### 8. Error Handling

- **Network errors**: Retry z exponential backoff
- **Invalid signature**: Log i reject
- **Duplicate webhook**: Idempotency check
- **Payment declined**: Notify user, allow retry

### 9. Testing

- **Sandbox environment**: Użyj testowych kart
- **Test cards**: 
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
- **Webhook testing**: Użyj ngrok lub podobnego narzędzia

### 10. Security Best Practices

- ✅ Nigdy nie loguj pełnych API keys
- ✅ Używaj HTTPS dla wszystkich webhooków
- ✅ Weryfikuj HMAC signature dla każdego webhooka
- ✅ Implementuj idempotency keys
- ✅ Rate limiting dla API calls
- ✅ Store secrets w environment variables, nie w kodzie

### 11. Documentation Links

- [Revolut Business API Docs](https://developer.revolut.com/)
- [Revolut Pay Integration Guide](https://developer.revolut.com/docs/accept-payments)
- [Webhook Documentation](https://developer.revolut.com/docs/webhooks)

### 12. Przykładowy Flow

1. Klient wybiera plan w `/client/settings?tab=billing`
2. System tworzy Invoice w bazie danych
3. System wywołuje Revolut API, tworzy order
4. System zapisuje `revolutOrderId` i `checkout_url` w Invoice
5. Klient jest przekierowany do `checkout_url`
6. Klient płaci w Revolut
7. Revolut wysyła webhook `ORDER_COMPLETED`
8. System weryfikuje webhook i aktualizuje Invoice status na `PAID`
9. System aktywuje subskrypcję klienta
