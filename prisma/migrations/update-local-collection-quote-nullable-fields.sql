-- Update LocalCollectionQuote table to make Country, ContactName, ContactPhone nullable
-- These fields will be set when client accepts the quote and schedules collection

ALTER TABLE "LocalCollectionQuote" 
ALTER COLUMN "collectionCountry" DROP NOT NULL,
ALTER COLUMN "collectionContactName" DROP NOT NULL,
ALTER COLUMN "collectionContactPhone" DROP NOT NULL;

