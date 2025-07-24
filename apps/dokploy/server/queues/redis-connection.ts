import type { ConnectionOptions } from "bullmq";

export const redisConfig: ConnectionOptions = {
	host:
		process.env.REDIS_HOST ||
		(process.env.NODE_ENV === "production"
			? "dokploy-redis"
			: "dokploy-redis-dev"),
};
