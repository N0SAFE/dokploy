import type { WriteStream } from "node:fs";
import { prepareEnvironmentVariables } from "../docker/utils";
import { getBuildAppDirectory } from "../filesystem/directory";
import { spawnAsync } from "../process/spawnAsync";
import { createApplicationContext, EnvVariableGenerator } from "../env-generator/env-generator";
import { findDomainsByApplicationId } from "@dokploy/server/services/domain";
import { findProjectById } from "@dokploy/server/services/project";
import { createDetailedServicesFromProject } from "../env-generator/helpers";
import type { ApplicationNested } from ".";

export const buildPaketo = async (
	application: ApplicationNested,
	writeStream: WriteStream,
) => {
	const { env, appName, cleanCache } = application;
	const buildAppDirectory = getBuildAppDirectory(application);
	
	// Generate environment variables for this application
	const domains = await findDomainsByApplicationId(application.applicationId);
	const fullProject = await findProjectById(application.projectId);
	const context = createApplicationContext(application, domains);
	context.project.detailedServices = createDetailedServicesFromProject(fullProject);
	const generator = new EnvVariableGenerator(context);
	const generatedVars = generator.generateAll();
	
	const envVariables = prepareEnvironmentVariables(
		env,
		application.project.env,
		generatedVars,
	);
	try {
		const args = [
			"build",
			appName,
			"--path",
			buildAppDirectory,
			"--builder",
			"paketobuildpacks/builder-jammy-full",
		];

		if (cleanCache) {
			args.push("--clear-cache");
		}

		for (const env of envVariables) {
			args.push("--env", env);
		}

		await spawnAsync("pack", args, (data) => {
			if (writeStream.writable) {
				writeStream.write(data);
			}
		});
		return true;
	} catch (e) {
		throw e;
	}
};

export const getPaketoCommand = async (
	application: ApplicationNested,
	logPath: string,
) => {
	const { env, appName, cleanCache } = application;

	const buildAppDirectory = getBuildAppDirectory(application);
	
	// Generate environment variables for this application
	const domains = await findDomainsByApplicationId(application.applicationId);
	const fullProject = await findProjectById(application.projectId);
	const context = createApplicationContext(application, domains);
	context.project.detailedServices = createDetailedServicesFromProject(fullProject);
	const generator = new EnvVariableGenerator(context);
	const generatedVars = generator.generateAll();
	
	const envVariables = prepareEnvironmentVariables(
		env,
		application.project.env,
		generatedVars,
	);

	const args = [
		"build",
		appName,
		"--path",
		buildAppDirectory,
		"--builder",
		"paketobuildpacks/builder-jammy-full",
	];

	if (cleanCache) {
		args.push("--clear-cache");
	}

	for (const env of envVariables) {
		args.push("--env", `'${env}'`);
	}

	const command = `pack ${args.join(" ")}`;
	const bashCommand = `
echo "Starting Paketo build..." >> ${logPath};
${command} >> ${logPath} 2>> ${logPath} || { 
  echo "❌ Paketo build failed" >> ${logPath};
  exit 1;
}
echo "✅ Paketo build completed." >> ${logPath};
		`;

	return bashCommand;
};
