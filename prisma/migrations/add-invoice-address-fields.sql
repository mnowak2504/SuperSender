-- Add separate invoice address fields
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "invoiceAddressLine1" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceAddressLine2" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceCity" TEXT,
ADD COLUMN IF NOT EXISTS "invoicePostCode" TEXT;

-- Migrate existing invoiceAddress data if it exists
-- This is a simple migration - we'll keep invoiceAddress for backward compatibility
-- but new data will use the separate fields

