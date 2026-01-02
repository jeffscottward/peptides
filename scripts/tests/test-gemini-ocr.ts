import "dotenv/config";
import fs from "node:fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testOCR() {
	const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
	console.log(
		"Using API Key:",
		apiKey ? `${apiKey.substring(0, 8)}...` : "MISSING",
	);

	if (!apiKey) {
		console.error("No API key found in .env");
		return;
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	// Using the preview model for Gemini 3 Flash as verified
	const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

	const imagePath = "/Users/jeffscottward/Desktop/Test Report #72125.png";
	if (!fs.existsSync(imagePath)) {
		console.error("Image not found at:", imagePath);
		return;
	}

	const imageBuffer = fs.readFileSync(imagePath);

	const prompt = `
    Analyze this lab test report from Janoshik Analytical.
    Extract the following data in JSON format:
    - peptide_name: The name of the substance being tested.
    - purity_percentage: The purity percentage found (as a number, e.g. 99.5).
    - content_amount: The amount of substance found per vial (e.g. "12.5 mg").
    - test_date: The date of the report.
    - verification_code: The verification code if present.
    
    Return ONLY the JSON.
  `;

	try {
		console.log("Sending request to Gemini...");
		const result = await model.generateContent([
			prompt,
			{
				inlineData: {
					data: imageBuffer.toString("base64"),
					mimeType: "image/png",
				},
			},
		]);

		const response = await result.response;
		const text = response.text();
		console.log("Gemini Response:");
		console.log(text);
	} catch (error) {
		console.error("Error calling Gemini API:", error);
	}
}

testOCR();
