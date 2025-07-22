import type { ApplicationNested } from "../builders";

/**
 * Context interface for generating environment variables
 */
export interface EnvGenerationContext {
	project: {
		projectId: string;
		name: string;
		env?: string | null;
		applications?: ApplicationInfo[];
		services?: ServiceInfo[];
		domains?: DomainInfo[];
	};
	application?: ApplicationInfo;
	currentService?: {
		id: string;
		name: string;
		type: ServiceType;
		appName: string;
	};
}

export interface ApplicationInfo {
	applicationId: string;
	name: string;
	appName: string;
	domains: DomainInfo[];
	ports: PortInfo[];
}

export interface ServiceInfo {
	id: string;
	name: string;
	type: ServiceType;
	appName: string;
	domains: DomainInfo[];
}

export interface DomainInfo {
	domainId: string;
	host: string;
	https: boolean;
	port?: number | null;
	path?: string | null;
}

export interface PortInfo {
	portId: string;
	publishedPort: number;
	targetPort: number;
	protocol: "tcp" | "udp";
}

export type ServiceType =
	| "application"
	| "postgres"
	| "redis"
	| "mysql"
	| "mariadb"
	| "mongo"
	| "compose";

/**
 * Generated environment variable entry
 */
export interface GeneratedEnvVar {
	key: string;
	value: string;
	description?: string;
	category:
		| "project"
		| "application"
		| "service"
		| "domain"
		| "network"
		| "system";
}

/**
 * Main class for generating environment variables
 */
export class EnvVariableGenerator {
	private context: EnvGenerationContext;

	constructor(context: EnvGenerationContext) {
		this.context = context;
	}

	/**
	 * Generate all environment variables for the current context
	 */
	generateAll(): GeneratedEnvVar[] {
		const envVars: GeneratedEnvVar[] = [];

		// Generate project-level variables
		envVars.push(...this.generateProjectVars());

		// Generate application-level variables
		envVars.push(...this.generateApplicationVars());

		// Generate service-level variables
		envVars.push(...this.generateServiceVars());

		// Generate domain-level variables
		envVars.push(...this.generateDomainVars());

		// Generate network-level variables
		envVars.push(...this.generateNetworkVars());

		// Generate system-level variables
		envVars.push(...this.generateSystemVars());

		return envVars;
	}

	/**
	 * Generate environment variables as key-value pairs ready for injection
	 */
	generateAsKeyValuePairs(): Record<string, string> {
		const envVars = this.generateAll();
		const result: Record<string, string> = {};

		for (const envVar of envVars) {
			result[envVar.key] = envVar.value;
		}

		return result;
	}

	/**
	 * Generate environment variables as string array (KEY=VALUE format)
	 */
	generateAsStringArray(): string[] {
		const envVars = this.generateAll();
		return envVars.map((envVar) => `${envVar.key}=${envVar.value}`);
	}

	/**
	 * Generate project-level environment variables
	 */
	private generateProjectVars(): GeneratedEnvVar[] {
		const vars: GeneratedEnvVar[] = [];
		const { project } = this.context;

		// Basic project information
		vars.push({
			key: "PROJECT_ID",
			value: project.projectId,
			description: "Unique project identifier",
			category: "project",
		});

		vars.push({
			key: "PROJECT_NAME",
			value: project.name,
			description: "Project name",
			category: "project",
		});

		vars.push({
			key: "PROJECT_NAME_SLUG",
			value: this.slugify(project.name),
			description: "Project name as URL-safe slug",
			category: "project",
		});

		// Generated project URLs and endpoints
		if (project.applications && project.applications.length > 0) {
			const primaryApp = project.applications[0];
			if (primaryApp && primaryApp.domains.length > 0) {
				const primaryDomain = primaryApp.domains[0];
				if (primaryDomain) {
					const protocol = primaryDomain.https ? "https" : "http";
					const port =
						primaryDomain.port &&
						primaryDomain.port !== 80 &&
						primaryDomain.port !== 443
							? `:${primaryDomain.port}`
							: "";

					vars.push({
						key: "PROJECT_GENERATED_URL",
						value: `${protocol}://${primaryDomain.host}${port}`,
						description: "Generated primary project URL",
						category: "project",
					});

					vars.push({
						key: `PROJECT_GENERATED_${this.slugify(project.name).toUpperCase()}_URL`,
						value: `${protocol}://${primaryDomain.host}${port}`,
						description: `Generated URL for project ${project.name}`,
						category: "project",
					});
				}
			}
		}

		// Project service count variables
		vars.push({
			key: "PROJECT_APPLICATIONS_COUNT",
			value: (project.applications?.length || 0).toString(),
			description: "Number of applications in project",
			category: "project",
		});

		vars.push({
			key: "PROJECT_SERVICES_COUNT",
			value: (project.services?.length || 0).toString(),
			description: "Number of services in project",
			category: "project",
		});

		return vars;
	}

