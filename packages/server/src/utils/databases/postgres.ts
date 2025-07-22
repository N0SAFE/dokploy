import type { InferResultType } from "@dokploy/server/types/with";
import type { CreateServiceOptions } from "dockerode";
import {
	calculateResources,
	generateBindMounts,
	generateFileMounts,
	generateVolumeMounts,
} from "../docker/utils";
import { getRemoteDocker } from "../servers/remote-docker";
import { prepareDatabaseEnvironmentVariables } from "../env-generator/integration";

export type PostgresNested = InferResultType<
	"postgres",
	{ mounts: true; project: true }
>;
export const buildPostgres = async (postgres: PostgresNested) => {
	const {
		appName,
		env,
		externalPort,
		dockerImage,
		memoryLimit,
		memoryReservation,
		cpuLimit,
		cpuReservation,
		databaseName,
		databaseUser,
		databasePassword,
		command,
		mounts,
	} = postgres;

	const defaultPostgresEnv = `POSTGRES_DB="${databaseName}"\nPOSTGRES_USER="${databaseUser}"\nPOSTGRES_PASSWORD="${databasePassword}"${
		env ? `\n${env}` : ""
	}`;
	const resources = calculateResources({
		memoryLimit,
		memoryReservation,
		cpuLimit,
		cpuReservation,
	});
	const envVariables = prepareDatabaseEnvironmentVariables(
		{
			id: postgres.postgresId,
			name: postgres.name,
			appName: postgres.appName,
			env: defaultPostgresEnv,
			databaseName,
		},
		{
			projectId: postgres.project.projectId,
			name: postgres.project.name,
			env: postgres.project.env,
		},
		"postgres",
		{
			includeGenerated: true,
			categories: ["service", "network", "system"]
		}
	);
	const volumesMount = generateVolumeMounts(mounts);
	const bindsMount = generateBindMounts(mounts);
	const filesMount = generateFileMounts(appName, postgres);

	const docker = await getRemoteDocker(postgres.serverId);

	const settings: CreateServiceOptions = {
		Name: appName,
		TaskTemplate: {
			ContainerSpec: {
				Image: dockerImage,
				Env: envVariables,
				Mounts: [...volumesMount, ...bindsMount, ...filesMount],
				...(command
					? {
							Command: ["/bin/sh"],
							Args: ["-c", command],
						}
					: {}),
			},
			Networks: [{ Target: "dokploy-network" }],
			Resources: {
				...resources,
			},
			Placement: {
				Constraints: ["node.role==manager"],
			},
		},
		Mode: {
			Replicated: {
				Replicas: 1,
			},
		},
		EndpointSpec: {
			Mode: "dnsrr",
			Ports: externalPort
				? [
						{
							Protocol: "tcp",
							TargetPort: 5432,
							PublishedPort: externalPort,
							PublishMode: "host",
						},
					]
				: [],
		},
	};
	try {
		const service = docker.getService(appName);
		const inspect = await service.inspect();
		await service.update({
			version: Number.parseInt(inspect.Version.Index),
			...settings,
		});
	} catch (error) {
		console.log("error", error);
		await docker.createService(settings);
	}
};
