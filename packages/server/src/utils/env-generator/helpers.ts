import type { ApplicationNested } from "../builders";
import type { ComposeNested } from "../builders/compose";
import type {
	ApplicationInfo,
	DomainInfo,
	EnvGenerationContext,
	PortInfo,
	ServiceInfo,
	DetailedServiceInfo,
} from "./index";

/**
 * Convert ApplicationNested to EnvGenerationContext
 * Note: ApplicationNested doesn't include domains by default, they need to be fetched separately
 */
export function createApplicationContext(
	application: ApplicationNested,
	domains: Array<{
		domainId: string;
		host: string;
		https: boolean;
		port?: number | null;
		path?: string | null;
	}> = [],
): EnvGenerationContext {
	const appDomains: DomainInfo[] = domains.map((domain) => ({
		domainId: domain.domainId,
		host: domain.host,
		https: domain.https,
		port: domain.port,
		path: domain.path,
	}));

	const appPorts: PortInfo[] =
		application.ports?.map((port) => ({
			portId: port.portId,
			publishedPort: port.publishedPort,
			targetPort: port.targetPort,
			protocol: port.protocol,
		})) || [];

	const applicationInfo: ApplicationInfo = {
		applicationId: application.applicationId,
		name: application.name,
		appName: application.appName,
		domains: appDomains,
		ports: appPorts,
	};

	return {
		project: {
			projectId: application.project.projectId,
			name: application.project.name,
			env: application.project.env,
			applications: [applicationInfo],
			services: [],
			domains: appDomains,
		},
		application: applicationInfo,
		currentService: {
			id: application.applicationId,
			name: application.name,
			type: "application",
			appName: application.appName,
		},
	};
}

/**
 * Convert ComposeNested to EnvGenerationContext
 */
export function createComposeContext(
	compose: ComposeNested,
): EnvGenerationContext {
	const composeDomains: DomainInfo[] =
		compose.domains?.map((domain) => ({
			domainId: domain.domainId,
			host: domain.host,
			https: domain.https,
			port: domain.port,
			path: domain.path,
		})) || [];

	const serviceInfo: ServiceInfo = {
		id: compose.composeId,
		name: compose.name,
		type: "compose",
		appName: compose.appName,
		domains: composeDomains,
	};

	return {
		project: {
			projectId: compose.project.projectId,
			name: compose.project.name,
			env: compose.project.env,
			applications: [],
			services: [serviceInfo],
			domains: composeDomains,
		},
		currentService: {
			id: compose.composeId,
			name: compose.name,
			type: "compose",
			appName: compose.appName,
		},
	};
}

/**
 * Create context from project data with all services and applications
 */
export function createProjectContext(project: {
	projectId: string;
	name: string;
	env?: string | null;
	applications?: Array<{
		applicationId: string;
		name: string;
		appName: string;
		domains?: Array<{
			domainId: string;
			host: string;
			https: boolean;
			port?: number | null;
			path?: string | null;
		}>;
		ports?: Array<{
			portId: string;
			publishedPort: number;
			targetPort: number;
			protocol: "tcp" | "udp";
		}>;
	}>;
	services?: Array<{
		id: string;
		name: string;
		type: "postgres" | "redis" | "mysql" | "mariadb" | "mongo";
		appName: string;
		domains?: Array<{
			domainId: string;
			host: string;
			https: boolean;
			port?: number | null;
			path?: string | null;
		}>;
	}>;
}): EnvGenerationContext {
	const applications: ApplicationInfo[] =
		project.applications?.map((app) => ({
			applicationId: app.applicationId,
			name: app.name,
			appName: app.appName,
			domains:
				app.domains?.map((domain) => ({
					domainId: domain.domainId,
					host: domain.host,
					https: domain.https,
					port: domain.port,
					path: domain.path,
				})) || [],
			ports:
				app.ports?.map((port) => ({
					portId: port.portId,
					publishedPort: port.publishedPort,
					targetPort: port.targetPort,
					protocol: port.protocol,
				})) || [],
		})) || [];

	const services: ServiceInfo[] =
		project.services?.map((service) => ({
			id: service.id,
			name: service.name,
			type: service.type,
			appName: service.appName,
			domains:
				service.domains?.map((domain) => ({
					domainId: domain.domainId,
					host: domain.host,
					https: domain.https,
					port: domain.port,
					path: domain.path,
				})) || [],
		})) || [];

	// Collect all domains from applications and services
	const allDomains: DomainInfo[] = [
		...applications.flatMap((app) => app.domains),
		...services.flatMap((service) => service.domains),
	];

	return {
		project: {
			projectId: project.projectId,
			name: project.name,
			env: project.env,
			applications,
			services,
			domains: allDomains,
		},
	};
}

