import {
	generateProjectEnvironmentVariables,
	getQuickReferenceVariables,
	prepareApplicationEnvironmentVariables,
	prepareComposeEnvironmentVariables,
} from "./integration";

/**
 * Example usage of the enhanced environment variable system
 * This file demonstrates how to use the new dynamic env variable generation
 */

// Example 1: Enhanced application deployment
export const deployApplicationWithEnhancedEnv = async (application: any) => {
	// Get environment variables with generated ones included
	const envVars = await prepareApplicationEnvironmentVariables(application, {
		includeGenerated: true,
		categories: ["project", "application", "domain", "network", "system"],
	});

	console.log(
		"Generated environment variables for application:",
		application.appName,
	);
	envVars.forEach((envVar) => console.log(`  ${envVar}`));

	// Environment variables will include:
	// - PROJECT_GENERATED_URL=https://my-project.example.com
	// - APP_URL=https://my-app.example.com
	// - APP_MY_APP_URL=https://my-app.example.com
	// - DOKPLOY_PROJECT_ID=proj_123
	// - DOKPLOY_APPLICATION_ID=app_456
	// - DOCKER_NETWORK=dokploy-my-project
	// - And many more...

	return envVars;
};

// Example 2: Compose service deployment
export const deployComposeWithEnhancedEnv = async (compose: any) => {
	const envVars = await prepareComposeEnvironmentVariables(compose, {
		includeGenerated: true,
		categories: ["project", "service", "network"],
	});

	console.log("Generated environment variables for compose:", compose.appName);
	envVars.forEach((envVar) => console.log(`  ${envVar}`));

	return envVars;
};

// Example 3: Full project environment generation
export const generateFullProjectEnvironment = async (
	project: any,
	applications: any[],
	services: any[],
) => {
	const envData = await generateProjectEnvironmentVariables(
		project,
		applications,
		services,
		{
			categories: [
				"project",
				"application",
				"service",
				"domain",
				"network",
				"system",
			],
		},
	);

	console.log("Project-level variables:");
	Object.entries(envData.project).forEach(([key, value]) => {
		console.log(`  ${key}=${value}`);
	});

	console.log("\nApplication variables:");
	Object.entries(envData.applications).forEach(([appName, vars]) => {
		console.log(`  Application: ${appName}`);
		Object.entries(vars).forEach(([key, value]) => {
			console.log(`    ${key}=${value}`);
		});
	});

	console.log("\nService variables:");
	Object.entries(envData.services).forEach(([serviceName, vars]) => {
		console.log(`  Service: ${serviceName}`);
		Object.entries(vars).forEach(([key, value]) => {
			console.log(`    ${key}=${value}`);
		});
	});

	return envData;
};

// Example 4: Quick reference variables
export const getQuickApplicationUrls = (context: any) => {
	const quickRefs = getQuickReferenceVariables(context);

	console.log("Quick reference variables:");
	console.log(`  Main App URL: ${quickRefs.appUrl}`);
	console.log(`  Project URL: ${quickRefs.projectUrl}`);

	console.log("  Database Hosts:");
	Object.entries(quickRefs.databaseHosts).forEach(([name, host]) => {
		console.log(`    ${name}: ${host}`);
	});

	console.log("  Service URLs:");
	Object.entries(quickRefs.serviceUrls).forEach(([name, url]) => {
		console.log(`    ${name}: ${url}`);
	});

	return quickRefs;
};

// Example 5: Docker Compose integration
export const generateDockerComposeEnv = async (application: any) => {
	const envVars = await prepareApplicationEnvironmentVariables(application, {
		includeGenerated: true,
	});

	// Convert to .env file format
	const envFileContent = envVars.join("\n");

	// Or convert to Docker Compose environment format
	const dockerComposeEnv = envVars.reduce(
		(acc, envVar) => {
			const [key, value] = envVar.split("=");
			if (key && value) {
				acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string>,
	);

	return {
		envFileContent,
		dockerComposeEnv,
	};
};

// Example 6: Template variable replacement
export const replaceTemplateVariables = async (
	template: string,
	application: any,
): Promise<string> => {
	const envVars = await prepareApplicationEnvironmentVariables(application, {
		includeGenerated: true,
	});

	let result = template;

	// Replace environment variables in template
	envVars.forEach((envVar) => {
		const [key, value] = envVar.split("=");
		if (key && value) {
			// Support both ${VARIABLE} and ${{VARIABLE}} syntax
			result = result.replace(new RegExp(`\\$\\{\\{${key}\\}\\}`, "g"), value);
			result = result.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
		}
	});

	return result;
};

// Example usage patterns for different scenarios:

/* 
1. Simple application deployment:
```typescript
const envVars = await prepareApplicationEnvironmentVariables(application);
// Use envVars in Docker container or deployment
```

2. Multi-service project setup:
```typescript
const projectEnv = await generateProjectEnvironmentVariables(project, apps, services);
// Deploy each service with its specific environment
```

3. Template-based deployment:
```typescript
const deployConfig = await replaceTemplateVariables(configTemplate, application);
// Use deployConfig for Kubernetes, Docker Compose, etc.
```

4. Quick URL access:
```typescript
const urls = getQuickReferenceVariables(context);
// Access urls.appUrl, urls.databaseHosts, etc.
```

Generated variables examples:
- PROJECT_GENERATED_URL: Main project URL
- PROJECT_GENERATED_[PROJECT_NAME]_URL: Specific project URL
- APP_URL: Main application URL
- APP_[APP_NAME]_URL: Specific application URL
- SERVICE_[SERVICE_NAME]_HOST: Service host
- SERVICE_[SERVICE_NAME]_PORT: Service port
- SERVICE_[SERVICE_NAME]_URL: Service URL
- DOKPLOY_PROJECT_ID: Project identifier
- DOKPLOY_APPLICATION_ID: Application identifier
- DOKPLOY_SERVICE_ID: Service identifier
- DOCKER_NETWORK: Docker network name
- DATABASE_[TYPE]_HOST: Database host
- DATABASE_[TYPE]_PORT: Database port
- DATABASE_[TYPE]_URL: Database connection URL
*/
