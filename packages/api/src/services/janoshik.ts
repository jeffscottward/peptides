import fs from "node:fs";
import path from "node:path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { db } from "../../../db/src/index";
import { reports } from "../../../db/src/schema/reports";
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

interface OCRResult {
	task_number: string | null;
	verify_key: string | null;
	sample_name: string | null;
	manufacturer: string | null;
	client_name: string | null;
	batch_number: string | null;
	testing_ordered: string | null;
	sample_received: string | null;
	report_date: string | null;
	peptide_name: string | null;
	purity_percentage: number | null;
	content_amount: string | null;
	comments: string | null;
	is_blend: boolean;
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
	log("SCRAPE", `Found ${scrapedReports.length} reports`);

	return scrapedReports;
}

// ============ OCR ENGINE ============
async function performOCR(imageBuffer: Buffer): Promise<OCRResult> {
	const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
	const prompt = `
    Analyze this Janoshik Analytical lab report image.
    Extract the following information into a structured JSON object.
    If a field is missing or unreadable, return null for that field.

    Fields to extract:
    - task_number: The "Task #" value (e.g., 95031)
    - verify_key: The "Verify key" value
    - sample_name: The "Sample" name listed in the header
    - manufacturer: The "Manufacturer" value
    - client_name: The "Client" value
    - batch_number: The "Batch" value
    - testing_ordered: The "Testing ordered" value
    - sample_received: The "Sample received" date
    - report_date: The "Report date" (usually at the top right or bottom)
    - peptide_name: The substance name identified in the results section
    - purity_percentage: The numeric purity percentage (e.g., 99.54)
    - content_amount: The amount found (e.g., "10.24 mg" or "24.38 iu")
    - comments: The full text of the "Comments" or analyst notes at the bottom
    - is_blend: Boolean. Set to true if the report mentions multiple substances, a mixture, or explicitly says "blend".

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

	const responseText = result.response.text();
	const cleanJson = responseText.replace(/```json|```/g, "").trim();
	return JSON.parse(cleanJson);
}

// ============ SINGLE REPORT PROCESSING ============
export async function processReport(scraped: ScrapedReport): Promise<boolean> {
	const timer = new Timer();
	log("PROCESS", `Starting report #${scraped.janoshikId}`);

	const reportsDir = path.join(process.cwd(), "apps/web/public/reports");
	if (!fs.existsSync(reportsDir)) {
		fs.mkdirSync(reportsDir, { recursive: true });
	}

	// 1. Check for local image
	const localFiles = fs.readdirSync(reportsDir);
	const localFileMatch = localFiles.find((f) =>
		f.startsWith(`${scraped.janoshikId}_`),
	);
	let imageBuffer: Buffer | null = null;
	let fileName = "";

	if (localFileMatch) {
		log("PROCESS", `Using local image: ${localFileMatch}`);
		imageBuffer = fs.readFileSync(path.join(reportsDir, localFileMatch));
		fileName = localFileMatch;
		timer.lap("local-read");
	} else {
		// 2. Fetch via Playwright if not local
		log("PROCESS", "Local image not found. Starting browser fetch...");
		const browser = await chromium.launch();
		timer.lap("browser-launch");
		const page = await browser.newPage();

		try {
			await page.goto(scraped.url, { timeout: 30000 });
			timer.lap("navigate");

			const downloadLink = await page.getAttribute(
				"#main > div > ul > ul > li:nth-child(1) > a",
				"href",
			);

			if (downloadLink) {
				const imageUrl = new URL(downloadLink, scraped.url).toString();
				const imageResponse = await fetch(imageUrl);
				if (imageResponse.ok) {
					const buffer = await imageResponse.arrayBuffer();
					imageBuffer = Buffer.from(buffer);
					timer.lap("download-image");

					fileName = `${scraped.janoshikId}_${scraped.title.replace(/[^a-z0-9]/gi, "_").substring(0, 50)}.png`;
					fs.writeFileSync(path.join(reportsDir, fileName), imageBuffer);
					timer.lap("save-file");
				}
			}
		} catch (err) {
			logError("PROCESS", "Browser fetch failed", err);
		} finally {
			await browser.close();
		}
	}

	if (!imageBuffer) {
		logError(
			"PROCESS",
			"No image source available",
			"Failed to find local or fetch remote",
		);
		stats.failed++;
		return false;
	}

	try {
		// 3. OCR
		log("PROCESS", "Sending to Gemini for Forensic OCR...");
		const ocrData = await performOCR(imageBuffer);
		timer.lap("gemini-ocr");

		// 4. Enrichment & Formatting
		const titleParts = scraped.title.split("|");
		const peptidePart =
			titleParts[0]?.replace(`#${scraped.janoshikId}`, "").trim() || "";
		const shippingNotes = titleParts
			.slice(1)
			.map((p) => p.trim())
			.join(" | ");

		// 5. Database Save
		log("PROCESS", "Saving to database...");
		await db.insert(reports).values({
			janoshikId: scraped.janoshikId,
			title: scraped.title,
			vendor: scraped.testedBy,
			shippingNotes: shippingNotes,
			peptideName: ocrData.peptide_name || peptidePart,
			claimedAmount: peptidePart.match(/\d+(mg|iu)/i)?.[0] || null,
			actualAmount: ocrData.content_amount,
			purity: ocrData.purity_percentage,
			reportImageUrl: `/reports/${fileName}`,
			rawOcrData: JSON.stringify(ocrData),

			// Forensic Data
			taskNumber: ocrData.task_number,
			verifyKey: ocrData.verify_key,
			batchNumber: ocrData.batch_number,
			clientName: ocrData.client_name,
			manufacturer: ocrData.manufacturer,
			madeBy: scraped.madeBy,

			// Context
			sampleName: ocrData.sample_name,
			testsRequested: ocrData.testing_ordered,
			assessmentOf: scraped.title.includes("Assessment")
				? "Assessment"
				: "Qualitative & Quantitative",

			// Timeline
			sampleReceivedDate: ocrData.sample_received,
			reportDate: ocrData.report_date,

			// Intelligence
			comments: ocrData.comments,
			isBlend: ocrData.is_blend,
		});
		timer.lap("db-insert");

		stats.times.push(timer.total());
		stats.processed++;
		log("PROCESS", `SUCCESS #${scraped.janoshikId}`, {
			total: `${timer.total()}ms`,
			breakdown: timer.summary(),
		});
		return true;
	} catch (error) {
		logError("PROCESS", `OCR/DB Error for #${scraped.janoshikId}`, error);
		stats.failed++;
		return false;
	}
}

