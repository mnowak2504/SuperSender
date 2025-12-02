-- Migration: Add internal tracking number and packing order number
-- Date: 2025-01-XX

-- Add IN_PREPARATION status to WarehouseOrderStatus enum
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'IN_PREPARATION' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'WarehouseOrderStatus')
    ) THEN
        ALTER TYPE "WarehouseOrderStatus" ADD VALUE 'IN_PREPARATION';
    END IF;
END $$;

-- Add internalTrackingNumber to WarehouseOrder (for internal warehouse tracking)
ALTER TABLE "WarehouseOrder"
ADD COLUMN IF NOT EXISTS "internalTrackingNumber" TEXT;

-- Add packingOrderNumber to ShipmentOrder (format: IE-{COUNTRY}-{MONTH}-XXX)
ALTER TABLE "ShipmentOrder"
ADD COLUMN IF NOT EXISTS "packingOrderNumber" TEXT;

-- Create index for packingOrderNumber
CREATE INDEX IF NOT EXISTS "ShipmentOrder_packingOrderNumber_idx" ON "ShipmentOrder"("packingOrderNumber");

-- Create index for internalTrackingNumber
CREATE INDEX IF NOT EXISTS "WarehouseOrder_internalTrackingNumber_idx" ON "WarehouseOrder"("internalTrackingNumber");

