CREATE TYPE "public"."deploymentType" AS ENUM('dockerfile', 'docker-compose', 'command');--> statement-breakpoint
CREATE TYPE "public"."sourceTypeMonorepo" AS ENUM('git', 'github', 'gitlab', 'bitbucket', 'gitea', 'raw');--> statement-breakpoint
ALTER TYPE "public"."serviceType" ADD VALUE 'monorepo';--> statement-breakpoint
CREATE TABLE "monorepo" (
	"monorepoId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"description" text,
	"env" text,
	"refreshToken" text,
	"webhookToken" text,
	"sourceType" "sourceTypeMonorepo" DEFAULT 'github' NOT NULL,
	"deploymentType" "deploymentType" DEFAULT 'dockerfile' NOT NULL,
	"dockerfile" text,
	"dockerContextPath" text,
	"dockerBuildStage" text,
	"buildPath" text DEFAULT '/',
	"composeFile" text DEFAULT '',
	"composePath" text DEFAULT './docker-compose.yml',
	"command" text DEFAULT '',
	"isPreviewDeploymentsActive" boolean DEFAULT false,
	"previewWildcard" text,
	"previewPort" integer DEFAULT 3000,
	"previewHttps" boolean DEFAULT false NOT NULL,
	"previewPath" text DEFAULT '/',
	"previewCertificateType" "certificateType" DEFAULT 'none' NOT NULL,
	"previewCustomCertResolver" text,
	"previewLimit" integer DEFAULT 3,
	"previewEnv" text,
	"previewBuildArgs" text,
	"previewRequireCollaboratorPermissions" boolean DEFAULT true,
	"repository" text,
	"owner" text,
	"branch" text,
	"autoDeploy" boolean,
	"watchPaths" text[],
	"enableSubmodules" boolean DEFAULT false NOT NULL,
	"gitlabProjectId" integer,
	"gitlabRepository" text,
	"gitlabOwner" text,
	"gitlabBranch" text,
	"gitlabPathNamespace" text,
	"bitbucketRepository" text,
	"bitbucketOwner" text,
	"bitbucketBranch" text,
	"giteaRepository" text,
	"giteaOwner" text,
	"giteaBranch" text,
	"customGitUrl" text,
	"customGitBranch" text,
	"customGitSSHKeyId" text,
	"triggerType" "triggerType" DEFAULT 'push',
	"monorepoStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"projectId" text NOT NULL,
	"createdAt" text NOT NULL,
	"githubId" text,
	"gitlabId" text,
	"bitbucketId" text,
	"giteaId" text,
	"serverId" text
);
--> statement-breakpoint
ALTER TABLE "preview_deployments" ALTER COLUMN "applicationId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deployment" ADD COLUMN "monorepoId" text;--> statement-breakpoint
ALTER TABLE "mount" ADD COLUMN "monorepoId" text;--> statement-breakpoint
ALTER TABLE "preview_deployments" ADD COLUMN "monorepoId" text;--> statement-breakpoint
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_customGitSSHKeyId_ssh-key_sshKeyId_fk" FOREIGN KEY ("customGitSSHKeyId") REFERENCES "public"."ssh-key"("sshKeyId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_githubId_github_githubId_fk" FOREIGN KEY ("githubId") REFERENCES "public"."github"("githubId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_gitlabId_gitlab_gitlabId_fk" FOREIGN KEY ("gitlabId") REFERENCES "public"."gitlab"("gitlabId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_bitbucketId_bitbucket_bitbucketId_fk" FOREIGN KEY ("bitbucketId") REFERENCES "public"."bitbucket"("bitbucketId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_giteaId_gitea_giteaId_fk" FOREIGN KEY ("giteaId") REFERENCES "public"."gitea"("giteaId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monorepo" ADD CONSTRAINT "monorepo_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_monorepoId_monorepo_monorepoId_fk" FOREIGN KEY ("monorepoId") REFERENCES "public"."monorepo"("monorepoId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_monorepoId_monorepo_monorepoId_fk" FOREIGN KEY ("monorepoId") REFERENCES "public"."monorepo"("monorepoId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_deployments" ADD CONSTRAINT "preview_deployments_monorepoId_monorepo_monorepoId_fk" FOREIGN KEY ("monorepoId") REFERENCES "public"."monorepo"("monorepoId") ON DELETE cascade ON UPDATE no action;