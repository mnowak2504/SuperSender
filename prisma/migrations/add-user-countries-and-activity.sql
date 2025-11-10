-- Add countries array and lastActivityAt to User table
-- Countries will be stored as a JSONB array for flexibility
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "countries" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on countries for faster queries
CREATE INDEX IF NOT EXISTS "User_countries_idx" ON "User" USING GIN ("countries");

-- Create index on lastActivityAt for activity tracking
CREATE INDEX IF NOT EXISTS "User_lastActivityAt_idx" ON "User" ("lastActivityAt");

