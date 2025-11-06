# Delivery Number & Order Selection Implementation

## Overview

Implemented a system where:
1. Each delivery gets a unique delivery number (e.g., "DEL-2024-001") when received at the warehouse
2. Clients can select individual warehouse orders (from received deliveries) to request shipment
3. Warehouse staff can see and reference delivery numbers when packing orders

## Changes Made

### 1. Database Schema

**Added `deliveryNumber` field to `DeliveryExpected`:**
- Unique, auto-generated number in format: `DEL-YYYY-XXX`
- Example: `DEL-2024-001`, `DEL-2024-002`, etc.
- Automatically generated when delivery is received (if not already set)

**Migration Applied:**
```sql
ALTER TABLE "DeliveryExpected" 
ADD COLUMN IF NOT EXISTS "deliveryNumber" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryExpected_deliveryNumber_key" 
ON "DeliveryExpected"("deliveryNumber") 
WHERE "deliveryNumber" IS NOT NULL;
```

### 2. Delivery Number Generation

**New File: `src/lib/delivery-number.ts`**
- Function: `generateDeliveryNumber(supabase)`
- Logic:
  - Finds highest existing number for current year
  - Increments by 1
  - Pads with zeros (001, 002, etc.)
  - Returns format: `DEL-YYYY-XXX`

### 3. Receive Delivery API

**Updated: `src/app/api/warehouse/receive-delivery/route.ts`**
- Auto-generates delivery number when delivery is received
- Only generates if `deliveryNumber` is not already set
- Updates `DeliveryExpected` record with the generated number

### 4. Client Interface - Order Selection

**New Page: `src/app/client/warehouse-orders/select/page.tsx`**
- Client can view all available warehouse orders (status: `AT_WAREHOUSE` or `READY_TO_SHIP`)
- Checkbox interface to select multiple orders
- Shows delivery number for each order
- Delivery address selection
- Creates shipment order with selected warehouse orders
- Redirects to transport choice page after creation

**Updated: `src/app/client/warehouse-orders/page.tsx`**
- Added "Delivery Number" column
- Shows delivery number prominently (e.g., `DEL-2024-001`)
- Added "Request Shipment" button for available orders
- Links to order selection page

### 5. Shipment Creation API

**Updated: `src/app/api/client/shipments/route.ts`**
- Now accepts orders with status `AT_WAREHOUSE` (not just `READY_TO_SHIP`)
- Allows clients to request shipment before warehouse packs items
- Validates that all selected orders belong to the client

**Updated: `src/app/api/client/warehouse-orders/route.ts`**
- Includes delivery information (`deliveryNumber`, `supplierName`, etc.)
- Returns delivery data at root level for easier access

### 6. Warehouse Interface

**Updated: `src/app/warehouse/orders/page.tsx`**
- Shows delivery number prominently (e.g., "Dostawa DEL-2024-001")
- Displays supplier name and goods description from delivery
- Helps warehouse staff identify which items to pack

## Workflow

### Before (Old Flow):
1. Client creates delivery expected
2. Warehouse receives delivery → creates `WarehouseOrder` (status: `AT_WAREHOUSE`)
3. Warehouse packs order → status: `READY_TO_SHIP`
4. Client selects `READY_TO_SHIP` orders → creates `ShipmentOrder`

### After (New Flow):
1. Client creates delivery expected
2. Warehouse receives delivery → **generates delivery number** → creates `WarehouseOrder` (status: `AT_WAREHOUSE`)
3. **Client can now select `AT_WAREHOUSE` orders to request shipment**
4. Client selects orders → creates `ShipmentOrder` → proceeds to transport choice
5. Warehouse packs order → status: `READY_TO_SHIP` (if not already packed)
6. System calculates transport price → client accepts/requests custom/arranges own

## Benefits

1. **Unique Identification**: Each delivery has a clear, human-readable number
2. **Early Shipment Request**: Clients don't need to wait for packing to request shipment
3. **Better Tracking**: Warehouse staff can reference delivery numbers when packing
4. **Flexibility**: Clients can select multiple orders from different deliveries in one shipment
5. **Clear Communication**: Delivery numbers appear in all relevant interfaces

## UI Screenshots/Features

### Client Warehouse Orders Page:
- Table showing: Delivery Number | Received Date | Supplier | Description | Location | Status | Actions
- "Request Shipment" button for available orders

### Client Order Selection Page:
- Checkbox list of available orders
- Each order shows: Delivery Number, Supplier, Description, Received Date, Location
- Delivery address selection
- "Continue to Transport Selection" button

### Warehouse Orders Page:
- Shows "Dostawa DEL-2024-001" instead of just order ID
- Displays supplier and goods description
- Clear identification for packing

## Testing Checklist

- [ ] Delivery number is generated when warehouse receives delivery
- [ ] Delivery numbers are unique and sequential per year
- [ ] Client can see delivery numbers in warehouse orders list
- [ ] Client can select multiple orders for shipment
- [ ] Shipment is created with selected orders
- [ ] Warehouse can see delivery numbers when packing
- [ ] Delivery numbers persist across the system

## Future Enhancements

- [ ] QR code generation for delivery numbers
- [ ] Barcode scanning for warehouse operations
- [ ] Delivery number search/filter
- [ ] Export delivery numbers to shipping labels
- [ ] Delivery number in email notifications