// ============ BATCH SYNC ============
export async function syncReports(limit?: number) {
	const syncTimer = new Timer();
	log("SYNC", "========== FORENSIC SYNC STARTED ==========");

	const scrapedList = await scrapePublicTests();

	const existingReports = await db
		.select({ id: reports.janoshikId })
		.from(reports);
	const existingIds = new Set(existingReports.map((r) => r.id));
	const toProcess = scrapedList
		.filter((r) => !existingIds.has(r.janoshikId))
		.slice(0, limit || scrapedList.length);

	log("SYNC", `Planning to process ${toProcess.length} reports`);

	for (let i = 0; i < toProcess.length; i++) {
		const report = toProcess[i];
		if (!report) continue;

		const remaining = toProcess.length - i - 1;

		log("SYNC", `========== [${i + 1}/${toProcess.length}] ==========`);
		log("SYNC", `Report: #${report.janoshikId}`, {
			remaining,
			eta: stats.eta(remaining),
			avgTime: `${stats.avgTime()}ms`,
		});

		await processReport(report);

		// If it's NOT a local file, we should delay to be polite to Janoshik
		const reportsDir = path.join(process.cwd(), "apps/web/public/reports");
		const localFile = fs
			.readdirSync(reportsDir)
			.find((f) => f.startsWith(report.janoshikId));

		if (!localFile && i < toProcess.length - 1) {
			log("SYNC", "Rate limit delay (Remote): 2 seconds...");
			await new Promise((r) => setTimeout(r, 2000));
		}
	}

	log("SYNC", "========== SYNC COMPLETE ==========", {
		total: `${Math.round(syncTimer.total() / 1000)}s`,
		processed: stats.processed,
		failed: stats.failed,
	});
}
