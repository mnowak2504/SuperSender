-- Migration: Add subscription dates, invoice number, and additional charges
-- Date: 2024

-- Add subscription dates to Client table
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3);

-- Add invoice number and subscription fields to Invoice table
ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionPeriod" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionPlanId" TEXT,
ADD COLUMN IF NOT EXISTS "revolutPaymentId" TEXT;

-- Create MonthlyAdditionalCharges table
CREATE TABLE IF NOT EXISTS "MonthlyAdditionalCharges" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "overSpaceAmountEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalServicesAmountEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmountEur" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyAdditionalCharges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyAdditionalCharges_clientId_month_year_key" 
ON "MonthlyAdditionalCharges"("clientId", "month", "year");

CREATE INDEX IF NOT EXISTS "MonthlyAdditionalCharges_clientId_idx" 
ON "MonthlyAdditionalCharges"("clientId");

CREATE INDEX IF NOT EXISTS "MonthlyAdditionalCharges_year_month_idx" 
ON "MonthlyAdditionalCharges"("year", "month");

ALTER TABLE "MonthlyAdditionalCharges" 
ADD CONSTRAINT "MonthlyAdditionalCharges_clientId_fkey" 
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create ProformaInvoice table
CREATE TABLE IF NOT EXISTS "ProformaInvoice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amountEur" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentLink" TEXT,
    "revolutOrderId" TEXT,
    "revolutCheckoutUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProformaInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProformaInvoice_clientId_month_year_key" 
ON "ProformaInvoice"("clientId", "month", "year");

CREATE INDEX IF NOT EXISTS "ProformaInvoice_clientId_idx" 
ON "ProformaInvoice"("clientId");

CREATE INDEX IF NOT EXISTS "ProformaInvoice_status_idx" 
ON "ProformaInvoice"("status");

CREATE INDEX IF NOT EXISTS "ProformaInvoice_dueDate_idx" 
ON "ProformaInvoice"("dueDate");

ALTER TABLE "ProformaInvoice" 
ADD CONSTRAINT "ProformaInvoice_clientId_fkey" 
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add comments for documentation
COMMENT ON COLUMN "Client"."subscriptionStartDate" IS 'When subscription starts';
COMMENT ON COLUMN "Client"."subscriptionEndDate" IS 'When subscription expires';
COMMENT ON COLUMN "Invoice"."invoiceNumber" IS 'Invoice number from external invoicing system (editable by admin/superadmin)';
COMMENT ON COLUMN "Invoice"."subscriptionStartDate" IS 'When subscription should start (for SUBSCRIPTION invoices)';
COMMENT ON COLUMN "Invoice"."subscriptionPeriod" IS 'Subscription period in months (for SUBSCRIPTION invoices)';
COMMENT ON COLUMN "Invoice"."subscriptionPlanId" IS 'Plan ID for subscription invoice';

