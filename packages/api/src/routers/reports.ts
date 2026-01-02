import { desc } from "drizzle-orm";
import { db } from "../../../db/src/index";
import { reports } from "../../../db/src/schema/reports";
import { publicProcedure, router } from "../index";

export const reportsRouter = router({
	getAll: publicProcedure.query(async () => {
		return await db.select().from(reports).orderBy(desc(reports.createdAt));
	}),

	// Note: Sync is disabled in web UI as it requires playwright (use scripts/sync-manual.ts instead)
	// sync: publicProcedure.mutation(async () => {
	// 	const { syncReports } = await import("../services/janoshik");
	// 	await syncReports();
	// 	return { success: true };
	// }),
});
