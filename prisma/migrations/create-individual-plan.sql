-- Migration: Create Individual plan
-- Date: 2024

-- Create Individual plan if it doesn't exist
INSERT INTO "Plan" (id, name, "deliveriesPerMonth", "spaceLimitCbm", "overSpaceRateEur", "operationsRateEur", "createdAt", "updatedAt")
SELECT 
  'ind_' || substr(md5(random()::text), 1, 8), -- Generate a unique ID
  'Individual',
  999, -- Unlimited deliveries
  999, -- Unlimited space (will use individualCbm from Client)
  0,   -- Will use individualOverSpaceRateEur from Client
  0,   -- Will use individualOperationsRateEur from Client
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Plan" WHERE name = 'Individual'
);

