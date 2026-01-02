import { chromium } from "playwright";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../../../db/src/index";
import { reports } from "../../../db/src/schema/reports";
import fs from "node:fs";
import path from "node:path";
import { env } from "../../../env/src/server";

// ============ LOGGING UTILITIES ============
function timestamp(): string {
	return new Date().toISOString();
}

function log(stage: string, message: string, data?: Record<string, unknown>) {
	const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
	console.log(`[${timestamp()}] [${stage}] ${message}${dataStr}`);
}

function logError(stage: string, message: string, error: unknown) {
	const errorMsg = error instanceof Error ? error.message : String(error);
	console.error(`[${timestamp()}] [${stage}] ERROR: ${message} | ${errorMsg}`);
}

// ============ TIMING UTILITIES ============
class Timer {
	private start: number;
	private laps: { name: string; duration: number }[] = [];
	private lastLap: number;

	constructor() {
		this.start = Date.now();
		this.lastLap = this.start;
	}

	lap(name: string): number {
		const now = Date.now();
		const duration = now - this.lastLap;
		this.laps.push({ name, duration });
		this.lastLap = now;
		return duration;
	}

	total(): number {
		return Date.now() - this.start;
	}

	summary(): string {
		return this.laps.map((l) => `${l.name}: ${l.duration}ms`).join(" | ");
	}
}

// ============ STATS TRACKING ============
const stats = {
	processed: 0,
	failed: 0,
	skipped: 0,
	totalTime: 0,
	times: [] as number[],

	avgTime(): number {
		if (this.times.length === 0) return 0;
		return Math.round(
			this.times.reduce((a, b) => a + b, 0) / this.times.length,
		);
	},

	eta(remaining: number): string {
		const avg = this.avgTime();
		if (avg === 0) return "calculating...";
		const ms = avg * remaining;
		const mins = Math.floor(ms / 60000);
		const secs = Math.floor((ms % 60000) / 1000);
		return `${mins}m ${secs}s`;
	},
};

// ============ API KEY SETUP ============
const apiKey =
	process.env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY;
log("INIT", "API Key check", {
	found: !!apiKey,
	length: apiKey?.length || 0,
	prefix: apiKey ? apiKey.substring(0, 7) : "N/A",
});

if (!apiKey) {
	throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set!");
}

const genAI = new GoogleGenerativeAI(apiKey);

// ============ INTERFACES ============
export interface ScrapedReport {
	janoshikId: string;
	title: string;
	url: string;
	testedBy: string;
	madeBy: string;
}

