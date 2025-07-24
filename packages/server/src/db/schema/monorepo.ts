import { relations } from "drizzle-orm";
import { boolean, integer, json, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { backups } from "./backups";
import { bitbucket } from "./bitbucket";
import { deployments } from "./deployment";
import { domains } from "./domain";
import { gitea } from "./gitea";
import { github } from "./github";
import { gitlab } from "./gitlab";
import { mounts } from "./mount";
import { previewDeployments } from "./preview-deployments";
import { projects } from "./project";
import { registry } from "./registry";
import { schedules } from "./schedule";
import { server } from "./server";
import { applicationStatus, certificateType, triggerType } from "./shared";
import { sshKeys } from "./ssh-key";
import { generateAppName } from "./utils";

export const sourceTypeMonorepo = pgEnum("sourceTypeMonorepo", [
	"docker",
	"git",
	"github",
	"gitlab",
	"bitbucket",
	"gitea",
	"drop",
]);

export const buildTypeMonorepo = pgEnum("buildTypeMonorepo", [
	"dockerfile",
	"heroku_buildpacks",
	"paketo_buildpacks",
	"nixpacks",
	"static",
	"railpack",
]);

export interface MonorepoService {
	id: string;
	name: string;
	appName: string;
	description?: string;
	env?: string;
	buildType: string; // dockerfile, heroku_buildpacks, paketo_buildpacks, nixpacks, static, railpack
	// Dockerfile specific
	dockerfile?: string;
	dockerContextPath?: string;
	dockerBuildStage?: string;
	buildPath?: string;
	// Heroku buildpack specific
	herokuVersion?: string;
	// Static specific
	publishDirectory?: string;
	isStaticSpa?: boolean;
	// Command specific (for custom builds)
	command?: string;
	// Health check
	healthCheckPath?: string;
	enabled: boolean;
}

export interface MonorepoServicesConfig {
	services: MonorepoService[];
}

export const monorepo = pgTable("monorepo", {
	monorepoId: text("monorepoId")
		.notNull()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	appName: text("appName")
		.notNull()
		.$defaultFn(() => generateAppName("monorepo")),
	description: text("description"),
	env: text("env"),
	refreshToken: text("refreshToken").$defaultFn(() => nanoid()),
	webhookToken: text("webhookToken").$defaultFn(() => nanoid()),
	sourceType: sourceTypeMonorepo("sourceType").notNull().default("github"),

	// Services configuration for multiple services in monorepo
	servicesConfig: json("servicesConfig").$type<MonorepoServicesConfig>().default({
		services: []
	}),

	// Docker Provider
	username: text("username"),
	password: text("password"),
	dockerImage: text("dockerImage"),
	registryUrl: text("registryUrl"),

	// Git Provider (common fields)
	repository: text("repository"),
	owner: text("owner"),
	branch: text("branch"),
	buildPath: text("buildPath").default("/"),
	triggerType: triggerType("triggerType").default("push"),
	autoDeploy: boolean("autoDeploy").$defaultFn(() => true),
	watchPaths: text("watchPaths").array(),
	enableSubmodules: boolean("enableSubmodules").notNull().default(false),

	// Git custom provider
	customGitUrl: text("customGitUrl"),
	customGitBranch: text("customGitBranch"),
	customGitBuildPath: text("customGitBuildPath"),
	customGitSSHKeyId: text("customGitSSHKeyId").references(
		() => sshKeys.sshKeyId,
		{
			onDelete: "set null",
		},
	),

	// Gitlab
	gitlabProjectId: integer("gitlabProjectId"),
	gitlabRepository: text("gitlabRepository"),
	gitlabOwner: text("gitlabOwner"),
	gitlabBranch: text("gitlabBranch"),
	gitlabBuildPath: text("gitlabBuildPath").default("/"),
	gitlabPathNamespace: text("gitlabPathNamespace"),

	// Bitbucket
	bitbucketRepository: text("bitbucketRepository"),
	bitbucketOwner: text("bitbucketOwner"),
	bitbucketBranch: text("bitbucketBranch"),
	bitbucketBuildPath: text("bitbucketBuildPath").default("/"),

	// Gitea
	giteaRepository: text("giteaRepository"),
	giteaOwner: text("giteaOwner"),
	giteaBranch: text("giteaBranch"),
	giteaBuildPath: text("giteaBuildPath").default("/"),

	// Drop (file upload) specific
	dropBuildPath: text("dropBuildPath"),

	// Preview deployment settings
	isPreviewDeploymentsActive: boolean("isPreviewDeploymentsActive").default(
		false,
	),
	previewWildcard: text("previewWildcard"),
	previewPort: integer("previewPort").default(3000),
	previewHttps: boolean("previewHttps").notNull().default(false),
	previewPath: text("previewPath").default("/"),
	previewCertificateType: certificateType("previewCertificateType")
		.notNull()
		.default("none"),
	previewCustomCertResolver: text("previewCustomCertResolver"),
	previewLimit: integer("previewLimit").default(3),
	previewEnv: text("previewEnv"),
	previewBuildArgs: text("previewBuildArgs"),
	previewRequireCollaboratorPermissions: boolean(
		"previewRequireCollaboratorPermissions",
	).default(true),
	monorepoStatus: applicationStatus("monorepoStatus").notNull().default("idle"),
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
	registryId: text("registryId").references(() => registry.registryId, {
		onDelete: "set null",
	}),
	projectId: text("projectId")
		.notNull()
		.references(() => projects.projectId, { onDelete: "cascade" }),
	githubId: text("githubId").references(() => github.githubId, {
		onDelete: "set null",
	}),
	gitlabId: text("gitlabId").references(() => gitlab.gitlabId, {
		onDelete: "set null",
	}),
	bitbucketId: text("bitbucketId").references(() => bitbucket.bitbucketId, {
		onDelete: "set null",
	}),
	giteaId: text("giteaId").references(() => gitea.giteaId, {
		onDelete: "set null",
	}),
	serverId: text("serverId").references(() => server.serverId, {
		onDelete: "cascade",
	}),
});

export const monorepoRelations = relations(monorepo, ({ one, many }) => ({
	project: one(projects, {
		fields: [monorepo.projectId],
		references: [projects.projectId],
	}),
	deployments: many(deployments),
	mounts: many(mounts),
	customGitSSHKey: one(sshKeys, {
		fields: [monorepo.customGitSSHKeyId],
		references: [sshKeys.sshKeyId],
	}),
	domains: many(domains),
	github: one(github, {
		fields: [monorepo.githubId],
		references: [github.githubId],
	}),
	gitlab: one(gitlab, {
		fields: [monorepo.gitlabId],
		references: [gitlab.gitlabId],
	}),
	bitbucket: one(bitbucket, {
		fields: [monorepo.bitbucketId],
		references: [bitbucket.bitbucketId],
	}),
	gitea: one(gitea, {
		fields: [monorepo.giteaId],
		references: [gitea.giteaId],
	}),
	server: one(server, {
		fields: [monorepo.serverId],
		references: [server.serverId],
	}),
	registry: one(registry, {
		fields: [monorepo.registryId],
		references: [registry.registryId],
	}),
	backups: many(backups),
	schedules: many(schedules),
	previewDeployments: many(previewDeployments),
}));

const MonorepoServiceSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Service name is required"),
	appName: z.string().min(1, "App name is required"),
	description: z.string().optional(),
	env: z.string().optional(),
	buildType: z.enum([
		"dockerfile",
		"heroku_buildpacks",
		"paketo_buildpacks",
		"nixpacks",
		"static",
		"railpack",
	]).default("nixpacks"),
	// Dockerfile specific
	dockerfile: z.string().optional(),
	dockerContextPath: z.string().optional(),
	dockerBuildStage: z.string().optional(),
	buildPath: z.string().optional(),
	// Heroku buildpack specific
	herokuVersion: z.string().optional(),
	// Static specific
	publishDirectory: z.string().optional(),
	isStaticSpa: z.boolean().optional(),
	// Command specific (for custom builds)
	command: z.string().optional(),
	// Health check
	healthCheckPath: z.string().optional(),
	enabled: z.boolean().default(true),
});

