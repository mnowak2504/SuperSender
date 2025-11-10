-- Migration: Add UserSettings table for notification preferences
-- Date: 2024

CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveryReceived" BOOLEAN NOT NULL DEFAULT true,
    "shipmentReady" BOOLEAN NOT NULL DEFAULT true,
    "invoiceIssued" BOOLEAN NOT NULL DEFAULT true,
    "paymentReminder" BOOLEAN NOT NULL DEFAULT true,
    "overStorageAlert" BOOLEAN NOT NULL DEFAULT true,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