	/**
	 * Generate application-level environment variables
	 */
	private generateApplicationVars(): GeneratedEnvVar[] {
		const vars: GeneratedEnvVar[] = [];
		const { project, application } = this.context;

		// Generate variables for all applications in project
		if (project.applications) {
			for (const app of project.applications) {
				const appSlug = this.slugify(app.name).toUpperCase();

				// Basic app info
				vars.push({
					key: `APP_${appSlug}_ID`,
					value: app.applicationId,
					description: `Application ID for ${app.name}`,
					category: "application",
				});

				vars.push({
					key: `APP_${appSlug}_NAME`,
					value: app.name,
					description: `Application name for ${app.name}`,
					category: "application",
				});

				vars.push({
					key: `APP_${appSlug}_APP_NAME`,
					value: app.appName,
					description: `Docker app name for ${app.name}`,
					category: "application",
				});

				// App URLs
				if (app.domains.length > 0) {
					const primaryDomain = app.domains[0];
					if (primaryDomain) {
						const protocol = primaryDomain.https ? "https" : "http";
						const port =
							primaryDomain.port &&
							primaryDomain.port !== 80 &&
							primaryDomain.port !== 443
								? `:${primaryDomain.port}`
								: "";

						vars.push({
							key: `APP_${appSlug}_URL`,
							value: `${protocol}://${primaryDomain.host}${port}`,
							description: `Primary URL for application ${app.name}`,
							category: "application",
						});

						vars.push({
							key: "APP_URL",
							value: `${protocol}://${primaryDomain.host}${port}`,
							description: "Current application URL (if in app context)",
							category: "application",
						});
					}

					// Generate for each domain
					app.domains.forEach((domain, index) => {
						const domainProtocol = domain.https ? "https" : "http";
						const domainPort =
							domain.port && domain.port !== 80 && domain.port !== 443
								? `:${domain.port}`
								: "";

						vars.push({
							key: `APP_${appSlug}_DOMAIN_${index + 1}_URL`,
							value: `${domainProtocol}://${domain.host}${domainPort}`,
							description: `Domain ${index + 1} URL for application ${app.name}`,
							category: "application",
						});

						vars.push({
							key: `APP_${appSlug}_DOMAIN_${index + 1}_HOST`,
							value: domain.host,
							description: `Domain ${index + 1} host for application ${app.name}`,
							category: "application",
						});
					});
				}

				// Port information
				if (app.ports.length > 0) {
					const primaryPort = app.ports[0];
					if (primaryPort) {
						vars.push({
							key: `APP_${appSlug}_PORT`,
							value: primaryPort.publishedPort.toString(),
							description: `Primary published port for application ${app.name}`,
							category: "application",
						});

						vars.push({
							key: `APP_${appSlug}_TARGET_PORT`,
							value: primaryPort.targetPort.toString(),
							description: `Primary target port for application ${app.name}`,
							category: "application",
						});
					}

					// Generate for each port
					app.ports.forEach((port, index) => {
						vars.push({
							key: `APP_${appSlug}_PORT_${index + 1}_PUBLISHED`,
							value: port.publishedPort.toString(),
							description: `Published port ${index + 1} for application ${app.name}`,
							category: "application",
						});

						vars.push({
							key: `APP_${appSlug}_PORT_${index + 1}_TARGET`,
							value: port.targetPort.toString(),
							description: `Target port ${index + 1} for application ${app.name}`,
							category: "application",
						});
					});
				}
			}
		}

		return vars;
	}

