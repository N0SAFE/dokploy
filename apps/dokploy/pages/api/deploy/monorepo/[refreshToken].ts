import { IS_CLOUD, shouldDeploy } from "@dokploy/server";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/server/db";
import { monorepo } from "@/server/db/schema";
import type { DeploymentJob } from "@/server/queues/queue-types";
import { myQueue } from "@/server/queues/queueSetup";
import { deploy } from "@/server/utils/deploy";
import {
	extractBranchName,
	extractCommitedPaths,
	extractCommitMessage,
	extractHash,
	getProviderByHeader,
} from "../[refreshToken]";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const { refreshToken } = req.query;
	try {
		if (req.headers["x-github-event"] === "ping") {
			res.status(200).json({ message: "Ping received, webhook is active" });
			return;
		}
		const monorepoResult = await db.query.monorepo.findFirst({
			where: eq(monorepo.refreshToken, refreshToken as string),
			with: {
				project: true,
				bitbucket: true,
			},
		});

		if (!monorepoResult) {
			res.status(404).json({ message: "Monorepo Not Found" });
			return;
		}
		if (!monorepoResult?.autoDeploy) {
			res.status(400).json({
				message: "Automatic deployments are disabled for this monorepo",
			});
			return;
		}

		const deploymentTitle = extractCommitMessage(req.headers, req.body);
		const deploymentHash = extractHash(req.headers, req.body);
		const sourceType = monorepoResult.sourceType;

		if (sourceType === "github") {
			const normalizedCommits = req.body?.commits?.flatMap(
				(commit: any) => commit.modified,
			);

			const shouldDeployPaths = shouldDeploy(
				monorepoResult.watchPaths,
				normalizedCommits,
			);

			if (!shouldDeployPaths) {
				res.status(301).json({ message: "Watch Paths Not Match" });
				return;
			}

			const branchName = extractBranchName(req.headers, req.body);
			if (!branchName || branchName !== monorepoResult.branch) {
				res.status(301).json({ message: "Branch Not Match" });
				return;
			}
		} else if (sourceType === "git") {
			const branchName = extractBranchName(req.headers, req.body);

			if (!branchName || branchName !== monorepoResult.customGitBranch) {
				res.status(301).json({ message: "Branch Not Match" });
				return;
			}

			const provider = getProviderByHeader(req.headers);
			let normalizedCommits: string[] = [];

			if (provider === "github") {
				normalizedCommits = req.body?.commits?.flatMap(
					(commit: any) => commit.modified,
				);
			} else if (provider === "gitlab") {
				normalizedCommits = req.body?.commits?.flatMap(
					(commit: any) => commit.modified,
				);
			} else if (provider === "gitea") {
				normalizedCommits = req.body?.commits?.flatMap(
					(commit: any) => commit.modified,
				);
			}

			const shouldDeployPaths = shouldDeploy(
				monorepoResult.watchPaths,
				normalizedCommits,
			);

			if (!shouldDeployPaths) {
				res.status(301).json({ message: "Watch Paths Not Match" });
				return;
			}
		} else if (sourceType === "gitlab") {
			const branchName = extractBranchName(req.headers, req.body);

			const normalizedCommits = req.body?.commits?.flatMap(
				(commit: any) => commit.modified,
			);

			const shouldDeployPaths = shouldDeploy(
				monorepoResult.watchPaths,
				normalizedCommits,
			);

			if (!shouldDeployPaths) {
				res.status(301).json({ message: "Watch Paths Not Match" });
				return;
			}

			if (!branchName || branchName !== monorepoResult.gitlabBranch) {
				res.status(301).json({ message: "Branch Not Match" });
				return;
			}
		} else if (sourceType === "bitbucket") {
			const branchName = extractBranchName(req.headers, req.body);

			if (!branchName || branchName !== monorepoResult.bitbucketBranch) {
				res.status(301).json({ message: "Branch Not Match" });
				return;
			}

			const commitedPaths = await extractCommitedPaths(
				req.body,
				monorepoResult.bitbucketOwner,
				monorepoResult.bitbucket?.appPassword || "",
				monorepoResult.bitbucketRepository || "",
			);
			const shouldDeployPaths = shouldDeploy(
				monorepoResult.watchPaths,
				commitedPaths,
			);

			if (!shouldDeployPaths) {
				res.status(301).json({ message: "Watch Paths Not Match" });
				return;
			}
		} else if (sourceType === "gitea") {
			const branchName = extractBranchName(req.headers, req.body);

			const normalizedCommits = req.body?.commits?.flatMap(
				(commit: any) => commit.modified,
			);

			const shouldDeployPaths = shouldDeploy(
				monorepoResult.watchPaths,
				normalizedCommits,
			);

			if (!shouldDeployPaths) {
				res.status(301).json({ message: "Watch Paths Not Match" });
				return;
			}

			if (!branchName || branchName !== monorepoResult.giteaBranch) {
				res.status(301).json({ message: "Branch Not Match" });
				return;
			}
		}

		try {
			const jobData: DeploymentJob = {
				monorepoId: monorepoResult.monorepoId as string,
				titleLog: deploymentTitle,
				descriptionLog: `Hash: ${deploymentHash}`,
				type: "deploy",
				applicationType: "monorepo",
				server: !!monorepoResult.serverId,
			};

			if (IS_CLOUD && monorepoResult.serverId) {
				jobData.serverId = monorepoResult.serverId;
				await deploy(jobData);
				return true;
			}
			await myQueue.add(
				"deployments",
				{ ...jobData },
				{
					removeOnComplete: true,
					removeOnFail: true,
				},
			);
		} catch (error) {
			res.status(400).json({ message: "Error deploying Monorepo", error });
			return;
		}

		res.status(200).json({ message: "Monorepo deployed successfully" });
	} catch (error) {
		console.log(error);
		res.status(400).json({ message: "Error deploying Monorepo", error });
	}
}
