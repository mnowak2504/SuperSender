-- ============================================
-- COMPLETE MIGRATION: Add all invoice fields to Client table
-- Run this in Supabase SQL Editor
-- ============================================
-- This migration adds all invoice-related fields to the Client table:
-- - invoiceName (Name for invoice purposes)
-- - businessName (Business/company name - optional)
-- - vatNumber (EU VAT Number - optional)
-- - invoiceAddress (Full invoice address - backward compatibility)
-- - invoiceAddressLine1 (Invoice address line 1)
-- - invoiceAddressLine2 (Invoice address line 2)
-- - invoiceCity (Invoice city/town)
-- - invoicePostCode (Invoice postal code)

-- Step 1: Add basic invoice fields
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "invoiceName" TEXT,
ADD COLUMN IF NOT EXISTS "businessName" TEXT,
ADD COLUMN IF NOT EXISTS "vatNumber" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceAddress" TEXT;

-- Step 2: Add separate invoice address fields
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "invoiceAddressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceAddressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceCity" TEXT,
ADD COLUMN IF NOT EXISTS "invoicePostCode" TEXT;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN "Client"."invoiceName" IS 'Name for invoice purposes';
COMMENT ON COLUMN "Client"."businessName" IS 'Business/company name (optional)';
COMMENT ON COLUMN "Client"."vatNumber" IS 'EU VAT Number (optional)';
COMMENT ON COLUMN "Client"."invoiceAddress" IS 'Full invoice address (backward compatibility)';
COMMENT ON COLUMN "Client"."invoiceAddressLine1" IS 'Invoice address line 1 (street address)';
COMMENT ON COLUMN "Client"."invoiceAddressLine2" IS 'Invoice address line 2 (apartment, suite, etc.)';
COMMENT ON COLUMN "Client"."invoiceCity" IS 'Invoice city/town';
COMMENT ON COLUMN "Client"."invoicePostCode" IS 'Invoice postal code';

-- Step 4: Verify columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Client'
  AND column_name IN (
    'invoiceName',
    'businessName',
    'vatNumber',
    'invoiceAddress',
    'invoiceAddressLine1',
    'invoiceAddressLine2',
    'invoiceCity',
    'invoicePostCode'
  )
ORDER BY column_name;

