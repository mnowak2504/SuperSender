-- ============================================
-- MIGRATION: Rozszerzenie schematu dla pełnego workflow
-- Data: 2025-01-XX
-- Opis: Dodanie brakujących pól i statusów zgodnie z workflow biznesowym
-- ============================================

-- 1. Aktualizacja enums - dodanie nowych statusów
DO $$ BEGIN
    -- Dodaj DAMAGED do DeliveryExpectedStatus jeśli nie istnieje
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DAMAGED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DeliveryExpectedStatus')
    ) THEN
        ALTER TYPE "DeliveryExpectedStatus" ADD VALUE 'DAMAGED';
    END IF;
END $$;

DO $$ BEGIN
    -- Dodaj PACKED do WarehouseOrderStatus jeśli nie istnieje
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PACKED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'WarehouseOrderStatus')
    ) THEN
        ALTER TYPE "WarehouseOrderStatus" ADD VALUE 'PACKED';
    END IF;
END $$;

-- 2. Aktualizacja tabeli DeliveryExpected
ALTER TABLE "DeliveryExpected"
ADD COLUMN IF NOT EXISTS "clientReference" TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER,
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'OK', -- OK / DAMAGED
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS "warehouseLocation" TEXT,
ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "receivedById" TEXT;

-- Foreign key dla receivedBy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'DeliveryExpected_receivedById_fkey'
    ) THEN
        ALTER TABLE "DeliveryExpected"
        ADD CONSTRAINT "DeliveryExpected_receivedById_fkey" 
        FOREIGN KEY ("receivedById") REFERENCES "User"(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Aktualizacja tabeli WarehouseOrder
ALTER TABLE "WarehouseOrder"
ADD COLUMN IF NOT EXISTS "warehouseLocation" TEXT,
ADD COLUMN IF NOT EXISTS "storageDays" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "packedAt" TIMESTAMP(3);

-- 4. Aktualizacja tabeli ShipmentOrder
ALTER TABLE "ShipmentOrder"
ADD COLUMN IF NOT EXISTS "loadingSlotBooked" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "loadingSlotFrom" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "loadingSlotTo" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "paymentConfirmedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "quotedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "quotedById" TEXT;

-- Foreign key dla quotedBy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ShipmentOrder_quotedById_fkey'
    ) THEN
        ALTER TABLE "ShipmentOrder"
        ADD CONSTRAINT "ShipmentOrder_quotedById_fkey" 
        FOREIGN KEY ("quotedById") REFERENCES "User"(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Aktualizacja tabeli Client
ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "creditHold" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "storageOvercharge" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "deliveriesThisMonth" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastInvoiceDate" TIMESTAMP(3);

-- 6. Aktualizacja tabeli Invoice
ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "revolutPaymentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentWebhookReceivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "periodStart" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "periodEnd" TIMESTAMP(3);

-- 7. Dodanie relacji Invoice -> ShipmentOrder (jeśli brakuje)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Invoice_shipmentOrderId_fkey'
    ) THEN
        ALTER TABLE "Invoice"
        ADD COLUMN IF NOT EXISTS "shipmentOrderId" TEXT,
        ADD CONSTRAINT "Invoice_shipmentOrderId_fkey" 
        FOREIGN KEY ("shipmentOrderId") REFERENCES "ShipmentOrder"(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 8. Indeksy dla poprawy wydajności
CREATE INDEX IF NOT EXISTS "DeliveryExpected_status_idx" ON "DeliveryExpected"("status");
CREATE INDEX IF NOT EXISTS "DeliveryExpected_clientId_idx" ON "DeliveryExpected"("clientId");
CREATE INDEX IF NOT EXISTS "WarehouseOrder_status_idx" ON "WarehouseOrder"("status");
CREATE INDEX IF NOT EXISTS "WarehouseOrder_clientId_idx" ON "WarehouseOrder"("clientId");
CREATE INDEX IF NOT EXISTS "ShipmentOrder_status_idx" ON "ShipmentOrder"("status");
CREATE INDEX IF NOT EXISTS "ShipmentOrder_clientId_idx" ON "ShipmentOrder"("clientId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX IF NOT EXISTS "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- 9. Funkcja do generowania numeru faktury (format: FV-YYYYMMDD-XXX)
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT;
    v_counter INTEGER;
    v_number TEXT;
BEGIN
    v_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Znajdź ostatni numer dla dzisiejszej daty
    SELECT COALESCE(MAX(
        CAST(SUBSTRING("invoiceNumber" FROM 'FV-[0-9]{8}-([0-9]+)$') AS INTEGER)
    ), 0) + 1
    INTO v_counter
    FROM "Invoice"
    WHERE "invoiceNumber" LIKE 'FV-' || v_date || '-%';
    
    v_number := 'FV-' || v_date || '-' || LPAD(v_counter::TEXT, 3, '0');
    
    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_invoice_number() IS 'Generuje unikalny numer faktury w formacie FV-YYYYMMDD-XXX';

