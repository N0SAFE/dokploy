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
import { schedules } from "./schedule";
import { server } from "./server";
import { applicationStatus, certificateType, triggerType } from "./shared";
import { sshKeys } from "./ssh-key";
import { generateAppName } from "./utils";

export const sourceTypeMonorepo = pgEnum("sourceTypeMonorepo", [
	"git",
	"github",
	"gitlab",
	"bitbucket",
	"gitea",
	"raw",
]);

export const deploymentType = pgEnum("deploymentType", [
	"dockerfile",
	"docker-compose",
	"command",
]);

export interface MonorepoService {
	id: string;
	name: string;
	appName: string;
	description?: string;
	port?: number;
	domains?: string[];
	env?: string;
	dockerfile?: string;
	dockerContextPath?: string;
	dockerBuildStage?: string;
	buildPath?: string;
	command?: string;
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
	deploymentType: deploymentType("deploymentType")
		.notNull()
		.default("dockerfile"),

	// Dockerfile configuration
	dockerfile: text("dockerfile"),
	dockerContextPath: text("dockerContextPath"),
	dockerBuildStage: text("dockerBuildStage"),
	buildPath: text("buildPath").default("/"),

	// Docker Compose configuration
	composeFile: text("composeFile").default(""),
	composePath: text("composePath").default("./docker-compose.yml"),

	// Command configuration
	command: text("command").default(""),

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

	// Services configuration for multiple services in monorepo
	servicesConfig: json("servicesConfig").$type<MonorepoServicesConfig>().default({
		services: []
	}),

	// Git provider fields
	repository: text("repository"),
	owner: text("owner"),
	branch: text("branch"),
	autoDeploy: boolean("autoDeploy").$defaultFn(() => true),
	watchPaths: text("watchPaths").array(),
	enableSubmodules: boolean("enableSubmodules").notNull().default(false),

	// Gitlab
	gitlabProjectId: integer("gitlabProjectId"),
	gitlabRepository: text("gitlabRepository"),
	gitlabOwner: text("gitlabOwner"),
	gitlabBranch: text("gitlabBranch"),
	gitlabPathNamespace: text("gitlabPathNamespace"),

	// Bitbucket
	bitbucketRepository: text("bitbucketRepository"),
	bitbucketOwner: text("bitbucketOwner"),
	bitbucketBranch: text("bitbucketBranch"),

	// Gitea
	giteaRepository: text("giteaRepository"),
	giteaOwner: text("giteaOwner"),
	giteaBranch: text("giteaBranch"),

	// Git
	customGitUrl: text("customGitUrl"),
	customGitBranch: text("customGitBranch"),
	customGitSSHKeyId: text("customGitSSHKeyId").references(
		() => sshKeys.sshKeyId,
		{
			onDelete: "set null",
		},
	),

	triggerType: triggerType("triggerType").default("push"),
	monorepoStatus: applicationStatus("monorepoStatus").notNull().default("idle"),
	projectId: text("projectId")
		.notNull()
		.references(() => projects.projectId, { onDelete: "cascade" }),
	createdAt: text("createdAt")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
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
	backups: many(backups),
	schedules: many(schedules),
	previewDeployments: many(previewDeployments),
}));

const MonorepoServiceSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Service name is required"),
	appName: z.string().min(1, "App name is required"),
	description: z.string().optional(),
	port: z.number().int().min(1).max(65535).optional(),
	domains: z.array(z.string()).optional(),
	env: z.string().optional(),
	dockerfile: z.string().optional(),
	dockerContextPath: z.string().optional(),
	dockerBuildStage: z.string().optional(),
	buildPath: z.string().optional(),
	command: z.string().optional(),
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
	command: z.string().optional(),
	dockerfile: z.string().optional(),
	composeFile: z.string().optional(),
	composePath: z.string().min(1),
	deploymentType: z
		.enum(["dockerfile", "docker-compose", "command"])
		.optional(),
	watchPaths: z.array(z.string()).optional(),
	previewPort: z.number().optional(),
	previewEnv: z.string().optional(),
	previewBuildArgs: z.string().optional(),
	previewWildcard: z.string().optional(),
	previewLimit: z.number().optional(),
	previewHttps: z.boolean().optional(),
	previewPath: z.string().optional(),
	previewCertificateType: z.enum(["letsencrypt", "none", "custom"]).optional(),
	previewRequireCollaboratorPermissions: z.boolean().optional(),
	servicesConfig: MonorepoServicesConfigSchema.optional(),
});

export const apiCreateMonorepo = createSchema.pick({
	name: true,
	description: true,
	projectId: true,
	deploymentType: true,
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

export { MonorepoServiceSchema, MonorepoServicesConfigSchema };
