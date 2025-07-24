import {
	checkServiceAccess,
	createMonorepo,
	findMonorepoById,
	findMonoreposByProjectId,
	findProjectById,
	removeMonorepoById,
	updateMonorepoById,
	updateMonorepoToken,
} from "@dokploy/server";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/server/db";
import {
	apiCreateMonorepo,
	apiDeleteMonorepo,
	apiFindMonorepo,
	apiUpdateMonorepo,
} from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const monorepoRouter = createTRPCRouter({
	create: protectedProcedure
		.input(apiCreateMonorepo)
		.mutation(async ({ input, ctx }) => {
			try {
				if (ctx.user.role === "member") {
					await checkServiceAccess(input.projectId, ctx.user.id, "create");
				}

				const newMonorepo = await createMonorepo(input);
				return newMonorepo;
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Error creating the monorepo",
					cause: error,
				});
			}
		}),

	one: protectedProcedure
		.input(apiFindMonorepo)
		.query(async ({ input, ctx }) => {
			const monorepo = await findMonorepoById(input.monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to access this monorepo",
				});
			}
			return monorepo;
		}),

	update: protectedProcedure
		.input(apiUpdateMonorepo)
		.mutation(async ({ input, ctx }) => {
			const { monorepoId, ...rest } = input;
			const monorepo = await findMonorepoById(monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to update this monorepo",
				});
			}

			const updatedMonorepo = await updateMonorepoById(monorepoId, {
				...rest,
			});
			return updatedMonorepo;
		}),

	remove: protectedProcedure
		.input(apiDeleteMonorepo)
		.mutation(async ({ input, ctx }) => {
			const monorepo = await findMonorepoById(input.monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to delete this monorepo",
				});
			}

			// TODO: Add proper cleanup similar to removeCompose
			const removedMonorepo = await removeMonorepoById(input.monorepoId);
			return removedMonorepo;
		}),

	allByProject: protectedProcedure
		.input(z.object({ projectId: z.string() }))
		.query(async ({ input, ctx }) => {
			const project = await findProjectById(input.projectId);
			if (project.organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to access this project",
				});
			}
			return await findMonoreposByProjectId(input.projectId);
		}),

	refreshToken: protectedProcedure
		.input(apiFindMonorepo)
		.mutation(async ({ input, ctx }) => {
			const monorepo = await findMonorepoById(input.monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to update this monorepo",
				});
			}

			const newRefreshToken = nanoid();
			await updateMonorepoById(input.monorepoId, {
				refreshToken: newRefreshToken,
			});
			return newRefreshToken;
		}),

	webhookToken: protectedProcedure
		.input(apiFindMonorepo)
		.mutation(async ({ input, ctx }) => {
			const monorepo = await findMonorepoById(input.monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to update this monorepo",
				});
			}

			const newWebhookToken = nanoid();
			await updateMonorepoToken(input.monorepoId, newWebhookToken);
			return newWebhookToken;
		}),

	start: protectedProcedure
		.input(apiFindMonorepo)
		.mutation(async ({ input, ctx }) => {
			const monorepo = await findMonorepoById(input.monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to start this monorepo",
				});
			}

			// TODO: Implement monorepo start logic
			throw new TRPCError({
				code: "NOT_IMPLEMENTED",
				message: "Monorepo start operation not yet implemented",
			});
		}),

	stop: protectedProcedure
		.input(apiFindMonorepo)
		.mutation(async ({ input, ctx }) => {
			const monorepo = await findMonorepoById(input.monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to stop this monorepo",
				});
			}

			// TODO: Implement monorepo stop logic
			throw new TRPCError({
				code: "NOT_IMPLEMENTED",
				message: "Monorepo stop operation not yet implemented",
			});
		}),

	move: protectedProcedure
		.input(
			z.object({
				monorepoId: z.string(),
				targetProjectId: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const monorepo = await findMonorepoById(input.monorepoId);
			if (
				monorepo.project.organizationId !== ctx.session.activeOrganizationId
			) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to move this monorepo",
				});
			}

			// TODO: Implement monorepo move logic
			throw new TRPCError({
				code: "NOT_IMPLEMENTED",
				message: "Monorepo move operation not yet implemented",
			});
		}),
});

// Remove the extra import at the bottom since they're now imported above