const MonorepoServicesConfigSchema = z.object({
	services: z.array(MonorepoServiceSchema),
});

const createSchema = createInsertSchema(monorepo, {
	name: z.string().min(1),
	description: z.string().optional(),
	env: z.string().optional(),
	projectId: z.string(),
	customGitSSHKeyId: z.string().optional(),
	servicesConfig: MonorepoServicesConfigSchema.optional(),
	sourceType: z
		.enum(["github", "docker", "git", "gitlab", "bitbucket", "gitea", "drop"])
		.optional(),
	// Docker provider
	dockerImage: z.string().optional(),
	username: z.string().optional(),
	password: z.string().optional(),
	registryUrl: z.string().optional(),
	// Git provider fields
	repository: z.string().optional(),
	owner: z.string().optional(),
	branch: z.string().optional(),
	buildPath: z.string().optional(),
	watchPaths: z.array(z.string()).optional(),
	enableSubmodules: z.boolean().optional(),
	// Custom git
	customGitUrl: z.string().optional(),
	customGitBranch: z.string().optional(),
	customGitBuildPath: z.string().optional(),
	// Gitlab
	gitlabRepository: z.string().optional(),
	gitlabOwner: z.string().optional(),
	gitlabBranch: z.string().optional(),
	gitlabBuildPath: z.string().optional(),
	gitlabProjectId: z.number().optional(),
	gitlabPathNamespace: z.string().optional(),
	// Bitbucket
	bitbucketRepository: z.string().optional(),
	bitbucketOwner: z.string().optional(),
	bitbucketBranch: z.string().optional(),
	bitbucketBuildPath: z.string().optional(),
	// Gitea
	giteaRepository: z.string().optional(),
	giteaOwner: z.string().optional(),
	giteaBranch: z.string().optional(),
	giteaBuildPath: z.string().optional(),
	// Drop
	dropBuildPath: z.string().optional(),
	// Preview settings
	previewPort: z.number().optional(),
	previewEnv: z.string().optional(),
	previewBuildArgs: z.string().optional(),
	previewWildcard: z.string().optional(),
	previewLimit: z.number().optional(),
	previewHttps: z.boolean().optional(),
	previewPath: z.string().optional(),
	previewCertificateType: z.enum(["letsencrypt", "none", "custom"]).optional(),
	previewRequireCollaboratorPermissions: z.boolean().optional(),
});

