type DeployJob =
	| {
			applicationId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy" | "redeploy";
			applicationType: "application";
			serverId?: string;
	  }
	| {
			composeId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy" | "redeploy";
			applicationType: "compose";
			serverId?: string;
	  }
	| {
			monorepoId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy" | "redeploy";
			applicationType: "monorepo";
			serverId?: string;
			subdomain?: string;
	  }
	| {
			applicationId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy";
			applicationType: "application-preview";
			previewDeploymentId: string;
			serverId?: string;
	  }
	| {
			monorepoId: string;
			titleLog: string;
			descriptionLog: string;
			server?: boolean;
			type: "deploy";
			applicationType: "monorepo-preview";
			previewDeploymentId?: string;
			serverId?: string;
			subdomain?: string;
	  };

export type DeploymentJob = DeployJob;
