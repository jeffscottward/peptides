import { appRouter } from "@my-better-t-app/api/routers/index";
import { createFileRoute } from "@tanstack/react-router";

async function handler() {
	try {
		const data = await appRouter
			.createCaller({ session: null })
			.reports.getAll();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch {
		return new Response(JSON.stringify({ error: "Failed to fetch reports" }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
}

export const Route = createFileRoute("/api/v1/reports")({
	server: {
		handlers: {
			GET: handler,
		},
	},
});
