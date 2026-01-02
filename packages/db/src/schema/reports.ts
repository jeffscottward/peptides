import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const reports = sqliteTable("reports", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	janoshikId: text("janoshik_id").notNull().unique(),
	title: text("title").notNull(),
	vendor: text("vendor"),
	shippingNotes: text("shipping_notes"),
	peptideName: text("peptide_name"),
	claimedAmount: text("claimed_amount"),
	actualAmount: text("actual_amount"),
	purity: real("purity"),
	reportImageUrl: text("report_image_url"),
	rawOcrData: text("raw_ocr_data"), // JSON string

	// Forensic Details
	taskNumber: text("task_number"),
	verifyKey: text("verify_key"),
	batchNumber: text("batch_number"),
	clientName: text("client_name"),
	manufacturer: text("manufacturer"),
	madeBy: text("made_by"),

	// Context
	sampleName: text("sample_name"),
	sampleDescription: text("sample_description"),
	testsRequested: text("tests_requested"),
	assessmentOf: text("assessment_of"),

	// Timeline
	sampleReceivedDate: text("sample_received_date"),
	reportDate: text("report_date"),

	// Intelligence
	comments: text("comments"),
	isBlend: integer("is_blend", { mode: "boolean" }).default(false),

	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
