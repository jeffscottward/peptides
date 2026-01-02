import React, { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Search, ExternalLink, Eye } from "lucide-react";
import type { Report } from "@my-better-t-app/db/schema";

interface ReportTableProps {
	reports: Report[];
}

export function ReportTable({ reports }: ReportTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedReport, setSelectedReport] = useState<Report | null>(null);

	const filteredReports = reports.filter((report) => {
		const searchStr =
			`${report.peptideName} ${report.vendor} ${report.shippingNotes} ${report.janoshikId}`.toLowerCase();
		return searchStr.includes(searchTerm.toLowerCase());
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search peptides, vendors, IDs..."
						className="pl-8"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				{/* Sync button disabled - use scripts/sync-manual.ts instead */}
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/50">
							<TableHead className="w-[100px]">ID</TableHead>
							<TableHead>Peptide</TableHead>
							<TableHead>Vendor</TableHead>
							<TableHead>Purity</TableHead>
							<TableHead>Content</TableHead>
							<TableHead className="max-w-[300px]">Shipping / Notes</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredReports.length > 0 ? (
							filteredReports.map((report) => (
								<TableRow
									key={report.id}
									className="group cursor-pointer hover:bg-muted/50"
								>
									<TableCell className="font-mono text-xs">
										#{report.janoshikId}
									</TableCell>
									<TableCell className="font-medium">
										{report.peptideName}
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className="whitespace-nowrap">
											{report.vendor}
										</Badge>
									</TableCell>
									<TableCell>
										{report.purity ? (
											<Badge
												variant={report.purity >= 99 ? "success" : "default"}
												className="font-mono"
											>
												{report.purity}%
											</Badge>
										) : (
											<span className="text-muted-foreground">N/A</span>
										)}
									</TableCell>
									<TableCell className="whitespace-nowrap">
										{report.actualAmount || report.claimedAmount}
									</TableCell>
									<TableCell
										className="max-w-[300px] truncate text-xs text-muted-foreground"
										title={report.shippingNotes || ""}
									>
										{report.shippingNotes}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Sheet>
												<SheetTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setSelectedReport(report)}
													>
														<Eye className="h-4 w-4" />
													</Button>
												</SheetTrigger>
												<SheetContent
													side="right"
													className="sm:max-w-2xl overflow-y-auto"
												>
													{selectedReport && (
														<>
															<SheetHeader>
																<SheetTitle>
																	Report #{selectedReport.janoshikId}
																</SheetTitle>
																<SheetDescription>
																	{selectedReport.peptideName} tested by{" "}
																	{selectedReport.vendor}
																</SheetDescription>
															</SheetHeader>
															<div className="mt-6 space-y-6">
																<div className="grid grid-cols-2 gap-4">
																	<div className="rounded-lg border p-3">
																		<div className="text-xs text-muted-foreground uppercase tracking-wider">
																			Purity
																		</div>
																		<div className="text-xl font-bold">
																			{selectedReport.purity}%
																		</div>
																	</div>
																	<div className="rounded-lg border p-3">
																		<div className="text-xs text-muted-foreground uppercase tracking-wider">
																			Amount
																		</div>
																		<div className="text-xl font-bold">
																			{selectedReport.actualAmount ||
																				selectedReport.claimedAmount}
																		</div>
																	</div>
																</div>

																<div className="space-y-2">
																	<h4 className="font-medium text-sm">
																		Shipping & Notes
																	</h4>
																	<p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
																		{selectedReport.shippingNotes ||
																			"No extra notes available."}
																	</p>
																</div>

																<div className="space-y-2">
																	<h4 className="font-medium text-sm">
																		Original Report Image
																	</h4>
																	{selectedReport.reportImageUrl ? (
																		<div className="border rounded-md overflow-hidden">
																			<img
																				src={selectedReport.reportImageUrl}
																				alt={`Janoshik Report ${selectedReport.janoshikId}`}
																				className="w-full h-auto"
																			/>
																		</div>
																	) : (
																		<div className="h-40 flex items-center justify-center border border-dashed rounded-md text-muted-foreground text-sm">
																			Image not available locally.
																		</div>
																	)}
																</div>

																<Button className="w-full gap-2" asChild>
																	<a
																		href={`https://www.janoshik.com/tests/${selectedReport.janoshikId}`}
																		target="_blank"
																		rel="noopener noreferrer"
																	>
																		View on Janoshik.com{" "}
																		<ExternalLink className="h-4 w-4" />
																	</a>
																</Button>
															</div>
														</>
													)}
												</SheetContent>
											</Sheet>
											<Button variant="ghost" size="icon" asChild>
												<a
													href={`https://www.janoshik.com/tests/${report.janoshikId}`}
													target="_blank"
													rel="noopener noreferrer"
												>
													<ExternalLink className="h-4 w-4" />
												</a>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={7} className="h-24 text-center">
									No reports found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
