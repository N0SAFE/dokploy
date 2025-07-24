import {
	findApplicationById,
	findMonorepoById,
	findPreviewDeploymentById,
	findPreviewDeploymentsByApplicationId,
	findPreviewDeploymentsByMonorepoId,
	removePreviewDeployment,
} from "@dokploy/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { apiFindAllByApplication } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const previewDeploymentRouter = createTRPCRouter({
	all: protectedProcedure
		.input(
			z
				.object({
					applicationId: z.string().optional(),
					monorepoId: z.string().optional(),
				})
				.refine((data) => data.applicationId || data.monorepoId, {
					message: "Either applicationId or monorepoId must be provided",
				}),
		)
		.query(async ({ input, ctx }) => {
			if (input.applicationId) {
				const application = await findApplicationById(input.applicationId);
				if (
					application.project.organizationId !== ctx.session.activeOrganizationId
				) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not authorized to access this application",
					});
				}
				return await findPreviewDeploymentsByApplicationId(input.applicationId);
			}

			if (input.monorepoId) {
				const monorepo = await findMonorepoById(input.monorepoId);
				if (
					monorepo.project.organizationId !== ctx.session.activeOrganizationId
				) {
					throw new TRPCError({
						code: "UNAUTHORIZED",
						message: "You are not authorized to access this monorepo",
					});
				}
				return await findPreviewDeploymentsByMonorepoId(input.monorepoId);
			}

			return [];
		}),
	delete: protectedProcedure
		.input(z.object({ previewDeploymentId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const previewDeployment = await findPreviewDeploymentById(
				input.previewDeploymentId,
			);
			
			const organizationId = previewDeployment.application?.project.organizationId || 
				previewDeployment.monorepo?.project.organizationId;
			
			if (organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to delete this preview deployment",
				});
			}
			await removePreviewDeployment(input.previewDeploymentId);
			return true;
		}),
	redeploy: protectedProcedure
		.input(z.object({ previewDeploymentId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const previewDeployment = await findPreviewDeploymentById(
				input.previewDeploymentId,
			);
			
			const organizationId = previewDeployment.application?.project.organizationId || 
				previewDeployment.monorepo?.project.organizationId;
			
			if (organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to redeploy this preview deployment",
				});
			}
			
			// TODO: Implement actual redeploy logic for preview deployments
			// For now, just return success
			return true;
		}),
	one: protectedProcedure
		.input(z.object({ previewDeploymentId: z.string() }))
		.query(async ({ input, ctx }) => {
			const previewDeployment = await findPreviewDeploymentById(
				input.previewDeploymentId,
			);
			
			const organizationId = previewDeployment.application?.project.organizationId || 
				previewDeployment.monorepo?.project.organizationId;
			
			if (organizationId !== ctx.session.activeOrganizationId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You are not authorized to access this preview deployment",
				});
			}
			return previewDeployment;
		}),
});