/**
 * Create context for a database service
 */
export function createDatabaseContext(
	database: {
		id: string;
		name: string;
		appName: string;
		databaseName?: string;
	},
	project: {
		projectId: string;
		name: string;
		env?: string | null;
	},
	type: "postgres" | "mysql" | "mariadb" | "mongo" | "redis",
): EnvGenerationContext {
	const serviceInfo: ServiceInfo = {
		id: database.id,
		name: database.name,
		type,
		appName: database.appName,
		domains: [], // Databases typically don't have domains
	};

	return {
		project: {
			projectId: project.projectId,
			name: project.name,
			env: project.env,
			applications: [],
			services: [serviceInfo],
			domains: [],
		},
		currentService: {
			id: database.id,
			name: database.name,
			type,
			appName: database.appName,
		},
	};
}

/**
 * Merge environment variables giving priority to explicit over generated
 */
export function mergeEnvironmentVariables(
	explicit: Record<string, string>,
	generated: Record<string, string>,
): Record<string, string> {
	return { ...generated, ...explicit };
}

/**
 * Filter environment variables by category
 */
export function filterEnvByCategory(
	envVars: Record<string, string>,
	categories: Array<
		"project" | "application" | "service" | "domain" | "network" | "system"
	>,
): Record<string, string> {
	// This is a simplified version - in a real implementation you'd need to track categories
	// For now, we'll return all variables
	return envVars;
}

/**
 * Convert environment variables object to Docker-style array
 */
export function toDockerEnvArray(envVars: Record<string, string>): string[] {
	return Object.entries(envVars).map(([key, value]) => `${key}=${value}`);
}

/**
 * Convert environment variables to .env file format
 */
export function toEnvFileFormat(envVars: Record<string, string>): string {
	return Object.entries(envVars)
		.map(([key, value]) => {
			// Escape values that contain spaces or special characters
			if (value.includes(" ") || value.includes('"') || value.includes("'")) {
				return `${key}="${value.replace(/"/g, '\\"')}"`;
			}
			return `${key}=${value}`;
		})
		.join("\n");
}

/**
 * Extract database connection info from generated environment variables
 */
export function extractDatabaseConnectionInfo(
	envVars: Record<string, string>,
): {
	postgres: Array<{ name: string; host: string; port: string }>;
	mysql: Array<{ name: string; host: string; port: string }>;
	redis: Array<{ name: string; host: string; port: string }>;
	mongo: Array<{ name: string; host: string; port: string }>;
} {
	const result = {
		postgres: [] as Array<{ name: string; host: string; port: string }>,
		mysql: [] as Array<{ name: string; host: string; port: string }>,
		redis: [] as Array<{ name: string; host: string; port: string }>,
		mongo: [] as Array<{ name: string; host: string; port: string }>,
	};

	Object.keys(envVars).forEach((key) => {
		if (key.startsWith("POSTGRES_") && key.endsWith("_HOST")) {
			const name = key.replace("POSTGRES_", "").replace("_HOST", "");
			const portKey = `POSTGRES_${name}_PORT`;
			const host = envVars[key];
			if (host) {
				result.postgres.push({
					name,
					host,
					port: envVars[portKey] || "5432",
				});
			}
		} else if (key.startsWith("MYSQL_") && key.endsWith("_HOST")) {
			const name = key.replace("MYSQL_", "").replace("_HOST", "");
			const portKey = `MYSQL_${name}_PORT`;
			const host = envVars[key];
			if (host) {
				result.mysql.push({
					name,
					host,
					port: envVars[portKey] || "3306",
				});
			}
		} else if (key.startsWith("REDIS_") && key.endsWith("_HOST")) {
			const name = key.replace("REDIS_", "").replace("_HOST", "");
			const portKey = `REDIS_${name}_PORT`;
			const host = envVars[key];
			if (host) {
				result.redis.push({
					name,
					host,
					port: envVars[portKey] || "6379",
				});
			}
		} else if (key.startsWith("MONGO_") && key.endsWith("_HOST")) {
			const name = key.replace("MONGO_", "").replace("_HOST", "");
			const portKey = `MONGO_${name}_PORT`;
			const host = envVars[key];
			if (host) {
				result.mongo.push({
					name,
					host,
					port: envVars[portKey] || "27017",
				});
			}
		}
	});

	return result;
}

/**
 * Generate database connection URLs from environment variables
 */
