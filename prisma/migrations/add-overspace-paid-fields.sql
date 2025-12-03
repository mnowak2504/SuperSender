-- Migration: Add overspace paid fields to MonthlyAdditionalCharges
-- Date: 2025-12-03
--
-- This adds fields to track when overspace was charged and how much space was paid for.
-- When overspace is charged, the paid space is added to the client's limit for 1 month from charge date.

-- Add fields to MonthlyAdditionalCharges
ALTER TABLE "MonthlyAdditionalCharges"
ADD COLUMN IF NOT EXISTS "overSpaceChargedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "overSpacePaidCbm" DOUBLE PRECISION DEFAULT 0;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS "MonthlyAdditionalCharges_overSpaceChargedAt_idx" 
ON "MonthlyAdditionalCharges"("overSpaceChargedAt") 
WHERE "overSpaceChargedAt" IS NOT NULL;