// ============ SCRAPING ============
export async function scrapePublicTests(): Promise<ScrapedReport[]> {
	const timer = new Timer();
	log("SCRAPE", "Fetching public tests list from Janoshik...");

	const response = await fetch("https://janoshik.com/public/");
	timer.lap("fetch");

	const html = await response.text();
	const $ = cheerio.load(html);
	const scrapedReports: ScrapedReport[] = [];

	$("#main .alt li").each((_, li) => {
		const a = $(li).find("a");
		const href = a.attr("href");
		if (!href) return;

		const h3 = a.find("h3");
		const h6 = a.find("h6");

		const fullTitle = h3.text().trim();
		const idMatch = fullTitle.match(/^#(\d+)/);
		const janoshikId = idMatch ? idMatch[1] : "";

		if (!janoshikId) return;

		const testedByText = h6.text().trim();
		const madeBy = h6.find("span").text().trim();
		const testedBy = testedByText.replace(madeBy, "").trim();

		scrapedReports.push({
			janoshikId,
			title: fullTitle,
			url: href,
			testedBy,
			madeBy,
		});
	});

	timer.lap("parse");
	log("SCRAPE", `Found ${scrapedReports.length} reports`, {
		timing: timer.summary(),
	});

	return scrapedReports;
}

// ============ SINGLE REPORT PROCESSING ============
export async function processReport(scraped: ScrapedReport): Promise<boolean> {
	const timer = new Timer();
	log("PROCESS", `Starting report #${scraped.janoshikId}`);

	const browser = await chromium.launch();
	timer.lap("browser-launch");

	const page = await browser.newPage();

	try {
		// Navigate to report page
		log("PROCESS", `Navigating to ${scraped.url}`);
		await page.goto(scraped.url, { timeout: 30000 });
		timer.lap("navigate");

		// Find download link
		log("PROCESS", "Looking for download link...");
		const downloadLink = await page.getAttribute(
			"#main > div > ul > ul > li:nth-child(1) > a",
			"href",
		);

		if (!downloadLink) {
			logError(
				"PROCESS",
				`No download link found for #${scraped.janoshikId}`,
				"Missing selector",
			);
			stats.skipped++;
			return false;
		}
		timer.lap("find-link");

		// Download image
		const imageUrl = new URL(downloadLink, scraped.url).toString();
		log("PROCESS", `Downloading image from ${imageUrl}`);

		const imageResponse = await fetch(imageUrl);
		if (!imageResponse.ok) {
			logError(
				"PROCESS",
				`Failed to download image`,
				`HTTP ${imageResponse.status}`,
			);
			stats.failed++;
			return false;
		}

		const buffer = await imageResponse.arrayBuffer();
		const imageBuffer = Buffer.from(buffer);
		timer.lap("download-image");
		log("PROCESS", `Downloaded image`, {
			size: `${Math.round(imageBuffer.length / 1024)}KB`,
		});

		// Save locally
		const reportsDir = path.join(process.cwd(), "apps/web/public/reports");
		if (!fs.existsSync(reportsDir)) {
			fs.mkdirSync(reportsDir, { recursive: true });
		}

		const fileName = `${scraped.janoshikId}_${scraped.title.replace(/[^a-z0-9]/gi, "_").substring(0, 50)}.png`;
		const filePath = path.join(reportsDir, fileName);
		fs.writeFileSync(filePath, imageBuffer);
		timer.lap("save-file");
		log("PROCESS", `Saved to ${fileName}`);

		// OCR with Gemini
		log("PROCESS", "Sending to Gemini for OCR...");
		const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
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

		const result = await model.generateContent([
			prompt,
			{
				inlineData: {
					data: imageBuffer.toString("base64"),
					mimeType: "image/png",
				},
			},
		]);
		timer.lap("gemini-ocr");

		const ocrText = result.response.text();
		log("PROCESS", "Gemini response received", { length: ocrText.length });

		const ocrData = JSON.parse(ocrText.replace(/```json|```/g, "").trim());
		log("PROCESS", "OCR data parsed", {
			peptide: ocrData.peptide_name,
			purity: ocrData.purity_percentage,
		});

		// Parse title for shipping notes
		const titleParts = scraped.title.split("|");
		const peptidePart = titleParts[0]
			.replace(`#${scraped.janoshikId}`, "")
			.trim();
		const shippingNotes = titleParts
			.slice(1)
			.map((p) => p.trim())
			.join(" | ");

		// Save to DB
		log("PROCESS", "Saving to database...");
		await db.insert(reports).values({
			janoshikId: scraped.janoshikId,
			title: scraped.title,
			vendor: scraped.testedBy,
			shippingNotes: shippingNotes,
			peptideName: ocrData.peptide_name || peptidePart,
			claimedAmount: peptidePart.match(/\d+mg/i)?.[0] || "",
			actualAmount: ocrData.content_amount,
			purity: ocrData.purity_percentage,
			reportImageUrl: `/reports/${fileName}`,
			rawOcrData: JSON.stringify(ocrData),
		});
		timer.lap("db-insert");

		const totalTime = timer.total();
		stats.times.push(totalTime);
		stats.processed++;

		log("PROCESS", `SUCCESS #${scraped.janoshikId}`, {
			totalTime: `${totalTime}ms`,
			breakdown: timer.summary(),
		});

		return true;
	} catch (error) {
		stats.failed++;
		logError("PROCESS", `FAILED #${scraped.janoshikId}`, error);
		return false;
	} finally {
		await browser.close();
	}
}

// ============ BATCH SYNC ============
export async function syncReports(limit?: number) {
	const syncTimer = new Timer();

	log("SYNC", "========== SYNC STARTED ==========");
	log("SYNC", `Limit: ${limit || "none (all reports)"}`);

	// Get existing reports
	log("SYNC", "Checking database for existing reports...");
	const existingReports = await db
		.select({ janoshikId: reports.janoshikId })
		.from(reports);
	const existingIds = new Set(existingReports.map((r) => r.janoshikId));
	log("SYNC", `Found ${existingIds.size} existing reports in database`);

	// Scrape new reports
	const scrapedList = await scrapePublicTests();
	const newReports = scrapedList.filter((r) => !existingIds.has(r.janoshikId));

	// Apply limit
	const toProcess = limit ? newReports.slice(0, limit) : newReports;

	log("SYNC", "Processing plan", {
		totalOnJanoshik: scrapedList.length,
		newReports: newReports.length,
		toProcess: toProcess.length,
		limit: limit || "none",
	});

	if (toProcess.length === 0) {
		log("SYNC", "No new reports to process!");
		return;
	}

	// Process each report
	for (let i = 0; i < toProcess.length; i++) {
		const report = toProcess[i];
		const remaining = toProcess.length - i - 1;

		log("SYNC", `========== [${i + 1}/${toProcess.length}] ==========`);
		log("SYNC", `Report: #${report.janoshikId}`, {
			remaining,
			eta: stats.eta(remaining),
			avgTime: `${stats.avgTime()}ms`,
		});

		await processReport(report);

		// Rate limit delay (except for last item)
		if (i < toProcess.length - 1) {
			log("SYNC", "Rate limit delay: 2 seconds...");
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	// Final summary
	const totalTime = syncTimer.total();
	log("SYNC", "========== SYNC COMPLETE ==========");
	log("SYNC", "Final stats", {
		processed: stats.processed,
		failed: stats.failed,
		skipped: stats.skipped,
		totalTime: `${Math.round(totalTime / 1000)}s`,
		avgPerReport: `${stats.avgTime()}ms`,
	});
}
