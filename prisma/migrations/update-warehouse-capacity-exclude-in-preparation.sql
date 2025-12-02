-- Migration: Update warehouse capacity function to exclude IN_PREPARATION orders
-- Date: 2025-01-XX
-- 
-- This updates the update_client_warehouse_capacity RPC function to exclude
-- WarehouseOrders with status IN_PREPARATION from capacity calculations.
-- Orders in IN_PREPARATION status are selected by client for packing and
-- should not count towards warehouse space usage.

CREATE OR REPLACE FUNCTION update_client_warehouse_capacity(client_id TEXT)
RETURNS VOID AS $$
DECLARE
    total_volume NUMERIC := 0;
    client_limit NUMERIC;
BEGIN
    -- Calculate total volume from packages linked to warehouse orders
    -- Exclude orders with status IN_PREPARATION (selected for packing)
    SELECT COALESCE(SUM(p."volumeCbm"), 0)
    INTO total_volume
    FROM "Package" p
    INNER JOIN "WarehouseOrder" wo ON p."warehouseOrderId" = wo.id
    WHERE wo."clientId" = client_id
      AND wo.status != 'IN_PREPARATION'  -- Exclude orders selected for packing
      AND wo.status != 'SHIPPED'         -- Exclude shipped orders
      AND wo.status != 'DELIVERED';     -- Exclude delivered orders

    -- Get client's limit from WarehouseCapacity or Plan
    SELECT COALESCE(
        (SELECT "limitCbm" FROM "WarehouseCapacity" WHERE "clientId" = client_id),
        (SELECT "spaceLimitCbm" FROM "Plan" p
         INNER JOIN "Client" c ON c."planId" = p.id
         WHERE c.id = client_id),
        0
    ) INTO client_limit;

    -- Update or insert WarehouseCapacity record
    INSERT INTO "WarehouseCapacity" ("id", "clientId", "usedCbm", "limitCbm", "createdAt", "updatedAt")
    VALUES (
        'cap' || substr(md5(random()::text || clock_timestamp()::text), 1, 22),
        client_id,
        total_volume,
        client_limit,
        NOW(),
        NOW()
    )
    ON CONFLICT ("clientId")
    DO UPDATE SET
        "usedCbm" = total_volume,
        "limitCbm" = COALESCE(EXCLUDED."limitCbm", "WarehouseCapacity"."limitCbm"),
        "updatedAt" = NOW();

    -- Update Client table with usage percentage
    UPDATE "Client"
    SET 
        "usedCbm" = total_volume,
        "limitCbm" = COALESCE(client_limit, "limitCbm"),
        "spaceUsagePct" = CASE 
            WHEN client_limit > 0 THEN ROUND((total_volume / client_limit) * 100)
            ELSE 0
        END
    WHERE id = client_id;
END;
$$ LANGUAGE plpgsql;

