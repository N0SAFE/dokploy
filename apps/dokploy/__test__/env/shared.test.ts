import { prepareEnvironmentVariables } from "@dokploy/server/index";
import { describe, expect, it } from "vitest";

const projectEnv = `
ENVIRONMENT=staging
DATABASE_URL=postgres://postgres:postgres@localhost:5432/project_db
PORT=3000
`;
const serviceEnv = `
ENVIRONMENT=\${{project.ENVIRONMENT}}
DATABASE_URL=\${{project.DATABASE_URL}}
SERVICE_PORT=4000
`;

describe("prepareEnvironmentVariables", () => {
	it("resolves project variables correctly", () => {
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"ENVIRONMENT=staging",
			"DATABASE_URL=postgres://postgres:postgres@localhost:5432/project_db",
			"SERVICE_PORT=4000",
		]);
	});

	it("handles undefined project variables", () => {
		const incompleteProjectEnv = `
		NODE_ENV=production
		`;

		const invalidServiceEnv = `
		UNDEFINED_VAR=\${{project.UNDEFINED_VAR}}
		`;

		expect(
			() =>
				prepareEnvironmentVariables(invalidServiceEnv, incompleteProjectEnv), // Cambiado el orden
		).toThrow("Invalid project environment variable: project.UNDEFINED_VAR");
	});
	it("allows service-specific variables to override project variables", () => {
		const serviceSpecificEnv = `
		ENVIRONMENT=production
		DATABASE_URL=\${{project.DATABASE_URL}}
		`;

		const resolved = prepareEnvironmentVariables(
			serviceSpecificEnv,
			projectEnv,
		);

		expect(resolved).toEqual([
			"ENVIRONMENT=production", // Overrides project variable
			"DATABASE_URL=postgres://postgres:postgres@localhost:5432/project_db",
		]);
	});

	it("resolves complex references for dynamic endpoints", () => {
		const projectEnv = `
BASE_URL=https://api.example.com
API_VERSION=v1
PORT=8000
`;
		const serviceEnv = `
API_ENDPOINT=\${{project.BASE_URL}}/\${{project.API_VERSION}}/endpoint
SERVICE_PORT=9000
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"API_ENDPOINT=https://api.example.com/v1/endpoint",
			"SERVICE_PORT=9000",
		]);
	});

	it("handles missing project variables gracefully", () => {
		const projectEnv = `
PORT=8080
`;
		const serviceEnv = `
MISSING_VAR=\${{project.MISSING_KEY}}
SERVICE_PORT=3000
`;

		expect(() => prepareEnvironmentVariables(serviceEnv, projectEnv)).toThrow(
			"Invalid project environment variable: project.MISSING_KEY",
		);
	});

	it("overrides project variables with service-specific values", () => {
		const projectEnv = `
ENVIRONMENT=staging
DATABASE_URL=postgres://project:project@localhost:5432/project_db
`;
		const serviceEnv = `
ENVIRONMENT=\${{project.ENVIRONMENT}}
DATABASE_URL=postgres://service:service@localhost:5432/service_db
SERVICE_NAME=my-service
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"ENVIRONMENT=staging",
			"DATABASE_URL=postgres://service:service@localhost:5432/service_db",
			"SERVICE_NAME=my-service",
		]);
	});

	it("handles project variables with normal and unusual characters", () => {
		const projectEnv = `
ENVIRONMENT=PRODUCTION
`;

		// Needs to be in quotes
		const serviceEnv = `
NODE_ENV=\${{project.ENVIRONMENT}}
SPECIAL_VAR="$^@$^@#$^@!#$@#$-\${{project.ENVIRONMENT}}"
`;

		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"NODE_ENV=PRODUCTION",
			"SPECIAL_VAR=$^@$^@#$^@!#$@#$-PRODUCTION",
		]);
	});

	it("handles complex cases with multiple references, special characters, and spaces", () => {
		const projectEnv = `
ENVIRONMENT=STAGING
APP_NAME=MyApp
`;

		const serviceEnv = `
NODE_ENV=\${{project.ENVIRONMENT}}
COMPLEX_VAR="Prefix-$#^!@-\${{project.ENVIRONMENT}}--\${{project.APP_NAME}} Suffix "
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"NODE_ENV=STAGING",
			"COMPLEX_VAR=Prefix-$#^!@-STAGING--MyApp Suffix ",
		]);
	});

	it("handles references enclosed in single quotes", () => {
		const projectEnv = `
	ENVIRONMENT=STAGING
	APP_NAME=MyApp
	`;

		const serviceEnv = `
	NODE_ENV='\${{project.ENVIRONMENT}}'
	COMPLEX_VAR='Prefix-$#^!@-\${{project.ENVIRONMENT}}--\${{project.APP_NAME}} Suffix'
	`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"NODE_ENV=STAGING",
			"COMPLEX_VAR=Prefix-$#^!@-STAGING--MyApp Suffix",
		]);
	});

	it("handles double and single quotes combined", () => {
		const projectEnv = `
ENVIRONMENT=PRODUCTION
APP_NAME=MyApp
`;
		const serviceEnv = `
NODE_ENV="'\${{project.ENVIRONMENT}}'"
COMPLEX_VAR="'Prefix \"DoubleQuoted\" and \${{project.APP_NAME}}'"
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"NODE_ENV='PRODUCTION'",
			"COMPLEX_VAR='Prefix \"DoubleQuoted\" and MyApp'",
		]);
	});

	// New tests for same-scope variable resolution
	it("resolves same-scope variables using \${{VARIABLE}} syntax", () => {
		const serviceEnv = `
TEST=test_value
OTHER=\${{TEST}}
FINAL=prefix_\${{OTHER}}_suffix
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, null);

		expect(resolved).toEqual([
			"TEST=test_value",
			"OTHER=test_value",
			"FINAL=prefix_test_value_suffix",
		]);
	});

	it("resolves multiple same-scope variable references in one value", () => {
		const serviceEnv = `
HOST=localhost
PORT=3000
DATABASE=mydb
CONNECTION_STRING=\${{HOST}}:\${{PORT}}/\${{DATABASE}}
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, null);

		expect(resolved).toEqual([
			"HOST=localhost",
			"PORT=3000",
			"DATABASE=mydb",
			"CONNECTION_STRING=localhost:3000/mydb",
		]);
	});

	it("prioritizes same-scope variables over project variables", () => {
		const projectEnv = `
DATABASE_URL=project_database
PORT=8080
`;
		const serviceEnv = `
DATABASE_URL=service_database
API_URL=\${{DATABASE_URL}}
SERVER_PORT=\${{PORT}}
PROJECT_PORT=\${{project.PORT}}
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"DATABASE_URL=service_database",
			"API_URL=service_database",
			"SERVER_PORT=8080",
			"PROJECT_PORT=8080",
		]);
	});

	it("falls back to project scope when same-scope variable not found", () => {
		const projectEnv = `
FALLBACK_VAR=from_project
SHARED_VAR=project_value
`;
		const serviceEnv = `
SHARED_VAR=service_value
RESOLVED_FALLBACK=\${{FALLBACK_VAR}}
RESOLVED_SHARED=\${{SHARED_VAR}}
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"SHARED_VAR=service_value",
			"RESOLVED_FALLBACK=from_project",
			"RESOLVED_SHARED=service_value",
		]);
	});

	it("throws error when variable not found in either scope", () => {
		const projectEnv = `
EXISTING_VAR=exists
`;
		const serviceEnv = `
UNDEFINED_VAR=\${{NONEXISTENT}}
`;

		expect(() => prepareEnvironmentVariables(serviceEnv, projectEnv)).toThrow(
			"Invalid environment variable: NONEXISTENT",
		);
	});

	it("handles circular dependencies by throwing an error", () => {
		const serviceEnv = `
VAR_A=\${{VAR_B}}
VAR_B=\${{VAR_A}}
`;

		expect(() => prepareEnvironmentVariables(serviceEnv, null)).toThrow(
			"Circular dependency detected in environment variables",
		);
	});

	it("resolves complex dependency chains", () => {
		const serviceEnv = `
BASE=foundation
LEVEL1=\${{BASE}}_level1
LEVEL2=\${{LEVEL1}}_level2  
LEVEL3=\${{LEVEL2}}_level3
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, null);

		expect(resolved).toEqual([
			"BASE=foundation",
			"LEVEL1=foundation_level1",
			"LEVEL2=foundation_level1_level2",
			"LEVEL3=foundation_level1_level2_level3",
		]);
	});

	it("maintains backwards compatibility with project variables", () => {
		const projectEnv = `
PROJECT_DB=project_database
PROJECT_HOST=project.example.com
`;
		const serviceEnv = `
DATABASE_URL=\${{project.PROJECT_DB}}
HOST=\${{project.PROJECT_HOST}}
SAME_SCOPE_VAR=local_value
LOCAL_REF=\${{SAME_SCOPE_VAR}}
`;
		const resolved = prepareEnvironmentVariables(serviceEnv, projectEnv);

		expect(resolved).toEqual([
			"DATABASE_URL=project_database",
			"HOST=project.example.com",
			"SAME_SCOPE_VAR=local_value",
			"LOCAL_REF=local_value",
		]);
	});
});
