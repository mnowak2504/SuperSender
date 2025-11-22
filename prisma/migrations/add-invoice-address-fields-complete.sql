-- Migration: Add separate invoice address fields to Client table
-- Date: 2024

-- Add separate invoice address fields
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "invoiceAddressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceAddressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceCity" TEXT,
ADD COLUMN IF NOT EXISTS "invoicePostCode" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "Client"."invoiceAddressLine1" IS 'Invoice address line 1 (street address)';
COMMENT ON COLUMN "Client"."invoiceAddressLine2" IS 'Invoice address line 2 (apartment, suite, etc.)';
COMMENT ON COLUMN "Client"."invoiceCity" IS 'Invoice city/town';
COMMENT ON COLUMN "Client"."invoicePostCode" IS 'Invoice postal code';

