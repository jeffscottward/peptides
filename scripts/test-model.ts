import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: "apps/web/.env" });

async function test() {
	const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
	if (!apiKey) throw new Error("No API key");
	const genAI = new GoogleGenerativeAI(apiKey);
	try {
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
		const result = await model.generateContent("Hello");
		console.log("Success with gemini-1.5-flash:", result.response.text());
	} catch (err) {
		console.error("Failed with gemini-1.5-flash:", err);
	}
}
test();
