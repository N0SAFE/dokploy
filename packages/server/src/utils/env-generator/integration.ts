import type { ApplicationNested } from "../builders";
import type { ComposeNested } from "../builders/compose";
import { prepareEnvironmentVariables } from "../docker/utils";
import { findDomainsByApplicationId, findDomainsByComposeId } from "../../services/domain";
import { 
	EnvVariableGenerator,
	type EnvGenerationContext,
	prepareEnhancedEnvironmentVariables 
} from "./index";
import { 
	createApplicationContext,
	createComposeContext,
	createProjectContext,
	createDatabaseContext
} from "./helpers";

/**
 * Enhanced environment variable preparation for applications
 * This extends the existing prepareEnvironmentVariables with generated variables
 */
export const prepareApplicationEnvironmentVariables = async (
	application: ApplicationNested,
	options: {
		includeGenerated?: boolean;
		categories?: Array<"project" | "application" | "service" | "domain" | "network" | "system">;
	} = {}
): Promise<string[]> => {
	const { includeGenerated = true } = options;

	// Get original environment variables
	const originalVars = prepareEnvironmentVariables(
		application.env,
		application.project.env
	);

	if (!includeGenerated) {
		return originalVars;
	}

	try {
		// Fetch domains for this application
		const domains = await findDomainsByApplicationId(application.applicationId);
		
		// Create context and generate additional variables
		const context = createApplicationContext(application, domains);
		const additionalVars = prepareEnhancedEnvironmentVariables(
			application.env,
			application.project.env,
			context,
			options
		);

		return additionalVars;
	} catch (error) {
		console.warn("Failed to generate enhanced environment variables:", error);
		return originalVars;
	}
};

/**
 * Enhanced environment variable preparation for compose services
 */
export const prepareComposeEnvironmentVariables = async (
	compose: ComposeNested,
	options: {
		includeGenerated?: boolean;
		categories?: Array<"project" | "application" | "service" | "domain" | "network" | "system">;
	} = {}
): Promise<string[]> => {
	const { includeGenerated = true } = options;

	// Get original environment variables
	const originalVars = prepareEnvironmentVariables(
		compose.env,
		compose.project.env
	);

	if (!includeGenerated) {
		return originalVars;
	}

	try {
		// Fetch domains for this compose
		const domains = await findDomainsByComposeId(compose.composeId);
		
		// Create context and generate additional variables
		const context = createComposeContext(compose);
		// Add domains to context
		context.project.domains = domains.map(domain => ({
			domainId: domain.domainId,
			host: domain.host,
			https: domain.https,
			port: domain.port,
			path: domain.path
		}));

		const additionalVars = prepareEnhancedEnvironmentVariables(
			compose.env,
			compose.project.env,
			context,
			options
		);

		return additionalVars;
	} catch (error) {
		console.warn("Failed to generate enhanced environment variables:", error);
		return originalVars;
	}
};

/**
 * Enhanced environment variable preparation for database services
 */
export const prepareDatabaseEnvironmentVariables = (
	database: {
		id: string;
		name: string;
		appName: string;
		env?: string | null;
		databaseName?: string;
	},
	project: {
		projectId: string;
		name: string;
		env?: string | null;
	},
	type: "postgres" | "mysql" | "mariadb" | "mongo" | "redis",
	options: {
		includeGenerated?: boolean;
		categories?: Array<"project" | "application" | "service" | "domain" | "network" | "system">;
	} = {}
): string[] => {
	const { includeGenerated = true } = options;

	// Get original environment variables
	const originalVars = prepareEnvironmentVariables(
		database.env ?? null,
		project.env
	);

	if (!includeGenerated) {
		return originalVars;
	}

	try {
		// Create context and generate additional variables
		const context = createDatabaseContext(database, project, type);
		const additionalVars = prepareEnhancedEnvironmentVariables(
			database.env ?? null,
			project.env ?? null,
			context,
			options
		);

		return additionalVars;
	} catch (error) {
		console.warn("Failed to generate enhanced environment variables:", error);
		return originalVars;
	}
};

/**
 * Generate environment variables for a project with all its services
 */