export const apiCreateMonorepo = createSchema.pick({
	name: true,
	description: true,
	projectId: true,
	appName: true,
	serverId: true,
});

export const apiFindMonorepo = z.object({
	monorepoId: z.string().min(1),
});

export const apiDeleteMonorepo = z.object({
	monorepoId: z.string().min(1),
	deleteVolumes: z.boolean(),
});

export const apiUpdateMonorepo = createSchema
	.partial()
	.extend({
		monorepoId: z.string(),
	})
	.omit({ serverId: true });

export const apiRandomizeMonorepo = createSchema
	.pick({
		monorepoId: true,
	})
	.extend({
		monorepoId: z.string().min(1),
	});

export const apiUpdateMonorepoServices = z.object({
	monorepoId: z.string().min(1),
	servicesConfig: MonorepoServicesConfigSchema,
});

// Provider-specific APIs (similar to applications)
export const apiSaveGithubProviderMonorepo = createSchema
	.pick({
		monorepoId: true,
		repository: true,
		branch: true,
		owner: true,
		buildPath: true,
		githubId: true,
		watchPaths: true,
		enableSubmodules: true,
	})
	.required()
	.extend({
		monorepoId: z.string().min(1),
		triggerType: z.enum(["push", "tag"]).default("push"),
	});

export const apiSaveGitlabProviderMonorepo = createSchema
	.pick({
		monorepoId: true,
		gitlabBranch: true,
		gitlabBuildPath: true,
		gitlabOwner: true,
		gitlabRepository: true,
		gitlabId: true,
		gitlabProjectId: true,
		gitlabPathNamespace: true,
		watchPaths: true,
		enableSubmodules: true,
	})
	.required()
	.extend({
		monorepoId: z.string().min(1),
	});

export const apiSaveBitbucketProviderMonorepo = createSchema
	.pick({
		bitbucketBranch: true,
		bitbucketBuildPath: true,
		bitbucketOwner: true,
		bitbucketRepository: true,
		bitbucketId: true,
		monorepoId: true,
		watchPaths: true,
		enableSubmodules: true,
	})
	.required();

export const apiSaveGiteaProviderMonorepo = createSchema
	.pick({
		monorepoId: true,
		giteaBranch: true,
		giteaBuildPath: true,
		giteaOwner: true,
		giteaRepository: true,
		giteaId: true,
		watchPaths: true,
		enableSubmodules: true,
	})
	.required();

export const apiSaveDockerProviderMonorepo = createSchema
	.pick({
		dockerImage: true,
		monorepoId: true,
		username: true,
		password: true,
		registryUrl: true,
	})
	.required();

export const apiSaveGitProviderMonorepo = createSchema
	.pick({
		customGitBranch: true,
		monorepoId: true,
		customGitBuildPath: true,
		customGitUrl: true,
		watchPaths: true,
		enableSubmodules: true,
	})
	.required()
	.merge(
		createSchema.pick({
			customGitSSHKeyId: true,
		}),
	);

export const apiSaveDropProviderMonorepo = createSchema
	.pick({
		monorepoId: true,
		dropBuildPath: true,
	})
	.required();

export { MonorepoServiceSchema, MonorepoServicesConfigSchema };
