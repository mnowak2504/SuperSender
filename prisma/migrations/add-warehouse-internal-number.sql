-- Migration: Add warehouseInternalNumber to WarehouseOrder
-- Date: 2025-01-30
-- Description: Add field for manual internal number that warehouse staff can enter when receiving deliveries

ALTER TABLE "WarehouseOrder"
ADD COLUMN IF NOT EXISTS "warehouseInternalNumber" TEXT;

-- Add index for efficient querying by warehouse internal number
CREATE INDEX IF NOT EXISTS "WarehouseOrder_warehouseInternalNumber_idx"
ON "WarehouseOrder"("warehouseInternalNumber");

