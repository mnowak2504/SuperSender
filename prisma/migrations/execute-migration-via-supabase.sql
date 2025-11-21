-- This SQL creates a function to execute the migration
-- Run this FIRST in Supabase SQL Editor, then call the function

-- Create a function to add individual plan columns
CREATE OR REPLACE FUNCTION add_individual_plan_columns()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add fields for individual/custom plan conditions
  ALTER TABLE "Client" 
  ADD COLUMN IF NOT EXISTS "individualCbm" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "individualDeliveriesPerMonth" INTEGER,
  ADD COLUMN IF NOT EXISTS "individualShipmentsPerMonth" INTEGER,
  ADD COLUMN IF NOT EXISTS "individualOperationsRateEur" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "individualOverSpaceRateEur" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "individualAdditionalServicesRateEur" DOUBLE PRECISION;

  -- Add comments for documentation
  COMMENT ON COLUMN "Client"."individualCbm" IS 'Custom CBM limit for Individual plan';
  COMMENT ON COLUMN "Client"."individualDeliveriesPerMonth" IS 'Custom deliveries per month limit for Individual plan';
  COMMENT ON COLUMN "Client"."individualShipmentsPerMonth" IS 'Custom shipments per month limit for Individual plan';
  COMMENT ON COLUMN "Client"."individualOperationsRateEur" IS 'Custom operations rate in EUR for Individual plan';
  COMMENT ON COLUMN "Client"."individualOverSpaceRateEur" IS 'Custom over-space rate in EUR for Individual plan';
  COMMENT ON COLUMN "Client"."individualAdditionalServicesRateEur" IS 'Custom additional services rate in EUR for Individual plan';
END;
$$;

-- Execute the function
SELECT add_individual_plan_columns();

-- Drop the function after use (optional)
-- DROP FUNCTION IF EXISTS add_individual_plan_columns();

