-- Migration: Add bufferCbm and localPickupDiscountPercent to Plan table
-- Date: 2025-01-XX
--
-- This adds:
-- 1. bufferCbm - Free buffer space (e.g., 5m³ for Professional plan)
-- 2. localPickupDiscountPercent - Discount percentage for local pickup (e.g., 15% for Professional)

ALTER TABLE "Plan"
ADD COLUMN IF NOT EXISTS "bufferCbm" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "localPickupDiscountPercent" DOUBLE PRECISION DEFAULT 0;

-- Update Professional plan with buffer and discount
UPDATE "Plan"
SET 
  "bufferCbm" = 5.0,
  "localPickupDiscountPercent" = 15.0
WHERE "name" = 'Professional';

-- Update Basic plan deliveries
UPDATE "Plan"
SET "deliveriesPerMonth" = 7
WHERE "name" = 'Basic';

-- Update Standard plan deliveries
UPDATE "Plan"
SET "deliveriesPerMonth" = 14
WHERE "name" = 'Standard';

-- Update Professional plan deliveries
UPDATE "Plan"
SET "deliveriesPerMonth" = 28
WHERE "name" = 'Professional';

