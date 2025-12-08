-- Update existing SetupFee records to use €99 as default
UPDATE "SetupFee"
SET 
  "suggestedAmountEur" = 99.0,
  "currentAmountEur" = CASE 
    WHEN "currentAmountEur" = 119.0 THEN 99.0 
    ELSE "currentAmountEur" 
  END,
  "updatedAt" = NOW()
WHERE "suggestedAmountEur" = 119.0 OR "currentAmountEur" = 119.0;

-- Update default value for new records (if column default needs to be changed)
-- Note: This requires ALTER TABLE which may need to be done manually in Supabase
-- ALTER TABLE "SetupFee" ALTER COLUMN "suggestedAmountEur" SET DEFAULT 99.0;
-- ALTER TABLE "SetupFee" ALTER COLUMN "currentAmountEur" SET DEFAULT 99.0;

