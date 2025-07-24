import type { WriteStream } from "node:fs";
import { prepareEnvironmentVariables } from "@dokploy/server/utils/docker/utils";
import {
	getBuildAppDirectory,
	getDockerContextPath,
} from "../filesystem/directory";
import { spawnAsync } from "../process/spawnAsync";
import { createApplicationContext, EnvVariableGenerator } from "../env-generator/env-generator";
import { findDomainsByApplicationId } from "@dokploy/server/services/domain";
import { findProjectById } from "@dokploy/server/services/project";
import { createDetailedServicesFromProject } from "../env-generator/helpers";
import type { ApplicationNested } from ".";
import { createEnvFile, createEnvFileCommand } from "./utils";

export const buildCustomDocker = async (
	application: ApplicationNested,
	writeStream: WriteStream,
) => {
	const {
		appName,
		env,
		publishDirectory,
		buildArgs,
		dockerBuildStage,
		cleanCache,
	} = application;
	const dockerFilePath = getBuildAppDirectory(application);
	try {
		console.log(`Building custom Docker for ${appName}...`);
		writeStream.write(`Building custom Docker for ${appName}...\n`);
		const image = `${appName}`;

		const defaultContextPath =
			dockerFilePath.substring(0, dockerFilePath.lastIndexOf("/") + 1) || ".";
		
		// Generate environment variables for this application
		const domains = await findDomainsByApplicationId(application.applicationId);
		const fullProject = await findProjectById(application.projectId);
		const context = createApplicationContext(application, domains);
		context.project.detailedServices = createDetailedServicesFromProject(fullProject);
		console.log(`Context for application ${application.applicationId}:`, context);
		const generator = new EnvVariableGenerator(context);
		const generatedVars = generator.generateAll();
		
		console.log(`Generated environment variables for application ${application.applicationId}:`, generatedVars);
		console.log('generating env variables for docker build', {
			buildArgs,
			projectEnv: application.project.env,
			generatedVars,
		});
		const args = prepareEnvironmentVariables(
			buildArgs,
			application.project.env,
			generatedVars,
		);

		const dockerContextPath = getDockerContextPath(application);

		const commandArgs = ["build", "-t", image, "-f", dockerFilePath, "."];

		if (cleanCache) {
			commandArgs.push("--no-cache");
		}

		if (dockerBuildStage) {
			commandArgs.push("--target", dockerBuildStage);
		}

		for (const arg of args) {
			commandArgs.push("--build-arg", arg);
		}
		/*
			Do not generate an environment file when publishDirectory is specified,
			as it could be publicly exposed.
		*/
		if (!publishDirectory) {
			createEnvFile(dockerFilePath, env, application.project.env, generatedVars);
		}

		await spawnAsync(
			"docker",
			commandArgs,
			(data) => {
				if (writeStream.writable) {
					writeStream.write(data);
				}
			},
			{
				cwd: dockerContextPath || defaultContextPath,
			},
		);
	} catch (error) {
		throw error;
	}
};

export const getDockerCommand = async (
	application: ApplicationNested,
	logPath: string,
) => {
	const {
		appName,
		env,
		publishDirectory,
		buildArgs,
		dockerBuildStage,
		cleanCache,
	} = application;
	const dockerFilePath = getBuildAppDirectory(application);

	try {
		const image = `${appName}`;

		const defaultContextPath =
			dockerFilePath.substring(0, dockerFilePath.lastIndexOf("/") + 1) || ".";
		
		// Generate environment variables for this application
		const domains = await findDomainsByApplicationId(application.applicationId);
		const fullProject = await findProjectById(application.projectId);
		const context = createApplicationContext(application, domains);
		context.project.detailedServices = createDetailedServicesFromProject(fullProject);
		const generator = new EnvVariableGenerator(context);
		const generatedVars = generator.generateAll();
		
		const args = prepareEnvironmentVariables(
			buildArgs,
			application.project.env,
			generatedVars,
		);

		const dockerContextPath =
			getDockerContextPath(application) || defaultContextPath;

		const commandArgs = ["build", "-t", image, "-f", dockerFilePath, "."];

		if (dockerBuildStage) {
			commandArgs.push("--target", dockerBuildStage);
		}

		if (cleanCache) {
			commandArgs.push("--no-cache");
		}

		for (const arg of args) {
			commandArgs.push("--build-arg", `'${arg}'`);
		}

		/*
			Do not generate an environment file when publishDirectory is specified,
			as it could be publicly exposed.
		*/
		let command = "";
		if (!publishDirectory) {
			command += createEnvFileCommand(
				dockerFilePath,
				env,
				application.project.env,
				generatedVars,
			);
		}

		command += `
echo "Building ${appName}" >> ${logPath};
cd ${dockerContextPath} >> ${logPath} 2>> ${logPath} || { 
  echo "❌ The path ${dockerContextPath} does not exist" >> ${logPath};
  exit 1;
}

docker ${commandArgs.join(" ")} >> ${logPath} 2>> ${logPath} || { 
  echo "❌ Docker build failed" >> ${logPath};
  exit 1;
}
echo "✅ Docker build completed." >> ${logPath};
		`;

		return command;
	} catch (error) {
		throw error;
	}
};
