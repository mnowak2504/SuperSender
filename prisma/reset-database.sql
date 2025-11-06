-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- Run this first to clear everything
-- ============================================

-- Drop tables in reverse dependency order (child tables first)
DROP TABLE IF EXISTS "ChangeLog" CASCADE;
DROP TABLE IF EXISTS "Media" CASCADE;
DROP TABLE IF EXISTS "ShipmentItem" CASCADE;
DROP TABLE IF EXISTS "ShipmentOrder" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "Address" CASCADE;
DROP TABLE IF EXISTS "WarehouseOrder" CASCADE;
DROP TABLE IF EXISTS "DeliveryExpected" CASCADE;
DROP TABLE IF EXISTS "Client" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Plan" CASCADE;

-- Drop Prisma migration tables if they exist
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "DeliveryExpectedStatus" CASCADE;
DROP TYPE IF EXISTS "WarehouseOrderStatus" CASCADE;
DROP TYPE IF EXISTS "ShipmentStatus" CASCADE;
DROP TYPE IF EXISTS "InvoiceType" CASCADE;
DROP TYPE IF EXISTS "InvoiceStatus" CASCADE;
DROP TYPE IF EXISTS "TransportMode" CASCADE;