export const generateProjectEnvironmentVariables = async (
	project: {
		projectId: string;
		name: string;
		env?: string | null;
	},
	applications: Array<ApplicationNested> = [],
	services: Array<{
		id: string;
		name: string;
		type: "postgres" | "redis" | "mysql" | "mariadb" | "mongo";
		appName: string;
	}> = [],
	options: {
		categories?: Array<"project" | "application" | "service" | "domain" | "network" | "system">;
	} = {}
): Promise<{
	project: Record<string, string>;
	applications: Record<string, Record<string, string>>;
	services: Record<string, Record<string, string>>;
}> => {
	const result = {
		project: {} as Record<string, string>,
		applications: {} as Record<string, Record<string, string>>,
		services: {} as Record<string, Record<string, string>>
	};

	try {
		// Collect all domains for applications
		const applicationData = await Promise.all(
			applications.map(async (app) => {
				const domains = await findDomainsByApplicationId(app.applicationId);
				return {
					applicationId: app.applicationId,
					name: app.name,
					appName: app.appName,
					domains: domains.map(domain => ({
						domainId: domain.domainId,
						host: domain.host,
						https: domain.https,
						port: domain.port,
						path: domain.path
					})),
					ports: app.ports?.map(port => ({
						portId: port.portId,
						publishedPort: port.publishedPort,
						targetPort: port.targetPort,
						protocol: port.protocol
					})) || []
				};
			})
		);

		const serviceData = services.map(service => ({
			id: service.id,
			name: service.name,
			type: service.type,
			appName: service.appName,
			domains: [] // Services typically don't have domains directly
		}));

		// Create project context
		const projectContext = createProjectContext({
			projectId: project.projectId,
			name: project.name,
			env: project.env,
			applications: applicationData,
			services: serviceData
		});

		// Generate project-level variables
		const generator = new EnvVariableGenerator(projectContext);
		const allVars = generator.generateAsKeyValuePairs();

		// Filter variables by category for project
		const projectCategories = options.categories?.includes("project") ? ["project", "system"] : ["system"];
		const filteredVars = Object.entries(allVars).filter(([key]) => 
			projectCategories.some(cat => {
				switch (cat) {
					case "project": return key.startsWith("PROJECT_") || key.startsWith("DOKPLOY_PROJECT");
					case "system": return key.startsWith("DOKPLOY_") || key === "DOCKER_NETWORK";
					default: return false;
				}
			})
		);
		
		result.project = Object.fromEntries(filteredVars);

		// Generate application-specific variables
		for (const app of applications) {
			const appVars = await prepareApplicationEnvironmentVariables(app, {
				includeGenerated: true,
				categories: options.categories?.filter(cat => ["application", "domain", "network"].includes(cat))
			});
			
			const appVarObject: Record<string, string> = {};
			for (const varStr of appVars) {
				const [key, ...valueParts] = varStr.split('=');
				if (key && valueParts.length > 0) {
					appVarObject[key] = valueParts.join('=');
				}
			}
			
			result.applications[app.appName] = appVarObject;
		}

		// Generate service-specific variables
		for (const service of services) {
			const serviceVars = prepareDatabaseEnvironmentVariables(
				service,
				project,
				service.type,
				{
					includeGenerated: true,
					categories: options.categories?.filter(cat => ["service", "network"].includes(cat))
				}
			);
			
			const serviceVarObject: Record<string, string> = {};
			for (const varStr of serviceVars) {
				const [key, ...valueParts] = varStr.split('=');
				if (key && valueParts.length > 0) {
					serviceVarObject[key] = valueParts.join('=');
				}
			}
			
			result.services[service.appName] = serviceVarObject;
		}

	} catch (error) {
		console.error("Failed to generate project environment variables:", error);
	}

	return result;
};

/**
 * Get quick reference variables for common use cases
 */
export const getQuickReferenceVariables = (
	context: EnvGenerationContext
): {
	appUrl?: string;
	projectUrl?: string;
	databaseHosts: Record<string, string>;
	serviceUrls: Record<string, string>;
} => {
	const generator = new EnvVariableGenerator(context);
	const vars = generator.generateAsKeyValuePairs();

	const result = {
		appUrl: vars.APP_URL,
		projectUrl: vars.PROJECT_GENERATED_URL,
		databaseHosts: {} as Record<string, string>,
		serviceUrls: {} as Record<string, string>
	};

	// Extract database hosts
	Object.keys(vars).forEach(key => {
		if (key.includes("_HOST") && vars[key]) {
			const serviceName = key.replace(/_HOST$/, '').toLowerCase();
			result.databaseHosts[serviceName] = vars[key]!;
		}
		if (key.includes("SERVICE_") && key.includes("_URL") && vars[key]) {
			const serviceName = key.replace(/^SERVICE_/, '').replace(/_URL$/, '').toLowerCase();
			result.serviceUrls[serviceName] = vars[key]!;
		}
	});

	return result;
};

/**
 * Export utility functions for backward compatibility
 */
export {
	prepareEnhancedEnvironmentVariables,
	EnvVariableGenerator
} from "./index";

export {
	createApplicationContext,
	createComposeContext,
	createProjectContext,
	createDatabaseContext,
	toDockerEnvArray,
	toEnvFileFormat,
	generateConnectionUrls
} from "./helpers";
