-- Add promotionalPriceEur field to Plan table
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "promotionalPriceEur" DOUBLE PRECISION;

-- Add comment to clarify the field purpose
COMMENT ON COLUMN "Plan"."promotionalPriceEur" IS 'Promotional monthly price (null = no promotion). Original price is stored in operationsRateEur.';

