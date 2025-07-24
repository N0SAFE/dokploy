import { db } from "@dokploy/server/db";
import {
	type apiCreateMonorepo,
	buildAppName,
	cleanAppName,
	monorepo,
} from "@dokploy/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, not } from "drizzle-orm";
import { createDeploymentMonorepo } from "./deployment";

export type Monorepo = typeof monorepo.$inferSelect;

export const createMonorepo = async (input: typeof apiCreateMonorepo._type) => {
	const newMonorepo = await db
		.insert(monorepo)
		.values({
			...input,
		})
		.returning()
		.then((value) => value[0]);

	if (!newMonorepo) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Error creating the monorepo",
		});
	}

	return newMonorepo;
};

export const findMonorepoById = async (monorepoId: string) => {
	const foundMonorepo = await db.query.monorepo.findFirst({
		where: eq(monorepo.monorepoId, monorepoId),
		with: {
			project: true,
			deployments: true,
			domains: true,
			mounts: true,
			customGitSSHKey: true,
			github: true,
			gitlab: true,
			bitbucket: true,
			gitea: true,
			server: true,
			previewDeployments: true,
		},
	});
	if (!foundMonorepo) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Monorepo not found",
		});
	}
	return foundMonorepo;
};

export const updateMonorepoById = async (
	monorepoId: string,
	monorepoData: Partial<Monorepo>,
) => {
	const result = await db
		.update(monorepo)
		.set({
			...monorepoData,
		})
		.where(eq(monorepo.monorepoId, monorepoId))
		.returning();

	return result[0];
};

export const findMonorepoByAppName = async (appName: string) => {
	const foundMonorepo = await db.query.monorepo.findFirst({
		where: eq(monorepo.appName, appName),
		with: {
			project: true,
			domains: true,
			mounts: true,
			deployments: true,
			github: true,
			gitlab: true,
			bitbucket: true,
			gitea: true,
			server: true,
		},
	});
	if (!foundMonorepo) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Monorepo not found",
		});
	}
	return foundMonorepo;
};

export const removeMonorepoById = async (monorepoId: string) => {
	const result = await db
		.delete(monorepo)
		.where(eq(monorepo.monorepoId, monorepoId))
		.returning();

	return result[0];
};

export const updateMonorepoToken = async (
	monorepoId: string,
	webhookToken: string,
) => {
	const result = await db
		.update(monorepo)
		.set({
			webhookToken,
		})
		.where(eq(monorepo.monorepoId, monorepoId))
		.returning();

	return result[0];
};

export const findMonoreposByProjectId = async (projectId: string) => {
	const monorepos = await db.query.monorepo.findMany({
		where: eq(monorepo.projectId, projectId),
		with: {
			project: true,
			domains: true,
			deployments: true,
		},
	});
	return monorepos;
};

export const findMonorepoByRefreshToken = async (refreshToken: string) => {
	const foundMonorepo = await db.query.monorepo.findFirst({
		where: eq(monorepo.refreshToken, refreshToken),
		with: {
			project: true,
			domains: true,
			mounts: true,
			deployments: true,
			github: true,
			gitlab: true,
			bitbucket: true,
			gitea: true,
			server: true,
		},
	});
	if (!foundMonorepo) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Monorepo not found",
		});
	}
	return foundMonorepo;
};

export const findMonorepoByWebhookToken = async (webhookToken: string) => {
	const foundMonorepo = await db.query.monorepo.findFirst({
		where: eq(monorepo.webhookToken, webhookToken),
		with: {
			project: true,
			domains: true,
			mounts: true,
			deployments: true,
			github: true,
			gitlab: true,
			bitbucket: true,
			gitea: true,
			server: true,
		},
	});
	if (!foundMonorepo) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Monorepo not found",
		});
	}
	return foundMonorepo;
};

export const apiFindAllByProject = async (projectId: string) => {
	const monorepos = await db.query.monorepo.findMany({
		where: eq(monorepo.projectId, projectId),
		with: {
			domains: true,
			project: true,
		},
	});
	return monorepos;
};

