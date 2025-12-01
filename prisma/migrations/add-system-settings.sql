-- Migration: Add SystemSettings table
-- Date: 2024

-- Create SystemSettings table
CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "id" TEXT NOT NULL,
    "dimensionBufferPercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "defaultClientLimitCbm" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "translationServiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "photoRetentionDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to ensure only one settings record
CREATE UNIQUE INDEX IF NOT EXISTS "SystemSettings_id_key" ON "SystemSettings"("id");

-- Insert default settings if none exist
INSERT INTO "SystemSettings" ("id", "dimensionBufferPercent", "defaultClientLimitCbm", "translationServiceEnabled", "photoRetentionDays")
SELECT 'sys_settings_default', 5.0, 5.0, true, 90
WHERE NOT EXISTS (SELECT 1 FROM "SystemSettings" LIMIT 1);

-- Add comments for documentation
COMMENT ON TABLE "SystemSettings" IS 'Global system settings managed by superadmin';
COMMENT ON COLUMN "SystemSettings"."dimensionBufferPercent" IS 'Percentage buffer added to calculated volume (m³) for warehouse usage';
COMMENT ON COLUMN "SystemSettings"."defaultClientLimitCbm" IS 'Default warehouse space limit (m³) assigned to new clients without a plan';
COMMENT ON COLUMN "SystemSettings"."translationServiceEnabled" IS 'Enable/disable automatic translation service for notes and comments';
COMMENT ON COLUMN "SystemSettings"."photoRetentionDays" IS 'Number of days photos are retained before automatic deletion';

