-- Update sourceTypeMonorepo enum to include docker and drop
ALTER TYPE "public"."sourceTypeMonorepo" ADD VALUE IF NOT EXISTS 'docker';--> statement-breakpoint
ALTER TYPE "public"."sourceTypeMonorepo" ADD VALUE IF NOT EXISTS 'drop';--> statement-breakpoint

-- Create buildTypeMonorepo enum (used by the schema but not directly in monorepo table anymore)
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

-- Drop old deploymentType specific columns that are now handled per service
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "dockerfile";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "dockerContextPath";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "dockerBuildStage";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "composeFile";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "composePath";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "command";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "deploymentType";--> statement-breakpoint

-- Add foreign key for registry (ignore if already exists)
DO $$ BEGIN
    ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_registryId_registry_registryId_fk" FOREIGN KEY ("registryId") REFERENCES "public"."registry"("registryId") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint