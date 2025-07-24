-- Add servicesConfig column to monorepo table for multiple services management
ALTER TABLE "monorepo" ADD COLUMN "servicesConfig" json DEFAULT '{"services":[]}';