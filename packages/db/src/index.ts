import { createClient } from "@libsql/client";
import { env } from "@my-better-t-app/env/server";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

// Parse DATABASE_URL to extract url and authToken
const dbUrl = env.DATABASE_URL;
const urlParts = dbUrl.split("?");
const url = urlParts[0] as string;
const queryString = urlParts[1];
const authToken = queryString
	?.split("&")
	.find((p) => p.startsWith("authToken="))
	?.split("=")[1];

const client = createClient({
	url,
	authToken,
});

export const db = drizzle({ client, schema });
