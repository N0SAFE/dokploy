import { initializePostgres } from "@dokploy/server/setup/postgres-setup";
import { initializeRedis } from "@dokploy/server/setup/redis-setup";

(async () => {
	try {
		console.log("Running development setup (skipping Docker operations)...");
		
		// Only initialize database connections, skip Docker setup
		await initializeRedis();
		await initializePostgres();
		
		console.log("Development setup completed successfully!");
	} catch (e) {
		console.error("Error in dokploy development setup", e);
		process.exit(1);
	}
})();
