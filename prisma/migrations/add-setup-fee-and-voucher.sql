-- Migration: Add SetupFee and Voucher tables
-- Date: 2024

-- Create SetupFee table (single row for global setup fee configuration)
CREATE TABLE IF NOT EXISTS "SetupFee" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "suggestedAmountEur" DOUBLE PRECISION NOT NULL DEFAULT 119.0,
  "currentAmountEur" DOUBLE PRECISION NOT NULL DEFAULT 119.0,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Insert default setup fee if not exists
INSERT INTO "SetupFee" (id, "suggestedAmountEur", "currentAmountEur", "createdAt", "updatedAt")
SELECT 
  'setup_fee_1',
  119.0,
  119.0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "SetupFee" WHERE id = 'setup_fee_1'
);

-- Create Voucher table
CREATE TABLE IF NOT EXISTS "Voucher" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "amountEur" DOUBLE PRECISION NOT NULL,
  "isOneTime" BOOLEAN NOT NULL DEFAULT true,
  "usedByClientId" TEXT,
  "usedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Voucher_usedByClientId_fkey" FOREIGN KEY ("usedByClientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Voucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "Voucher_code_idx" ON "Voucher"("code");
CREATE INDEX IF NOT EXISTS "Voucher_usedByClientId_idx" ON "Voucher"("usedByClientId");
CREATE INDEX IF NOT EXISTS "Voucher_createdById_idx" ON "Voucher"("createdById");

