// Enhanced GitHub webhook handler for project-level preview deployments
// This would extend the existing /pages/api/deploy/github.ts

import { createProjectPreviewDeployment, deployProjectPreview } from "@dokploy/server";

// Add to the existing webhook handler
export const handleProjectPreviewDeployment = async (
	payload: any,
	projectId: string
) => {
	const { pull_request, action } = payload;
	
	if (!pull_request) return;

	const prInfo = {
		pullRequestId: pull_request.id.toString(),
		pullRequestNumber: pull_request.number.toString(),
		pullRequestURL: pull_request.html_url,
		pullRequestTitle: pull_request.title,
		branch: pull_request.head.ref,
	};

	switch (action) {
		case 'opened':
		case 'synchronize':
		case 'reopened':
			// Create or update project preview
			const projectPreview = await createProjectPreviewDeployment({
				projectId,
				...prInfo,
			});

			// Deploy all services
			await deployProjectPreview(projectPreview.projectPreviewId, prInfo);
			break;

		case 'closed':
			// Clean up project preview
			const existingPreview = await findProjectPreviewByPR(projectId, prInfo.pullRequestId);
			if (existingPreview) {
				await removeProjectPreview(existingPreview.projectPreviewId);
			}
			break;
	}
};

// Modified webhook detection logic
export const detectProjectPreviewTrigger = (payload: any): { projectId: string } | null => {
	// Logic to determine if this PR should trigger project-level preview
	// Could be based on:
	// 1. Repository-level configuration
	// 2. Files changed in the PR
	// 3. Project settings
	// 4. Presence of .dokploy-preview.yml file

	// Example: Check if multiple services are affected
	const files = payload.pull_request?.changed_files || [];
	const affectedServices = new Set();
	
	files.forEach((file: string) => {
		if (file.startsWith('apps/')) affectedServices.add('application');
		if (file.includes('docker-compose')) affectedServices.add('compose');
		if (file.includes('database')) affectedServices.add('database');
	});

	// If multiple service types are affected, trigger project preview
	if (affectedServices.size > 1) {
		// Find project ID based on repository
		return { projectId: 'project_123' }; // Implementation needed
	}

	return null;
};
