-- Complete migration for LocalCollectionQuote table
-- Run this script in Supabase SQL Editor if the table doesn't exist yet

-- Create LocalCollectionQuote table
CREATE TABLE IF NOT EXISTS "LocalCollectionQuote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    -- Package details
    "widthCm" DOUBLE PRECISION NOT NULL,
    "lengthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "volumeCbm" DOUBLE PRECISION NOT NULL,
    -- Collection address
    "collectionAddressLine1" TEXT NOT NULL,
    "collectionAddressLine2" TEXT,
    "collectionCity" TEXT NOT NULL,
    "collectionPostCode" TEXT NOT NULL,
    "collectionCountry" TEXT,  -- Nullable, set when accepting quote
    "collectionContactName" TEXT,  -- Nullable, set when accepting quote
    "collectionContactPhone" TEXT,  -- Nullable, set when accepting quote
    -- Quote details
    "quotedPriceEur" DOUBLE PRECISION,
    "quotedById" TEXT,
    "quotedAt" TIMESTAMP(3),
    -- Collection scheduling
    "collectionDateFrom" TIMESTAMP(3),
    "collectionDateTo" TIMESTAMP(3),
    -- Documentation
    "orderNumber" TEXT,
    "orderDetails" TEXT,
    "pinCode" TEXT,
    -- Notes
    "clientNotes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LocalCollectionQuote_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "LocalCollectionQuote_clientId_idx" ON "LocalCollectionQuote"("clientId");
CREATE INDEX IF NOT EXISTS "LocalCollectionQuote_status_idx" ON "LocalCollectionQuote"("status");
CREATE INDEX IF NOT EXISTS "LocalCollectionQuote_createdAt_idx" ON "LocalCollectionQuote"("createdAt");

-- Add foreign key constraint (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'LocalCollectionQuote_clientId_fkey'
    ) THEN
        ALTER TABLE "LocalCollectionQuote" 
        ADD CONSTRAINT "LocalCollectionQuote_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- If table already exists with NOT NULL constraints, update them to nullable
DO $$ 
BEGIN
    -- Check if collectionCountry column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LocalCollectionQuote' 
        AND column_name = 'collectionCountry'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "LocalCollectionQuote" ALTER COLUMN "collectionCountry" DROP NOT NULL;
    END IF;

    -- Check if collectionContactName column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LocalCollectionQuote' 
        AND column_name = 'collectionContactName'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "LocalCollectionQuote" ALTER COLUMN "collectionContactName" DROP NOT NULL;
    END IF;

    -- Check if collectionContactPhone column exists and has NOT NULL constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'LocalCollectionQuote' 
        AND column_name = 'collectionContactPhone'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "LocalCollectionQuote" ALTER COLUMN "collectionContactPhone" DROP NOT NULL;
    END IF;
END $$;

