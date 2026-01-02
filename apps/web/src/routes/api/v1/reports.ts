import { db } from "@my-better-t-app/db";
import { reports } from "@my-better-t-app/db/schema";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { desc } from "drizzle-orm";

export const APIRoute = createAPIFileRoute("/api/v1/reports")({
	GET: async ({ request }) => {
		try {
			const data = await db
				.select()
				.from(reports)
				.orderBy(desc(reports.createdAt));
			return new Response(JSON.stringify(data), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			});
		} catch (error) {
			return new Response(
				JSON.stringify({ error: "Failed to fetch reports" }),
				{
					status: 500,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}
	},
});
