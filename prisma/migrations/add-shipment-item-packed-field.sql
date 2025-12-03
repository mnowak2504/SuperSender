-- Migration: Add isPacked field to ShipmentItem
-- Date: 2025-12-03
--
-- This adds a field to track which warehouse orders have been packed within a shipment order.
-- When all orders are packed, the shipment can be finalized with dimensions.

ALTER TABLE "ShipmentItem"
ADD COLUMN IF NOT EXISTS "isPacked" BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "ShipmentItem_shipmentId_isPacked_idx" 
ON "ShipmentItem"("shipmentId", "isPacked") 
WHERE "isPacked" = FALSE;

