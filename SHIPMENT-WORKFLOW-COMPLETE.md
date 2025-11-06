# ✅ Shipment Workflow - Complete Implementation

## Overview

The system now has a complete workflow where:
1. Client requests shipment → Orders get status `BEING_PACKED`
2. Warehouse packs orders → Enters dimensions and weight
3. System calculates transport price automatically
4. Client receives email notification
5. Client chooses transport method with calculated price

## Changes Made

### 1. New Status: `BEING_PACKED`

**Database:**
- Added `BEING_PACKED` to `WarehouseOrderStatus` enum
- Migration applied to database

**When set:**
- When client creates shipment request, all included `WarehouseOrder` records get status `BEING_PACKED`

### 2. Client Dashboard - Shipments Section

**Component:** `ShipmentsInPreparation.tsx`
- Shows all shipments with status `REQUESTED` or `AWAITING_ACCEPTANCE`
- Expandable cards showing individual orders within each shipment
- Color-coded status badges:
  - Yellow: "In Preparation" (REQUESTED)
  - Green: "Ready for Transport Choice" (AWAITING_ACCEPTANCE)
- When ready: shows calculated price and "Choose Transport Method" button

**Location:** `/client/dashboard`
- Appears between KPI cards and Quick Actions
- Only shows if there are shipments in preparation

### 3. Warehouse Packing Flow

**Status Flow:**
1. `AT_WAREHOUSE` → Client requests shipment → `BEING_PACKED`
2. Warehouse packs order → `READY_TO_SHIP`
3. All orders in shipment packed → Shipment status: `AWAITING_ACCEPTANCE`

**Dashboard Updates:**
- Warehouse dashboard shows `BEING_PACKED` orders in "To Pack" queue
- Filter option added: "W przygotowaniu" (In Preparation)

### 4. Automatic Price Calculation

**When:** After all orders in a shipment are packed (`READY_TO_SHIP`)

**How:**
- System aggregates all packages from all orders in shipment
- Calculates total volume (m³), weight (kg), and pallet count
- Finds matching `TransportPricing` rule
- Updates `ShipmentOrder`:
  - `calculatedPriceEur` = calculated price
  - `transportPricingId` = matching rule ID
  - `status` = `AWAITING_ACCEPTANCE`

### 5. Email Notification

**Implementation:**
- Supabase Edge Function: `supabase/functions/send-shipment-ready-email/index.ts`
- Triggered when shipment status changes to `AWAITING_ACCEPTANCE`
- Email includes:
  - Shipment ID
  - Calculated transport price
  - Link to transport choice page
  - All three transport options

**Setup Required:**
- Add `RESEND_API_KEY` to Supabase Edge Function secrets
- Or configure Supabase database webhook
- See `EMAIL-SETUP.md` for details

### 6. Transport Choice Page

**Updated Logic:**
- If status is `REQUESTED` or no `calculatedPriceEur` → Shows "Waiting for Warehouse" message
- If status is `AWAITING_ACCEPTANCE` and `calculatedPriceEur` exists → Shows transport choice options

**No More Constant Checking:**
- Client doesn't need to refresh page
- Email notification alerts them when ready
- Dashboard shows ready shipments automatically

## Workflow Diagram

```
1. Client Dashboard
   ↓
2. Select warehouse orders (AT_WAREHOUSE)
   ↓
3. Create shipment request
   ├─→ ShipmentOrder created (status: REQUESTED)
   └─→ WarehouseOrders updated (status: BEING_PACKED)
   ↓
4. Warehouse Dashboard
   ├─→ Sees orders with status BEING_PACKED
   └─→ Packs orders, enters dimensions/weight
   ↓
5. System (after all orders packed)
   ├─→ Calculates total volume, weight, pallets
   ├─→ Finds matching TransportPricing rule
   ├─→ Updates ShipmentOrder:
   │   ├─ calculatedPriceEur
   │   ├─ transportPricingId
   │   └─ status: AWAITING_ACCEPTANCE
   └─→ Sends email notification to client
   ↓
6. Client Dashboard
   ├─→ Sees shipment with "Ready for Transport Choice" badge
   ├─→ Shows calculated price
   └─→ "Choose Transport Method" button
   ↓
7. Transport Choice Page
   ├─→ Shows calculated price (not €0.00)
   └─→ Three options: Accept / Request Custom / Own Transport
```

## Key Files

### Client Side
- `src/app/client/dashboard/page.tsx` - Fetches and displays shipments
- `src/components/shipments/ShipmentsInPreparation.tsx` - Expandable shipment cards
- `src/app/client/shipments/[id]/transport-choice/page.tsx` - Transport selection

### Warehouse Side
- `src/app/warehouse/orders/page.tsx` - Shows BEING_PACKED orders
- `src/app/warehouse/pack-order/[id]/page.tsx` - Packing form
- `src/app/api/warehouse/pack-order/route.ts` - Packing logic + price calculation

### API Endpoints
- `src/app/api/client/shipments/route.ts` - Creates shipment, sets BEING_PACKED
- `src/app/api/warehouse/pack-order/route.ts` - Packs order, calculates shipment price

### Email
- `supabase/functions/send-shipment-ready-email/index.ts` - Edge Function for emails
- `EMAIL-SETUP.md` - Setup instructions

## Database Changes

- Enum updated: `WarehouseOrderStatus` includes `BEING_PACKED`
- Migration applied: `add_being_packed_status`

## Testing Checklist

- [x] Client can create shipment request
- [x] Warehouse orders get BEING_PACKED status
- [x] Warehouse sees BEING_PACKED orders in queue
- [x] Warehouse can pack BEING_PACKED orders
- [x] System calculates price after all orders packed
- [x] Shipment status changes to AWAITING_ACCEPTANCE
- [x] Email notification sent (or logged)
- [x] Client dashboard shows ready shipments
- [x] Client can choose transport method with calculated price

## Next Steps

1. **Configure Email Service:**
   - Set up Resend account or other email provider
   - Add API key to Supabase Edge Function secrets
   - Deploy Edge Function: `supabase functions deploy send-shipment-ready-email`

2. **Test Email Flow:**
   - Create test shipment
   - Pack orders
   - Verify email received

3. **Optional Enhancements:**
   - Real-time updates via WebSocket
   - Push notifications
   - SMS notifications
   - Multiple email recipients

