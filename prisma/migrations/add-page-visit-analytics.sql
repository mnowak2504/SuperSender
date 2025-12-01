-- Add PageVisit model for analytics tracking

CREATE TABLE IF NOT EXISTS "PageVisit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "language" TEXT,
    "country" TEXT,
    "countryName" TEXT,
    "city" TEXT,
    "region" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "timeOnPage" INTEGER,
    "scrollDepth" DOUBLE PRECISION,
    "viewportWidth" INTEGER,
    "viewportHeight" INTEGER,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "isUnique" BOOLEAN NOT NULL DEFAULT true,
    "visitedSections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "PageVisit_country_idx" ON "PageVisit"("country");
CREATE INDEX IF NOT EXISTS "PageVisit_createdAt_idx" ON "PageVisit"("createdAt");
CREATE INDEX IF NOT EXISTS "PageVisit_sessionId_idx" ON "PageVisit"("sessionId");
CREATE INDEX IF NOT EXISTS "PageVisit_pagePath_idx" ON "PageVisit"("pagePath");

