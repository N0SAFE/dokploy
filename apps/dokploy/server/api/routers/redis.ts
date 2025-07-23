import {
	addNewService,
	checkServiceAccess,
	createMount,
	createRedis,
	deployRedis,
	findProjectById,
	findRedisById,
	IS_CLOUD,
	prepareEnvironmentVariables,
	rebuildDatabase,
	removeRedisById,
	removeService,
	startService,
	startServiceRemote,
	stopService,
	stopServiceRemote,
	updateRedisById,
} from "@dokploy/server";
import {
	createApplicationContext,
	createDetailedServicesFromProject,
	EnvVariableGenerator,
} from "@dokploy/server/utils/env-generator/env-generator";

import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import {
	apiChangeRedisStatus,
	apiCreateRedis,
	apiDeployRedis,
	apiFindOneRedis,
	apiRebuildRedis,
	apiResetRedis,
	apiSaveEnvironmentVariablesRedis,
	apiSaveExternalPortRedis,
	apiUpdateRedis,
	redis as redisTable,
} from "@/server/db/schema";
export const redisRouter = createTRPCRouter({
	create: protectedProcedure
		.input(apiCreateRedis)
		.mutation(async ({ input, ctx }) => {
			try {
				if (ctx.user.role === "member") {
					await checkServiceAccess(
						ctx.user.id,
						input.projectId,
						ctx.session.activeOrganizationId,
						"create",
					);
				}

				if (IS_CLOUD && !input.serverId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You need to use a server to create a Redis",
					});
				}

				const project = await findProjectById(input.projectId);
				if (project.organizationId !== ctx.session.activeOrganizationId) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not authorized to access this project",
					});
				}
				const newRedis = await createRedis(input);
				if (ctx.user.role === "member") {
					await addNewService(
						ctx.user.id,
						newRedis.redisId,
						project.organizationId,
					);
				}

				await createMount({
					serviceId: newRedis.redisId,
					serviceType: "redis",
					volumeName: `${newRedis.appName}-data`,
					mountPath: "/data",
					type: "volume",
				});

				return true;
			} catch (error) {
				throw error;
			}
		}),
	one: protectedProcedure
		.input(apiFindOneRedis)
		.query(async ({ input, ctx }) => {
			if (ctx.user.role === "member") {
				await checkServiceAccess(
					ctx.user.id,
					input.redisId,
					ctx.session.activeOrganizationId,
					"access",
				);
			}

			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to access this Redis",
				});
			}
			return redis;
		}),

	start: protectedProcedure
		.input(apiFindOneRedis)
		.mutation(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to start this Redis",
				});
			}

			if (redis.serverId) {
				await startServiceRemote(redis.serverId, redis.appName);
			} else {
				await startService(redis.appName);
			}
			await updateRedisById(input.redisId, {
				applicationStatus: "done",
			});

			return redis;
		}),
	reload: protectedProcedure
		.input(apiResetRedis)
		.mutation(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to reload this Redis",
				});
			}
			if (redis.serverId) {
				await stopServiceRemote(redis.serverId, redis.appName);
			} else {
				await stopService(redis.appName);
			}
			await updateRedisById(input.redisId, {
				applicationStatus: "idle",
			});

			if (redis.serverId) {
				await startServiceRemote(redis.serverId, redis.appName);
			} else {
				await startService(redis.appName);
			}
			await updateRedisById(input.redisId, {
				applicationStatus: "done",
			});
			return true;
		}),

	stop: protectedProcedure
		.input(apiFindOneRedis)
		.mutation(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to stop this Redis",
				});
			}
			if (redis.serverId) {
				await stopServiceRemote(redis.serverId, redis.appName);
			} else {
				await stopService(redis.appName);
			}
			await updateRedisById(input.redisId, {
				applicationStatus: "idle",
			});

			return redis;
		}),
	saveExternalPort: protectedProcedure
		.input(apiSaveExternalPortRedis)
		.mutation(async ({ input, ctx }) => {
			const mongo = await findRedisById(input.redisId);
			if (mongo.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to save this external port",
				});
			}
			await updateRedisById(input.redisId, {
				externalPort: input.externalPort,
			});
			await deployRedis(input.redisId);
			return mongo;
		}),
	deploy: protectedProcedure
		.input(apiDeployRedis)
		.mutation(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to deploy this Redis",
				});
			}
			return deployRedis(input.redisId);
		}),
	deployWithLogs: protectedProcedure
		.meta({
			openapi: {
				path: "/deploy/redis-with-logs",
				method: "POST",
				override: true,
				enabled: false,
			},
		})
		.input(apiDeployRedis)
		.subscription(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to deploy this Redis",
				});
			}
			return observable<string>((emit) => {
				deployRedis(input.redisId, (log) => {
					emit.next(log);
				});
			});
		}),
	changeStatus: protectedProcedure
		.input(apiChangeRedisStatus)
		.mutation(async ({ input, ctx }) => {
			const mongo = await findRedisById(input.redisId);
			if (mongo.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to change this Redis status",
				});
			}
			await updateRedisById(input.redisId, {
				applicationStatus: input.applicationStatus,
			});
			return mongo;
		}),
	remove: protectedProcedure
		.input(apiFindOneRedis)
		.mutation(async ({ input, ctx }) => {
			if (ctx.user.role === "member") {
				await checkServiceAccess(
					ctx.user.id,
					input.redisId,
					ctx.session.activeOrganizationId,
					"delete",
				);
			}

			const redis = await findRedisById(input.redisId);

			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to delete this Redis",
				});
			}
			const cleanupOperations = [
				async () => await removeService(redis?.appName, redis.serverId),
				async () => await removeRedisById(input.redisId),
			];

			for (const operation of cleanupOperations) {
				try {
					await operation();
				} catch (_) {}
			}

			return redis;
		}),
	saveEnvironment: protectedProcedure
		.input(apiSaveEnvironmentVariablesRedis)
		.mutation(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to save this environment",
				});
			}
			const updatedRedis = await updateRedisById(input.redisId, {
				env: input.env,
			});

			if (!updatedRedis) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error adding environment variables",
				});
			}

			return true;
		}),
	update: protectedProcedure
		.input(apiUpdateRedis)
		.mutation(async ({ input }) => {
			const { redisId, ...rest } = input;
			const redis = await updateRedisById(redisId, {
				...rest,
			});

			if (!redis) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error updating Redis",
				});
			}

			return true;
		}),
	move: protectedProcedure
		.input(
			z.object({
				redisId: z.string(),
				targetProjectId: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to move this redis",
				});
			}

			const targetProject = await findProjectById(input.targetProjectId);
			if (targetProject.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to move to this project",
				});
			}

			// Update the redis's projectId
			const updatedRedis = await db
				.update(redisTable)
				.set({
					projectId: input.targetProjectId,
				})
				.where(eq(redisTable.redisId, input.redisId))
				.returning()
				.then((res) => res[0]);

			if (!updatedRedis) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to move redis",
				});
			}

			return updatedRedis;
		}),
	rebuild: protectedProcedure
		.input(apiRebuildRedis)
		.mutation(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (redis.project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to rebuild this Redis database",
				});
			}

			await rebuildDatabase(redis.redisId, "redis");
			return true;
		}),
	evaluateEnvironmentVariables: protectedProcedure
		.input(apiSaveEnvironmentVariablesRedis.pick({ redisId: true }).extend({
			env: z.string().optional(),
			projectEnv: z.string().optional(),
		}))
		.query(async ({ input, ctx }) => {
			const redis = await findRedisById(input.redisId);
			if (
				redis.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to view this environment",
				});
			}

			try {
				// Use provided env vars or fall back to database values
				const envToEvaluate = input.env !== undefined ? input.env : redis.env;
				const projectEnvToEvaluate = input.projectEnv !== undefined ? input.projectEnv : redis.project.env;

				// Get full project with all services for comprehensive service variables
				const fullProject = await findProjectById(redis.projectId);
				
				// Create context for this redis service
				const context = createApplicationContext(redis as any, []); // No domains for redis
				// Add detailed services to context
				context.project.detailedServices = createDetailedServicesFromProject(fullProject);
				
				const generator = new EnvVariableGenerator(context);
				const generatedVars = generator.generateAll();

				// Evaluate user-defined environment variables with access to generated variables
				const evaluatedVars = prepareEnvironmentVariables(
					envToEvaluate,
					projectEnvToEvaluate,
					generatedVars,
				);

				return {
					rawEnvironment: envToEvaluate || "",
					projectEnvironment: projectEnvToEvaluate || "",
					evaluatedEnvironment: evaluatedVars,
					generatedVariables: generatedVars,
				};
			} catch (error) {
				return {
					rawEnvironment: input.env !== undefined ? input.env : redis.env || "",
					projectEnvironment: input.projectEnv !== undefined ? input.projectEnv : redis.project.env || "",
					evaluatedEnvironment: {},
					generatedVariables: [],
					error: error instanceof Error ? error.message : "Unknown error occurred while evaluating environment variables",
				};
			}
		}),
});
