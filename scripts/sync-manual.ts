import "dotenv/config";
import { syncReports } from "../packages/api/src/services/janoshik";

async function run() {
	// Parse optional limit from command line: bun run sync-manual.ts 10
	const limitArg = process.argv[2];
	const limit = limitArg ? parseInt(limitArg, 10) : undefined;

	console.log("Starting sync...");
	if (limit) {
		console.log(`Limit set to: ${limit} reports`);
	}

	try {
		await syncReports(limit);
		console.log("Sync finished successfully.");
	} catch (error) {
		console.error("Sync failed:", error);
		process.exit(1);
	}
}

run();
