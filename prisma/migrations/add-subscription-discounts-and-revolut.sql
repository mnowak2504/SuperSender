-- Migration: Add subscription discounts and Revolut payment fields
-- Date: 2024

-- Add discount fields to Client table
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "subscriptionDiscount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "additionalServicesDiscount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "revolutCustomerId" TEXT;

-- Add Revolut payment fields to Invoice table
ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "revolutOrderId" TEXT,
ADD COLUMN IF NOT EXISTS "revolutPublicId" TEXT,
ADD COLUMN IF NOT EXISTS "revolutCheckoutUrl" TEXT,
ADD COLUMN IF NOT EXISTS "revolutState" TEXT,
ADD COLUMN IF NOT EXISTS "providerCustomerId" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "Client"."subscriptionDiscount" IS 'Discount percentage for subscription (max 30% for admin, unlimited for superadmin)';
COMMENT ON COLUMN "Client"."additionalServicesDiscount" IS 'Discount percentage for additional services like over-space, extra deliveries (max 40% for admin, unlimited for superadmin, excludes outbound transport)';
COMMENT ON COLUMN "Client"."revolutCustomerId" IS 'Revolut customer ID for payment provider customer reuse';
COMMENT ON COLUMN "Invoice"."revolutOrderId" IS 'Revolut order ID';
COMMENT ON COLUMN "Invoice"."revolutPublicId" IS 'Revolut public order ID';
COMMENT ON COLUMN "Invoice"."revolutCheckoutUrl" IS 'Revolut checkout URL for payment';
COMMENT ON COLUMN "Invoice"."revolutState" IS 'Revolut order state: PENDING, COMPLETED, DECLINED, CANCELLED';
COMMENT ON COLUMN "Invoice"."providerCustomerId" IS 'Payment provider customer ID for reuse';

