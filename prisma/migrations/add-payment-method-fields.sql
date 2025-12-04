-- Migration: Add paymentMethod fields to ShipmentOrder and Invoice
-- Date: 2025-01-XX
-- 
-- This adds paymentMethod field to ShipmentOrder (for client's payment choice)
-- and to Invoice (to display payment method in admin view)

ALTER TABLE "ShipmentOrder"
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS "ShipmentOrder_paymentMethod_idx"
ON "ShipmentOrder"("paymentMethod");

CREATE INDEX IF NOT EXISTS "Invoice_paymentMethod_idx"
ON "Invoice"("paymentMethod");

