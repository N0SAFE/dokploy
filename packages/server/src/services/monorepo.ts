import { db } from "@dokploy/server/db";
import {
	type apiCreateMonorepo,
	buildAppName,
	cleanAppName,
	monorepo,
} from "@dokploy/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

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
	const { cleanedAppName } = cleanAppName(newAppName);
	const { appName } = buildAppName(cleanedAppName, "monorepo");

	const monorepoExists = await db.query.monorepo.findFirst({
		where: and(
			eq(monorepo.appName, appName),
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
			appName,
		})
		.where(eq(monorepo.monorepoId, monorepoId))
		.returning();

	return result[0];
};

// Import needed for the not function
import { not } from "drizzle-orm";