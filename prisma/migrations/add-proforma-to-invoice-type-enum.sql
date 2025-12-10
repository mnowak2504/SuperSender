-- Migration: Add PROFORMA to InvoiceType enum
-- Date: 2025-12-10
-- 
-- This adds PROFORMA value to the InvoiceType enum in PostgreSQL
-- Subscription invoices are now stored as PROFORMA type

-- Add PROFORMA to InvoiceType enum
ALTER TYPE "InvoiceType" ADD VALUE IF NOT EXISTS 'PROFORMA';

