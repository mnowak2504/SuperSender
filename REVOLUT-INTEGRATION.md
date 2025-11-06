# Revolut Payment Integration

## Overview

The system integrates with Revolut Business API for payment processing. This allows clients to pay invoices (subscriptions, transport, operations) directly through Revolut payment links.

## Setup

### 1. Create Revolut Business Account

1. Sign up for Revolut Business: https://www.revolut.com/business
2. Complete business verification
3. Get API access (may require business plan upgrade)

### 2. Get API Credentials

1. Go to Revolut Business Dashboard
2. Navigate to Developer / API section
3. Create a new API key
4. Copy the API key (starts with `sk_` or similar)

### 3. Configure Environment Variables

Add to your `.env` file:

```env
REVOLUT_API_KEY=your_revolut_api_key_here
REVOLUT_WEBHOOK_SECRET=your_webhook_secret_here  # Optional, for webhook verification
```

### 4. Configure Webhook URL

In Revolut Business Dashboard:
1. Go to Webhooks section
2. Add webhook URL: `https://yourdomain.com/api/payments/revolut/webhook`
3. Select events: `payment.completed`, `payment.failed`
4. Copy webhook secret (if provided)

## How It Works

### Creating Payment Links

When an invoice is created, the system can generate a Revolut payment link:

```typescript
POST /api/payments/revolut/create-link
{
  "invoiceId": "invoice_id_here"
}
```

Response:
```json
{
  "link": "https://pay.revolut.com/...",
  "isMock": false
}
```

### Payment Flow

1. **Invoice Created** → System creates invoice with status `ISSUED`
2. **Payment Link Generated** → Client clicks "Pay Now" → Creates Revolut payment link
3. **Client Pays** → Redirected to Revolut payment page
4. **Webhook Received** → Revolut sends webhook on payment completion
5. **Invoice Updated** → Status changes to `PAID`, shipment status updated if transport invoice

### Webhook Events

The webhook handler processes:
- `payment.completed` → Updates invoice to `PAID`, unlocks shipment for loading
- `payment.failed` → Logs failure (can send notification to client)

## Current Implementation

### Features Implemented

✅ Payment link creation via Revolut API
✅ Webhook handler for payment status updates
✅ Automatic invoice status update on payment
✅ Automatic shipment status update (READY_FOR_LOADING) for transport invoices
✅ Fallback to mock links if API key not configured (for development)

### API Endpoints

- `POST /api/payments/revolut/create-link` - Create payment link
- `POST /api/payments/revolut/webhook` - Handle webhook events

### Database Fields

- `Invoice.revolutLink` - Payment link URL
- `Invoice.revolutPaymentId` - Revolut payment ID
- `Invoice.paymentWebhookReceivedAt` - Timestamp of webhook

## Testing

### Without Revolut Account

The system will use mock payment links if `REVOLUT_API_KEY` is not set. This allows development without actual Revolut integration.

### With Revolut Account

1. Use Revolut Sandbox/Test environment for testing
2. Test payment links are generated correctly
3. Test webhook receives payment events
4. Verify invoice status updates automatically

## Production Checklist

- [ ] Add `REVOLUT_API_KEY` to production environment
- [ ] Configure webhook URL in Revolut dashboard
- [ ] Add `REVOLUT_WEBHOOK_SECRET` for signature verification
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring for webhook failures
- [ ] Configure email notifications for payment confirmations

## Revolut API Documentation

- Official API Docs: https://developer.revolut.com/
- Payment Links: https://developer.revolut.com/docs/api-reference/payment-links
- Webhooks: https://developer.revolut.com/docs/api-reference/webhooks

## Security Notes

- Never commit API keys to version control
- Use environment variables for all secrets
- Verify webhook signatures in production
- Use HTTPS for all webhook endpoints
- Implement rate limiting on webhook endpoint

