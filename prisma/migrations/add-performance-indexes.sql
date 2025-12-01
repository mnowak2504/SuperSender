-- Migration: Add performance indexes for 1000+ active users
-- Date: 2024

-- Critical indexes for frequently queried fields

-- Client indexes
CREATE INDEX IF NOT EXISTS "Client_email_idx" ON "Client"("email");
CREATE INDEX IF NOT EXISTS "Client_status_idx" ON "Client"("status");
CREATE INDEX IF NOT EXISTS "Client_salesOwnerId_idx" ON "Client"("salesOwnerId");
CREATE INDEX IF NOT EXISTS "Client_subscriptionEndDate_idx" ON "Client"("subscriptionEndDate");
CREATE INDEX IF NOT EXISTS "Client_createdAt_idx" ON "Client"("createdAt");

-- User indexes (already has email unique, but add role for filtering)
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");

-- DeliveryExpected indexes
CREATE INDEX IF NOT EXISTS "DeliveryExpected_status_idx" ON "DeliveryExpected"("status");
CREATE INDEX IF NOT EXISTS "DeliveryExpected_createdAt_idx" ON "DeliveryExpected"("createdAt");
CREATE INDEX IF NOT EXISTS "DeliveryExpected_eta_idx" ON "DeliveryExpected"("eta");

-- WarehouseOrder indexes
CREATE INDEX IF NOT EXISTS "WarehouseOrder_status_idx" ON "WarehouseOrder"("status");
CREATE INDEX IF NOT EXISTS "WarehouseOrder_createdAt_idx" ON "WarehouseOrder"("createdAt");

-- ShipmentOrder indexes
CREATE INDEX IF NOT EXISTS "ShipmentOrder_status_idx" ON "ShipmentOrder"("status");
CREATE INDEX IF NOT EXISTS "ShipmentOrder_transportMode_idx" ON "ShipmentOrder"("transportMode");
CREATE INDEX IF NOT EXISTS "ShipmentOrder_salesOwnerId_idx" ON "ShipmentOrder"("salesOwnerId");
CREATE INDEX IF NOT EXISTS "ShipmentOrder_createdAt_idx" ON "ShipmentOrder"("createdAt");
CREATE INDEX IF NOT EXISTS "ShipmentOrder_plannedLoadingDate_idx" ON "ShipmentOrder"("plannedLoadingDate");

-- Invoice indexes
CREATE INDEX IF NOT EXISTS "Invoice_type_idx" ON "Invoice"("type");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX IF NOT EXISTS "Invoice_createdAt_idx" ON "Invoice"("createdAt");
CREATE INDEX IF NOT EXISTS "Invoice_paidAt_idx" ON "Invoice"("paidAt");
CREATE INDEX IF NOT EXISTS "Invoice_revolutOrderId_idx" ON "Invoice"("revolutOrderId");
CREATE INDEX IF NOT EXISTS "Invoice_revolutPaymentId_idx" ON "Invoice"("revolutPaymentId");

-- Address indexes
CREATE INDEX IF NOT EXISTS "Address_isDefault_idx" ON "Address"("isDefault");

-- Media indexes (for photo queries)
CREATE INDEX IF NOT EXISTS "Media_kind_idx" ON "Media"("kind");
CREATE INDEX IF NOT EXISTS "Media_createdAt_idx" ON "Media"("createdAt");

-- ChangeLog indexes (for audit trail)
CREATE INDEX IF NOT EXISTS "ChangeLog_entityType_idx" ON "ChangeLog"("entityType");
CREATE INDEX IF NOT EXISTS "ChangeLog_entityId_idx" ON "ChangeLog"("entityId");
CREATE INDEX IF NOT EXISTS "ChangeLog_createdAt_idx" ON "ChangeLog"("createdAt");

-- Package indexes
CREATE INDEX IF NOT EXISTS "Package_type_idx" ON "Package"("type");
CREATE INDEX IF NOT EXISTS "Package_createdAt_idx" ON "Package"("createdAt");

-- TransportPricing indexes
CREATE INDEX IF NOT EXISTS "TransportPricing_isActive_idx" ON "TransportPricing"("isActive");
CREATE INDEX IF NOT EXISTS "TransportPricing_transportType_idx" ON "TransportPricing"("transportType");
CREATE INDEX IF NOT EXISTS "TransportPricing_priority_idx" ON "TransportPricing"("priority");

-- Voucher indexes
CREATE INDEX IF NOT EXISTS "Voucher_usedByClientId_idx" ON "Voucher"("usedByClientId");
CREATE INDEX IF NOT EXISTS "Voucher_expiresAt_idx" ON "Voucher"("expiresAt");
CREATE INDEX IF NOT EXISTS "Voucher_createdAt_idx" ON "Voucher"("createdAt");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "Client_planId_status_idx" ON "Client"("planId", "status");
CREATE INDEX IF NOT EXISTS "DeliveryExpected_clientId_status_idx" ON "DeliveryExpected"("clientId", "status");
CREATE INDEX IF NOT EXISTS "WarehouseOrder_clientId_status_idx" ON "WarehouseOrder"("clientId", "status");
CREATE INDEX IF NOT EXISTS "ShipmentOrder_clientId_status_idx" ON "ShipmentOrder"("clientId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_clientId_status_idx" ON "Invoice"("clientId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_clientId_type_idx" ON "Invoice"("clientId", "type");
CREATE INDEX IF NOT EXISTS "Invoice_status_dueDate_idx" ON "Invoice"("status", "dueDate");

-- Comments for documentation
COMMENT ON INDEX "Client_email_idx" IS 'Index for fast email lookups';
COMMENT ON INDEX "Client_subscriptionEndDate_idx" IS 'Index for subscription expiry queries';
COMMENT ON INDEX "ShipmentOrder_status_idx" IS 'Index for filtering shipments by status';
COMMENT ON INDEX "Invoice_status_dueDate_idx" IS 'Composite index for overdue invoice queries';

