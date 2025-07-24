import { findMonorepoByWebhookToken, IS_CLOUD } from "@dokploy/server";
import type { NextApiRequest, NextApiResponse } from "next";
import type { DeploymentJob } from "@/server/queues/queue-types";
import { myQueue } from "@/server/queues/queueSetup";
import { deploy } from "@/server/utils/deploy";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const { webhookToken } = req.query;

	if (req.method !== "POST") {
		res.status(405).json({ message: "Method not allowed" });
		return;
	}

	try {
		// Validate webhook token
		if (!webhookToken || typeof webhookToken !== "string") {
			res.status(400).json({ message: "Invalid webhook token" });
			return;
		}

		const monorepoResult = await findMonorepoByWebhookToken(webhookToken);

		if (!monorepoResult) {
			res.status(404).json({ message: "Monorepo not found" });
			return;
		}

		// Extract parameters from request body
		const {
			subdomain,
			title = "Manual Webhook Deploy",
			description = "",
			previewDeployment = false,
		} = req.body;

		// Validate subdomain if it's a preview deployment
		if (previewDeployment && !subdomain) {
			res.status(400).json({
				message: "Subdomain is required for preview deployments",
			});
			return;
		}

		try {
			const jobData: DeploymentJob = {
				monorepoId: monorepoResult.monorepoId as string,
				titleLog: title,
				descriptionLog: description,
				type: "deploy",
				applicationType: previewDeployment ? "monorepo-preview" : "monorepo",
				server: !!monorepoResult.serverId,
			};

			// Add subdomain info if it's a preview deployment
			if (previewDeployment && subdomain) {
				jobData.subdomain = subdomain;
			}

			if (IS_CLOUD && monorepoResult.serverId) {
				jobData.serverId = monorepoResult.serverId;
				await deploy(jobData);

				res.status(200).json({
					message: "Monorepo deployment triggered successfully",
					deploymentId: jobData.monorepoId,
					type: previewDeployment ? "preview" : "production",
					subdomain: subdomain || null,
				});
				return;
			}

			await myQueue.add(
				"deployments",
				{ ...jobData },
				{
					removeOnComplete: true,
					removeOnFail: true,
				},
			);

			res.status(200).json({
				message: "Monorepo deployment queued successfully",
				deploymentId: jobData.monorepoId,
				type: previewDeployment ? "preview" : "production",
				subdomain: subdomain || null,
			});
		} catch (error) {
			console.error("Error deploying monorepo:", error);
			res.status(400).json({
				message: "Error deploying monorepo",
				error: error instanceof Error ? error.message : "Unknown error",
			});
			return;
		}
	} catch (error) {
		console.error("Webhook error:", error);
		res.status(400).json({
			message: "Error processing webhook",
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}