export const updateAppNameByMonorepoId = async (
	monorepoId: string,
	newAppName: string,
) => {
	const cleanedAppName = cleanAppName(newAppName) || "monorepo";
	const finalAppName = buildAppName("monorepo", cleanedAppName);

	const monorepoExists = await db.query.monorepo.findFirst({
		where: and(
			eq(monorepo.appName, finalAppName),
			not(eq(monorepo.monorepoId, monorepoId)),
		),
	});

	if (monorepoExists) {
		throw new TRPCError({
			code: "CONFLICT",
			message: "Monorepo with this app name already exists",
		});
	}

	const result = await db
		.update(monorepo)
		.set({
			appName: finalAppName,
		})
		.where(eq(monorepo.monorepoId, monorepoId))
		.returning();

	return result[0];
};

// Deployment functions
export const deployMonorepo = async ({
	monorepoId,
	titleLog = "Manual deployment",
	descriptionLog = "",
}: {
	monorepoId: string;
	titleLog: string;
	descriptionLog: string;
}) => {
	const monorepoItem = await findMonorepoById(monorepoId);

	const deployment = await createDeploymentMonorepo({
		monorepoId: monorepoId,
		title: titleLog,
		description: descriptionLog,
	});

	try {
		await updateMonorepoById(monorepoId, {
			monorepoStatus: "running",
		});

		// Deploy based on source type and services configuration
		switch (monorepoItem.sourceType) {
			case "docker":
				await deployMonorepoDocker(monorepoItem, deployment.logPath);
				break;
			case "git":
			case "github":
			case "gitlab":
			case "bitbucket":
			case "gitea":
			case "drop":
				await deployMonorepoFromSource(monorepoItem, deployment.logPath);
				break;
			default:
				throw new Error(
					`Unsupported source type: ${monorepoItem.sourceType}`,
				);
		}

		await updateMonorepoById(monorepoId, {
			monorepoStatus: "done",
		});
	} catch (error) {
		await updateMonorepoById(monorepoId, {
			monorepoStatus: "error",
		});
		throw error;
	}
};

export const rebuildMonorepo = async ({
	monorepoId,
	titleLog = "Manual rebuild",
	descriptionLog = "",
}: {
	monorepoId: string;
	titleLog: string;
	descriptionLog: string;
}) => {
	// For now, rebuilding is the same as deploying
	return await deployMonorepo({
		monorepoId,
		titleLog,
		descriptionLog,
	});
};

// Deployment type specific functions
const deployMonorepoDocker = async (
	monorepoItem: Monorepo,
	logPath: string,
) => {
	// TODO: Implement docker-based deployment
	// This would handle docker image deployment for monorepo
	throw new Error("Docker deployment not yet implemented");
};

const deployMonorepoFromSource = async (
	monorepoItem: Monorepo,
	logPath: string,
) => {
	// TODO: Implement source-based deployment
	// This would handle git-based deployment for monorepo services
	// Each service in servicesConfig would be built according to its buildType
	throw new Error("Source-based deployment not yet implemented");
};

// Remote deployment functions (for multi-server setups)
export const deployRemoteMonorepo = async ({
	monorepoId,
	titleLog = "Manual deployment",
	descriptionLog = "",
}: {
	monorepoId: string;
	titleLog: string;
	descriptionLog: string;
}) => {
	// TODO: Implement remote deployment similar to deployRemoteApplication
	throw new Error("Remote monorepo deployment not yet implemented");
};

export const rebuildRemoteMonorepo = async ({
	monorepoId,
	titleLog = "Manual rebuild",
	descriptionLog = "",
}: {
	monorepoId: string;
	titleLog: string;
	descriptionLog: string;
}) => {
	// TODO: Implement remote rebuild similar to rebuildRemoteApplication
	throw new Error("Remote monorepo rebuild not yet implemented");
};

// Preview deployment functions
export const deployPreviewMonorepo = async ({
	monorepoId,
	titleLog = "Preview deployment",
	descriptionLog = "",
	previewDeploymentId,
}: {
	monorepoId: string;
	titleLog: string;
	descriptionLog: string;
	previewDeploymentId: string;
}) => {
	// TODO: Implement preview deployment for monorepo
	throw new Error("Monorepo preview deployment not yet implemented");
};

export const deployRemotePreviewMonorepo = async ({
	monorepoId,
	titleLog = "Preview deployment",
	descriptionLog = "",
	previewDeploymentId,
}: {
	monorepoId: string;
	titleLog: string;
	descriptionLog: string;
	previewDeploymentId: string;
}) => {
	// TODO: Implement remote preview deployment for monorepo
	throw new Error("Remote monorepo preview deployment not yet implemented");
};

// Import needed for the not function
// (already imported above)