export function generateConnectionUrls(
	envVars: Record<string, string>,
	credentials: {
		postgres?: Record<
			string,
			{ user: string; password: string; database: string }
		>;
		mysql?: Record<
			string,
			{ user: string; password: string; database: string }
		>;
		mongo?: Record<
			string,
			{ user: string; password: string; database: string }
		>;
		redis?: Record<string, { password?: string }>;
	} = {},
): Record<string, string> {
	const connectionUrls: Record<string, string> = {};
	const dbInfo = extractDatabaseConnectionInfo(envVars);

	// PostgreSQL URLs
	dbInfo.postgres.forEach((db) => {
		const creds = credentials.postgres?.[db.name];
		if (creds) {
			connectionUrls[`POSTGRES_${db.name}_URL`] =
				`postgresql://${creds.user}:${creds.password}@${db.host}:${db.port}/${creds.database}`;
		}
	});

	// MySQL URLs
	dbInfo.mysql.forEach((db) => {
		const creds = credentials.mysql?.[db.name];
		if (creds) {
			connectionUrls[`MYSQL_${db.name}_URL`] =
				`mysql://${creds.user}:${creds.password}@${db.host}:${db.port}/${creds.database}`;
		}
	});

	// MongoDB URLs
	dbInfo.mongo.forEach((db) => {
		const creds = credentials.mongo?.[db.name];
		if (creds) {
			connectionUrls[`MONGO_${db.name}_URL`] =
				`mongodb://${creds.user}:${creds.password}@${db.host}:${db.port}/${creds.database}`;
		}
	});

	// Redis URLs
	dbInfo.redis.forEach((db) => {
		const creds = credentials.redis?.[db.name];
		const auth = creds?.password ? `:${creds.password}@` : "";
		connectionUrls[`REDIS_${db.name}_URL`] =
			`redis://${auth}${db.host}:${db.port}`;
	});

	return connectionUrls;
}

/**
 * Create detailed service information from a project
 */
export function createDetailedServicesFromProject(project: any): any[] {
	const detailedServices: any[] = [];

	// Add applications
	if (project.applications) {
		for (const app of project.applications) {
			detailedServices.push({
				id: app.applicationId,
				name: app.name,
				type: "application",
				appName: app.appName,
				domains: app.domains || [],
				ports: app.ports || [],
			});
		}
	}

	// Add compose projects
	if (project.compose) {
		for (const compose of project.compose) {
			detailedServices.push({
				id: compose.composeId,
				name: compose.name,
				type: "compose",
				appName: compose.appName,
				domains: compose.domains || [],
				composeType: compose.composeType,
			});
		}
	}

	// Add postgres databases
	if (project.postgres) {
		for (const db of project.postgres) {
			detailedServices.push({
				id: db.postgresId,
				name: db.name,
				type: "postgres",
				appName: db.appName,
				domains: [],
				databaseName: db.databaseName,
				databaseUser: db.databaseUser,
				databasePassword: db.databasePassword,
				dockerImage: db.dockerImage,
				externalPort: db.externalPort,
			});
		}
	}

	// Add mysql databases
	if (project.mysql) {
		for (const db of project.mysql) {
			detailedServices.push({
				id: db.mysqlId,
				name: db.name,
				type: "mysql",
				appName: db.appName,
				domains: [],
				databaseName: db.databaseName,
				databaseUser: db.databaseUser,
				databasePassword: db.databasePassword,
				dockerImage: db.dockerImage,
				externalPort: db.externalPort,
			});
		}
	}

	// Add mariadb databases
	if (project.mariadb) {
		for (const db of project.mariadb) {
			detailedServices.push({
				id: db.mariadbId,
				name: db.name,
				type: "mariadb",
				appName: db.appName,
				domains: [],
				databaseName: db.databaseName,
				databaseUser: db.databaseUser,
				databasePassword: db.databasePassword,
				dockerImage: db.dockerImage,
				externalPort: db.externalPort,
			});
		}
	}

	// Add mongo databases
	if (project.mongo) {
		for (const db of project.mongo) {
			detailedServices.push({
				id: db.mongoId,
				name: db.name,
				type: "mongo",
				appName: db.appName,
				domains: [],
				databaseName: db.databaseName,
				databaseUser: db.databaseUser,
				databasePassword: db.databasePassword,
				dockerImage: db.dockerImage,
				externalPort: db.externalPort,
			});
		}
	}

	// Add redis databases
	if (project.redis) {
		for (const db of project.redis) {
			detailedServices.push({
				id: db.redisId,
				name: db.name,
				type: "redis",
				appName: db.appName,
				domains: [],
				databasePassword: db.databasePassword,
				dockerImage: db.dockerImage,
				externalPort: db.externalPort,
			});
		}
	}

	return detailedServices;
}
