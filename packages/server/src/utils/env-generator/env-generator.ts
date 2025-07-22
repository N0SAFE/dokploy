/**
 * Enhanced Environment Variable Generation System
 * 
 * This module provides dynamic generation of environment variables for Dokploy
 * projects, applications, and services with comprehensive context awareness.
 */

// Core classes and types
export {
	EnvVariableGenerator,
	type EnvGenerationContext,
	type GeneratedEnvVar,
	prepareEnhancedEnvironmentVariables
} from './index';

// Helper functions
export {
	createApplicationContext,
	createComposeContext,
	createProjectContext,
	createDatabaseContext,
	toDockerEnvArray,
	toEnvFileFormat,
	generateConnectionUrls
} from './helpers';

// Integration functions (main API)
export {
	prepareApplicationEnvironmentVariables,
	prepareComposeEnvironmentVariables,
	prepareDatabaseEnvironmentVariables,
	generateProjectEnvironmentVariables,
	getQuickReferenceVariables
} from './integration';

// Re-export types from builders for convenience
export type { ApplicationNested } from '../builders';
export type { ComposeNested } from '../builders/compose';
