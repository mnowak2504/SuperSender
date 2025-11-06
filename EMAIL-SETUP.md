# Email Notification Setup

## Overview

The system sends email notifications to clients when their shipment is ready for transport selection (after warehouse packs all orders).

## Setup Options

### Option 1: Resend (Recommended)

1. Sign up at [Resend](https://resend.com)
2. Get your API key from the dashboard
3. Add to Supabase Edge Function secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```

### Option 2: Supabase Database Webhook

1. Go to Supabase Dashboard → Database → Webhooks
2. Create new webhook:
   - Table: `ShipmentOrder`
   - Events: `UPDATE`
   - HTTP Request URL: `https://your-project.supabase.co/functions/v1/send-shipment-ready-email`
   - HTTP Request Method: `POST`
   - HTTP Request Headers: `Authorization: Bearer YOUR_ANON_KEY`

### Option 3: Supabase Edge Function (Manual Call)

The Edge Function can be called directly from the API after packing:

```typescript
await fetch(`${SUPABASE_URL}/functions/v1/send-shipment-ready-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shipmentId,
    clientEmail,
    clientName,
    calculatedPrice,
  }),
})
```

## Current Implementation

- **Edge Function**: `supabase/functions/send-shipment-ready-email/index.ts`
- **Trigger**: Database trigger on `ShipmentOrder` status change to `AWAITING_ACCEPTANCE`
- **Fallback**: Logs to console if email service not configured

## Testing

1. Create a shipment request
2. Pack all orders in warehouse
3. System should send email (or log if not configured)
4. Check client email inbox

## Email Template

The email includes:
- Shipment ID
- Calculated transport price
- Link to transport choice page
- Three options: Accept, Request Custom Quote, Own Transport

