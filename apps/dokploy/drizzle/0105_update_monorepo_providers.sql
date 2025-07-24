-- Update sourceTypeMonorepo enum to include docker and drop
ALTER TYPE "public"."sourceTypeMonorepo" ADD VALUE IF NOT EXISTS 'docker';--> statement-breakpoint
ALTER TYPE "public"."sourceTypeMonorepo" ADD VALUE IF NOT EXISTS 'drop';--> statement-breakpoint

-- Remove the old deploymentType enum if it exists and create buildTypeMonorepo
CREATE TYPE "public"."buildTypeMonorepo" AS ENUM('dockerfile', 'heroku_buildpacks', 'paketo_buildpacks', 'nixpacks', 'static', 'railpack');--> statement-breakpoint

-- Add new columns for providers to monorepo table
ALTER TABLE "monorepo" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "dockerImage" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "registryUrl" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "customGitBuildPath" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "gitlabBuildPath" text DEFAULT '/';--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "bitbucketBuildPath" text DEFAULT '/';--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "giteaBuildPath" text DEFAULT '/';--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "dropBuildPath" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD COLUMN "registryId" text;--> statement-breakpoint

-- Drop old deploymentType specific columns that are now handled per service
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "dockerfile";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "dockerContextPath";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "dockerBuildStage";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "composeFile";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "composePath";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "command";--> statement-breakpoint
ALTER TABLE "monorepo" DROP COLUMN IF EXISTS "deploymentType";--> statement-breakpoint

-- Add foreign key for registry
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_registryId_registry_registryId_fk" FOREIGN KEY ("registryId") REFERENCES "public"."registry"("registryId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint