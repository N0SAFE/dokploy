/**
 * Enhanced Environment Variable Generation System
 *
 * This module provides dynamic generation of environment variables for Dokploy
 * projects, applications, and services with comprehensive context awareness.
 */

// Re-export types from builders for convenience
export type { ApplicationNested } from "../builders";
export type { ComposeNested } from "../builders/compose";
// Helper functions
export {
	createApplicationContext,
	createComposeContext,
	createDatabaseContext,
	createDetailedServicesFromProject,
	createProjectContext,
	generateConnectionUrls,
	toDockerEnvArray,
	toEnvFileFormat,
} from "./helpers";
// Core classes and types
export {
	type EnvGenerationContext,
	EnvVariableGenerator,
	type GeneratedEnvVar,
	prepareEnhancedEnvironmentVariables,
} from "./index";
// Integration functions (main API)
export {
	generateProjectEnvironmentVariables,
	getQuickReferenceVariables,
	prepareApplicationEnvironmentVariables,
	prepareComposeEnvironmentVariables,
	prepareDatabaseEnvironmentVariables,
} from "./integration";
