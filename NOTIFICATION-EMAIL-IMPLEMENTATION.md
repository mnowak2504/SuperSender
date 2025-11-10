# Notification Email Implementation Report

## Current Status

### ✅ What's Implemented

1. **Notification Preferences UI** (`src/components/settings/NotificationsTab.tsx`)
   - Users can view and toggle 6 notification types
   - UI is fully functional

2. **Database Schema** (`prisma/schema.prisma`)
   - `UserSettings` model added to store notification preferences
   - Migration file created: `prisma/migrations/add-user-settings.sql`

3. **API Endpoints** (`src/app/api/client/notifications/route.ts`)
   - GET: Fetches user preferences from database (or returns defaults)
   - PUT: Saves preferences to database
   - **NOW FULLY FUNCTIONAL** - preferences are persisted

4. **Email Utility Library** (`src/lib/email.ts`)
   - `sendEmail()` - Sends email via Resend API
   - `getUserNotificationPreferences()` - Gets user preferences
   - `getClientNotificationPreferences()` - Gets client preferences
   - `sendNotificationEmail()` - Sends email only if preference enabled
   - `sendClientNotificationEmail()` - Sends email for client if preference enabled

### ✅ Fully Implemented

1. **Email Sending Integration** - ALL TYPES IMPLEMENTED
   - ✅ Shipment Ready (via Edge Function with preference checking)
   - ✅ Delivery Received (when warehouse receives delivery)
   - ✅ Invoice Issued (when invoice is created)
   - ✅ Payment Reminder (via admin check endpoint)
   - ✅ Over-Storage Alert (via admin check endpoint)
   - ✅ Newsletter (functions ready, manual sending by admin)

2. **Preference Checking**
   - ✅ All email sending points check preferences before sending
   - ✅ Edge Function for shipment-ready emails checks preferences
   - ✅ All notification types respect user preferences

## Email Service Setup

### Resend API (Recommended)

1. Sign up at [Resend](https://resend.com)
2. Get your API key from dashboard
3. Add to `.env.local`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### How Emails Are Sent

- **NOT via Supabase directly** - Supabase is used for:
  - Storing notification preferences
  - Database triggers/events
  - Data storage
  
- **Via Resend API** - Actual email delivery is handled by:
  - Resend API (third-party email service)
  - Called from Next.js API routes or Supabase Edge Functions
  - Configured via `RESEND_API_KEY` environment variable

## Implementation Details

### Notification Types

1. **Delivery Received** (`deliveryReceived`)
   - Trigger: When warehouse receives a delivery
   - Location: `src/app/api/warehouse/receive-delivery/route.ts`
   - Status: ⚠️ **NOT YET IMPLEMENTED**

2. **Shipment Ready for Approval** (`shipmentReady`)
   - Trigger: When shipment status changes to `AWAITING_ACCEPTANCE`
   - Location: `supabase/functions/send-shipment-ready-email/index.ts`
   - Status: ✅ **IMPLEMENTED** (but doesn't check preferences)

3. **Invoice Issued** (`invoiceIssued`)
   - Trigger: When new invoice is created
   - Location: `src/app/api/client/subscription/upgrade/route.ts` and other invoice creation points
   - Status: ⚠️ **NOT YET IMPLEMENTED**

4. **Payment Reminder** (`paymentReminder`)
   - Trigger: When invoice is due or overdue
   - Location: `src/app/api/admin/notifications/check/route.ts`
   - Status: ✅ **IMPLEMENTED** (via admin check endpoint)

5. **Over-Storage Alert** (`overStorageAlert`)
   - Trigger: When client exceeds storage limit
   - Location: `src/app/api/admin/notifications/check/route.ts`
   - Status: ✅ **IMPLEMENTED** (via admin check endpoint)

6. **Newsletter & System Updates** (`newsletter`)
   - Trigger: Manual/admin-initiated
   - Status: ✅ **FUNCTIONS READY** (can be called manually by admin using `sendEmail()`)

## Implementation Complete ✅

1. ✅ **DONE**: Create database schema for preferences
2. ✅ **DONE**: Update API to save/load preferences
3. ✅ **DONE**: Create email utility library
4. ✅ **DONE**: Update shipment-ready email to check preferences
5. ✅ **DONE**: Add email sending for delivery received
6. ✅ **DONE**: Add email sending for invoice issued
7. ✅ **DONE**: Add email sending for payment reminders
8. ✅ **DONE**: Add email sending for over-storage alerts

## Implementation Details

### Email Functions Created

1. **`sendDeliveryReceivedEmail()`** - Called in `src/app/api/warehouse/receive-delivery/route.ts`
   - Triggered when delivery status changes to RECEIVED
   - Includes delivery number, supplier name, and photo count

2. **`sendInvoiceIssuedEmail()`** - Called in `src/app/api/client/subscription/upgrade/route.ts`
   - Triggered when invoice is created
   - Includes invoice details and payment link (if available)

3. **`sendPaymentReminderEmail()`** - Called via `src/app/api/admin/notifications/check/route.ts`
   - Checks for invoices due in 3 days or overdue
   - Can be triggered by cron job or manually by admin

4. **`sendOverStorageAlertEmail()`** - Called via `src/app/api/admin/notifications/check/route.ts`
   - Checks for clients exceeding storage limit
   - Can be triggered by cron job or manually by admin

### Admin Check Endpoint

**`POST /api/admin/notifications/check`**
- Checks and sends payment reminders for invoices due in 3 days or overdue
- Checks and sends over-storage alerts for clients exceeding limits
- Returns summary of sent/skipped/errors
- Can be called by:
  - Cron job (Vercel Cron, GitHub Actions, etc.)
  - Manual admin trigger
  - Scheduled task

### Setting Up Cron Job

To automatically check and send reminders/alerts, set up a cron job:

**Vercel Cron:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/admin/notifications/check",
    "schedule": "0 9 * * *"  // Daily at 9 AM
  }]
}
```

**GitHub Actions:**
```yaml
# .github/workflows/notifications.yml
name: Check Notifications
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check notifications
        run: |
          curl -X POST https://your-domain.com/api/admin/notifications/check \
            -H "Authorization: Bearer YOUR_SECRET_TOKEN"
```

## Testing

To test notification preferences:

1. Go to Settings → Notification Preferences
2. Toggle preferences on/off
3. Click "Save Preferences"
4. Check database: `UserSettings` table should have your preferences
5. When emails are sent, they should respect your preferences

## Database Migration

Run the migration in Supabase:

```sql
-- File: prisma/migrations/add-user-settings.sql
-- Execute in Supabase SQL Editor
```

