-- Fix monorepo provider columns with proper case handling
-- This migration ensures all monorepo provider columns are present with correct naming

-- Create buildTypeMonorepo enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."buildTypeMonorepo" AS ENUM('dockerfile', 'heroku_buildpacks', 'paketo_buildpacks', 'nixpacks', 'static', 'railpack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Add new columns for providers to monorepo table with proper case
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "username" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "password" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "dockerImage" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "registryUrl" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "customGitBuildPath" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "gitlabBuildPath" text DEFAULT '/';--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "bitbucketBuildPath" text DEFAULT '/';--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "giteaBuildPath" text DEFAULT '/';--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "dropBuildPath" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN IF NOT EXISTS "registryId" text;--> statement-breakpoint

-- Add foreign key for registry (ignore if already exists)
DO $$ BEGIN
    ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_registryId_registry_registryId_fk" FOREIGN KEY ("registryId") REFERENCES "public"."registry"("registryId") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
