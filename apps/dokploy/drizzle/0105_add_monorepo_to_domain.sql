-- Add 'monorepo' value to domainType enum
ALTER TYPE "domainType" ADD VALUE IF NOT EXISTS 'monorepo';

-- Add monorepoId column to domain table (nullable)
ALTER TABLE "domain" ADD COLUMN IF NOT EXISTS "monorepoId" text;

-- Add foreign key constraint to monorepoId
ALTER TABLE "domain"
  ADD CONSTRAINT "domain_monorepoId_monorepo_monorepoId_fk"
  FOREIGN KEY ("monorepoId") REFERENCES "monorepo"("monorepoId") ON DELETE CASCADE;
