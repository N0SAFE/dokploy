import type { WriteStream } from "node:fs";
import { prepareEnvironmentVariables } from "../docker/utils";
import { getBuildAppDirectory } from "../filesystem/directory";
import { spawnAsync } from "../process/spawnAsync";
import { createApplicationContext, EnvVariableGenerator } from "../env-generator/env-generator";
import { findDomainsByApplicationId } from "@dokploy/server/services/domain";
import { findProjectById } from "@dokploy/server/services/project";
import { createDetailedServicesFromProject } from "../env-generator/helpers";
import type { ApplicationNested } from ".";

// TODO: integrate in the vps sudo chown -R $(whoami) ~/.docker
export const buildHeroku = async (
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
			`heroku/builder:${application.herokuVersion || "24"}`,
		];

		for (const env of envVariables) {
			args.push("--env", env);
		}

		if (cleanCache) {
			args.push("--clear-cache");
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

export const getHerokuCommand = async (
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
		`heroku/builder:${application.herokuVersion || "24"}`,
	];

	if (cleanCache) {
		args.push("--clear-cache");
	}

	for (const env of envVariables) {
		args.push("--env", `'${env}'`);
	}

	const command = `pack ${args.join(" ")}`;
	const bashCommand = `
echo "Starting heroku build..." >> ${logPath};
${command} >> ${logPath} 2>> ${logPath} || { 
  echo "❌ Heroku build failed" >> ${logPath};
  exit 1;
}
echo "✅ Heroku build completed." >> ${logPath};
		`;

	return bashCommand;
};