	/**
	 * Generate service-level environment variables (databases, etc.)
	 */
	private generateServiceVars(): GeneratedEnvVar[] {
		const vars: GeneratedEnvVar[] = [];
		const { project } = this.context;

		if (project.services) {
			for (const service of project.services) {
				const serviceSlug = this.slugify(service.name).toUpperCase();
				const typeSlug = service.type.toUpperCase();

				// Basic service info
				vars.push({
					key: `SERVICE_${serviceSlug}_ID`,
					value: service.id,
					description: `Service ID for ${service.name}`,
					category: "service",
				});

				vars.push({
					key: `SERVICE_${serviceSlug}_NAME`,
					value: service.name,
					description: `Service name for ${service.name}`,
					category: "service",
				});

				vars.push({
					key: `SERVICE_${serviceSlug}_TYPE`,
					value: service.type,
					description: `Service type for ${service.name}`,
					category: "service",
				});

				vars.push({
					key: `SERVICE_${serviceSlug}_APP_NAME`,
					value: service.appName,
					description: `Docker app name for service ${service.name}`,
					category: "service",
				});

				// Service URLs if domains exist
				if (service.domains && service.domains.length > 0) {
					const primaryDomain = service.domains[0];
					if (primaryDomain) {
						const protocol = primaryDomain.https ? "https" : "http";
						const port =
							primaryDomain.port &&
							primaryDomain.port !== 80 &&
							primaryDomain.port !== 443
								? `:${primaryDomain.port}`
								: "";

						vars.push({
							key: `SERVICE_${serviceSlug}_URL`,
							value: `${protocol}://${primaryDomain.host}${port}`,
							description: `Primary URL for service ${service.name}`,
							category: "service",
						});
					}
				}

				// Type-specific variables
				if (
					service.type === "postgres" ||
					service.type === "mysql" ||
					service.type === "mariadb"
				) {
					vars.push({
						key: `${typeSlug}_${serviceSlug}_HOST`,
						value: service.appName,
						description: `Database host for ${service.name}`,
						category: "service",
					});

					// Standard database ports
					const defaultPort = service.type === "postgres" ? "5432" : "3306";
					vars.push({
						key: `${typeSlug}_${serviceSlug}_PORT`,
						value: defaultPort,
						description: `Database port for ${service.name}`,
						category: "service",
					});
				}

				if (service.type === "redis") {
					vars.push({
						key: `REDIS_${serviceSlug}_HOST`,
						value: service.appName,
						description: `Redis host for ${service.name}`,
						category: "service",
					});

					vars.push({
						key: `REDIS_${serviceSlug}_PORT`,
						value: "6379",
						description: `Redis port for ${service.name}`,
						category: "service",
					});
				}

				if (service.type === "mongo") {
					vars.push({
						key: `MONGO_${serviceSlug}_HOST`,
						value: service.appName,
						description: `MongoDB host for ${service.name}`,
						category: "service",
					});

					vars.push({
						key: `MONGO_${serviceSlug}_PORT`,
						value: "27017",
						description: `MongoDB port for ${service.name}`,
						category: "service",
					});
				}
			}
		}

		return vars;
	}

	/**
	 * Generate domain-level environment variables
	 */
	private generateDomainVars(): GeneratedEnvVar[] {
		const vars: GeneratedEnvVar[] = [];
		const { project } = this.context;

		if (project.domains) {
			for (const domain of project.domains) {
				const domainSlug = this.slugify(domain.host).toUpperCase();
				const protocol = domain.https ? "https" : "http";
				const port =
					domain.port && domain.port !== 80 && domain.port !== 443
						? `:${domain.port}`
						: "";

				vars.push({
					key: `DOMAIN_${domainSlug}_HOST`,
					value: domain.host,
					description: `Domain host for ${domain.host}`,
					category: "domain",
				});

				vars.push({
					key: `DOMAIN_${domainSlug}_URL`,
					value: `${protocol}://${domain.host}${port}`,
					description: `Full URL for domain ${domain.host}`,
					category: "domain",
				});

				vars.push({
					key: `DOMAIN_${domainSlug}_PROTOCOL`,
					value: protocol,
					description: `Protocol for domain ${domain.host}`,
					category: "domain",
				});

				if (domain.port) {
					vars.push({
						key: `DOMAIN_${domainSlug}_PORT`,
						value: domain.port.toString(),
						description: `Port for domain ${domain.host}`,
						category: "domain",
					});
				}
			}
		}

		return vars;
	}

	/**
	 * Generate network-level environment variables
	 */
	private generateNetworkVars(): GeneratedEnvVar[] {
		const vars: GeneratedEnvVar[] = [];
		const { project } = this.context;

		// Docker network name
		vars.push({
			key: "DOCKER_NETWORK",
			value: "dokploy-network",
			description: "Docker network name",
			category: "network",
		});

		vars.push({
			key: "PROJECT_NETWORK",
			value: `${this.slugify(project.name)}-network`,
			description: "Project-specific network name",
			category: "network",
		});

		return vars;
	}

