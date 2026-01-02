import { publicProcedure, router } from "../index";
import { reportsRouter } from "./reports";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	reports: reportsRouter,
});
export type AppRouter = typeof appRouter;
