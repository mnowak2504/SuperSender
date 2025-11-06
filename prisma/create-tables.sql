-- ============================================
-- STEP 2: CREATE ALL TABLES
-- Run this after clearing the database
-- ============================================

-- Create Enums (PostgreSQL supports ENUM types)
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('CLIENT', 'WAREHOUSE', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DeliveryExpectedStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "WarehouseOrderStatus" AS ENUM ('AT_WAREHOUSE', 'TO_PACK', 'READY_FOR_QUOTE', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ShipmentStatus" AS ENUM ('REQUESTED', 'QUOTED', 'AWAITING_ACCEPTANCE', 'AWAITING_PAYMENT', 'READY_FOR_LOADING', 'IN_TRANSIT', 'DELIVERED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceType" AS ENUM ('SUBSCRIPTION', 'TRANSPORT', 'OPERATIONS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'PAID', 'OVERDUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransportMode" AS ENUM ('MAK', 'CLIENT_OWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Plan table (no dependencies)
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deliveriesPerMonth" INTEGER NOT NULL,
    "spaceLimitCbm" DOUBLE PRECISION NOT NULL,
    "overSpaceRateEur" DOUBLE PRECISION NOT NULL,
    "operationsRateEur" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- Create Client table (depends on Plan)
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "clientCode" TEXT NOT NULL,
    "salesOwnerCode" TEXT NOT NULL,
    "planId" TEXT,
    "status" TEXT NOT NULL,
    "spaceUsagePct" INTEGER NOT NULL DEFAULT 0,
    "caretakerName" TEXT,
    "caretakerContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Client_clientCode_key" ON "Client"("clientCode");

ALTER TABLE "Client" ADD CONSTRAINT "Client_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create User table (depends on Client)
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create DeliveryExpected table (depends on Client)
CREATE TABLE "DeliveryExpected" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "goodsDescription" TEXT NOT NULL,
    "orderNumber" TEXT,
    "eta" TIMESTAMP(3),
    "status" "DeliveryExpectedStatus" NOT NULL DEFAULT 'EXPECTED',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryExpected_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "DeliveryExpected" ADD CONSTRAINT "DeliveryExpected_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create WarehouseOrder table (depends on Client, DeliveryExpected)
CREATE TABLE "WarehouseOrder" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sourceDeliveryId" TEXT,
    "status" "WarehouseOrderStatus" NOT NULL DEFAULT 'AT_WAREHOUSE',
    "packedLengthCm" INTEGER,
    "packedWidthCm" INTEGER,
    "packedHeightCm" INTEGER,
    "packedWeightKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WarehouseOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WarehouseOrder_sourceDeliveryId_key" ON "WarehouseOrder"("sourceDeliveryId");

ALTER TABLE "WarehouseOrder" ADD CONSTRAINT "WarehouseOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WarehouseOrder" ADD CONSTRAINT "WarehouseOrder_sourceDeliveryId_fkey" FOREIGN KEY ("sourceDeliveryId") REFERENCES "DeliveryExpected"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create Address table (depends on Client)
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Address" ADD CONSTRAINT "Address_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create ShipmentOrder table (depends on Client, Address)
CREATE TABLE "ShipmentOrder" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "deliveryAddressId" TEXT NOT NULL,
    "transportMode" "TransportMode" NOT NULL,
    "timeWindowFrom" TIMESTAMP(3),
    "timeWindowTo" TIMESTAMP(3),
    "status" "ShipmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "proposedPriceEur" DOUBLE PRECISION,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipmentOrder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ShipmentOrder" ADD CONSTRAINT "ShipmentOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShipmentOrder" ADD CONSTRAINT "ShipmentOrder_deliveryAddressId_fkey" FOREIGN KEY ("deliveryAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create ShipmentItem table (depends on ShipmentOrder, WarehouseOrder)
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "warehouseOrderId" TEXT NOT NULL,
    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShipmentItem_shipmentId_warehouseOrderId_key" ON "ShipmentItem"("shipmentId", "warehouseOrderId");

ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "ShipmentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_warehouseOrderId_fkey" FOREIGN KEY ("warehouseOrderId") REFERENCES "WarehouseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Invoice table (depends on Client)
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL,
    "amountEur" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "revolutLink" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create Media table (depends on DeliveryExpected, WarehouseOrder)
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "deliveryExpectedId" TEXT,
    "warehouseOrderBeforeId" TEXT,
    "warehouseOrderAfterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Media" ADD CONSTRAINT "Media_deliveryExpectedId_fkey" FOREIGN KEY ("deliveryExpectedId") REFERENCES "DeliveryExpected"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" ADD CONSTRAINT "Media_warehouseOrderBeforeId_fkey" FOREIGN KEY ("warehouseOrderBeforeId") REFERENCES "WarehouseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" ADD CONSTRAINT "Media_warehouseOrderAfterId_fkey" FOREIGN KEY ("warehouseOrderAfterId") REFERENCES "WarehouseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create ChangeLog table (depends on User)
CREATE TABLE "ChangeLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChangeLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChangeLog" ADD CONSTRAINT "ChangeLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX "Client_planId_idx" ON "Client"("planId");
CREATE INDEX "User_clientId_idx" ON "User"("clientId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "DeliveryExpected_clientId_idx" ON "DeliveryExpected"("clientId");
CREATE INDEX "WarehouseOrder_clientId_idx" ON "WarehouseOrder"("clientId");
CREATE INDEX "WarehouseOrder_sourceDeliveryId_idx" ON "WarehouseOrder"("sourceDeliveryId");
CREATE INDEX "Address_clientId_idx" ON "Address"("clientId");
CREATE INDEX "ShipmentOrder_clientId_idx" ON "ShipmentOrder"("clientId");
CREATE INDEX "ShipmentOrder_deliveryAddressId_idx" ON "ShipmentOrder"("deliveryAddressId");
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");
CREATE INDEX "ShipmentItem_warehouseOrderId_idx" ON "ShipmentItem"("warehouseOrderId");
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX "Media_deliveryExpectedId_idx" ON "Media"("deliveryExpectedId");
CREATE INDEX "Media_warehouseOrderBeforeId_idx" ON "Media"("warehouseOrderBeforeId");
CREATE INDEX "Media_warehouseOrderAfterId_idx" ON "Media"("warehouseOrderAfterId");
CREATE INDEX "ChangeLog_actorId_idx" ON "ChangeLog"("actorId");