	/**
	 * Generate system-level environment variables
	 */
	private generateSystemVars(): GeneratedEnvVar[] {
		const vars: GeneratedEnvVar[] = [];

		vars.push({
			key: "DOKPLOY_PROJECT_ID",
			value: this.context.project.projectId,
			description: "Dokploy project identifier",
			category: "system",
		});

		vars.push({
			key: "DOKPLOY_GENERATED_AT",
			value: new Date().toISOString(),
			description: "Timestamp when variables were generated",
			category: "system",
		});

		// Legacy compatibility
		if (
			this.context.application &&
			this.context.application.domains.length > 0
		) {
			const primaryDomain = this.context.application.domains[0];
			if (primaryDomain) {
				const protocol = primaryDomain.https ? "https" : "http";
				const port =
					primaryDomain.port &&
					primaryDomain.port !== 80 &&
					primaryDomain.port !== 443
						? `:${primaryDomain.port}`
						: "";

				vars.push({
					key: "DOKPLOY_DEPLOY_URL",
					value: `${protocol}://${primaryDomain.host}${port}`,
					description: "Legacy deploy URL variable",
					category: "system",
				});
			}
		}

		return vars;
	}

	/**
	 * Convert string to URL-safe slug
	 */
	private slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "")
			.replace(/_+/g, "_");
	}
}

/**
 * Enhanced environment variable preparation that includes generated variables
 */
export const prepareEnhancedEnvironmentVariables = (
	serviceEnv: string | null,
	projectEnv: string | null,
	context: EnvGenerationContext,
	options: {
		includeGenerated?: boolean;
		categories?: Array<GeneratedEnvVar["category"]>;
	} = {},
): string[] => {
	const { includeGenerated = true, categories } = options;

	// Start with original environment variable preparation
	const originalVars = prepareBasicEnvironmentVariables(serviceEnv, projectEnv);

	if (!includeGenerated) {
		return originalVars;
	}

	// Generate additional variables
	const generator = new EnvVariableGenerator(context);
	const generatedVars = generator.generateAll();

	// Filter by categories if specified
	const filteredVars = categories
		? generatedVars.filter((v) => categories.includes(v.category))
		: generatedVars;

	// Convert generated vars to string format
	const generatedStrings = filteredVars.map((v) => `${v.key}=${v.value}`);

	// Merge original and generated, with original taking precedence
	const originalKeys = new Set(originalVars.map((v) => v.split("=")[0]));
	const newGeneratedVars = generatedStrings.filter(
		(v) => !originalKeys.has(v.split("=")[0]),
	);

	return [...originalVars, ...newGeneratedVars];
};

/**
 * Basic environment variable preparation (existing functionality)
 */
const prepareBasicEnvironmentVariables = (
	serviceEnv: string | null,
	projectEnv?: string | null,
): string[] => {
	// This should use the existing prepareEnvironmentVariables function
	// For now, we'll implement a basic version
	const projectVars: Record<string, string> = {};
	const serviceVars: Record<string, string> = {};

	// Parse project env
	if (projectEnv) {
		const lines = projectEnv.split("\n").filter((line) => line.trim());
		for (const line of lines) {
			const [key, ...valueParts] = line.split("=");
			if (key && valueParts.length > 0) {
				projectVars[key.trim()] = valueParts.join("=").trim();
			}
		}
	}

	// Parse service env
	if (serviceEnv) {
		const lines = serviceEnv.split("\n").filter((line) => line.trim());
		for (const line of lines) {
			const [key, ...valueParts] = line.split("=");
			if (key && valueParts.length > 0) {
				serviceVars[key.trim()] = valueParts.join("=").trim();
			}
		}
	}

	// Resolve project variable references
	const resolvedVars = Object.entries(serviceVars).map(([key, value]) => {
		let resolvedValue = value;
		if (projectVars) {
			resolvedValue = value.replace(/\$\{\{project\.(.*?)\}\}/g, (_, ref) => {
				if (projectVars[ref] !== undefined) {
					return projectVars[ref];
				}
				throw new Error(`Invalid project environment variable: project.${ref}`);
			});
		}
		return `${key}=${resolvedValue}`;
	});

	return resolvedVars;
};
