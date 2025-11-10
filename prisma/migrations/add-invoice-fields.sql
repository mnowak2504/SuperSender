-- Migration: Add invoice information fields to Client table
-- Date: 2024

-- Add invoice fields to Client table
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "invoiceName" TEXT,
ADD COLUMN IF NOT EXISTS "businessName" TEXT,
ADD COLUMN IF NOT EXISTS "vatNumber" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceAddress" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "Client"."invoiceName" IS 'Name for invoice purposes';
COMMENT ON COLUMN "Client"."businessName" IS 'Business/company name (optional)';
COMMENT ON COLUMN "Client"."vatNumber" IS 'EU VAT Number (optional)';
COMMENT ON COLUMN "Client"."invoiceAddress" IS 'Full invoice address';

