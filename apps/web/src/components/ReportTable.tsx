import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ClipboardCheck,
	ExternalLink,
	FlaskConical,
	History,
	Info,
	Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Report {
	id: number;
	janoshikId: string;
	title: string;
	vendor: string | null;
	shippingNotes: string | null;
	peptideName: string | null;
	claimedAmount: string | null;
	actualAmount: string | null;
	purity: number | null;
	reportImageUrl: string | null;
	rawOcrData: string | null;
	createdAt: string | Date;

	// Forensic Data
	taskNumber?: string | null;
	verifyKey?: string | null;
	batchNumber?: string | null;
	clientName?: string | null;
	manufacturer?: string | null;
	madeBy?: string | null;
	sampleName?: string | null;
	sampleDescription?: string | null;
	testsRequested?: string | null;
	assessmentOf?: string | null;
	sampleReceivedDate?: string | null;
	reportDate?: string | null;
	comments?: string | null;
	isBlend?: boolean | null;
}

interface ReportTableProps {
	reports: Report[];
}

type SortConfig = {
	key: keyof Report | "content";
	direction: "asc" | "desc" | null;
};

export function ReportTable({ reports }: ReportTableProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedReport, setSelectedReport] = useState<Report | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [sortConfig, setSortConfig] = useState<SortConfig>({
		key: "janoshikId",
		direction: "desc",
	});

	const handleRowClick = (report: Report) => {
		setSelectedReport(report);
		setIsSheetOpen(true);
	};

	const handleSort = (key: keyof Report | "content") => {
		let direction: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		} else if (sortConfig.key === key && sortConfig.direction === "desc") {
			direction = null;
		}
		setSortConfig({ key, direction });
	};

	const sortedReports = useMemo(() => {
		const items = [...reports];
		if (sortConfig.direction === null) return items;

		return items.sort((a, b) => {
			let aValue: any;
			let bValue: any;

			if (sortConfig.key === "content") {
				aValue = a.actualAmount || a.claimedAmount || "";
				bValue = b.actualAmount || b.claimedAmount || "";
			} else {
				aValue = a[sortConfig.key as keyof Report] ?? "";
				bValue = b[sortConfig.key as keyof Report] ?? "";
			}

			if (typeof aValue === "string") aValue = aValue.toLowerCase();
			if (typeof bValue === "string") bValue = bValue.toLowerCase();

			if (aValue < bValue) {
				return sortConfig.direction === "asc" ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortConfig.direction === "asc" ? 1 : -1;
			}
			return 0;
		});
	}, [reports, sortConfig]);

	const filteredReports = useMemo(() => {
		return sortedReports.filter((report) => {
			const searchStr =
				`${report.peptideName} ${report.vendor} ${report.manufacturer} ${report.janoshikId}`.toLowerCase();
			return searchStr.includes(searchTerm.toLowerCase());
		});
	}, [sortedReports, searchTerm]);

	const getSortIcon = (key: keyof Report | "content") => {
		if (sortConfig.key !== key || sortConfig.direction === null) {
			return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
		}
		return sortConfig.direction === "asc" ? (
			<ArrowUp className="ml-2 h-4 w-4" />
		) : (
			<ArrowDown className="ml-2 h-4 w-4" />
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search forensics, peptides, vendors..."
						className="pl-8"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			<div className="rounded-md border">
				<Table className="table-fixed">
					<TableHeader>
						<TableRow className="bg-muted/50">
							<TableHead className="w-[80px] pl-4">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold cursor-pointer"
									onClick={() => handleSort("janoshikId")}
								>
									<span>ID</span>
									{getSortIcon("janoshikId")}
								</Button>
							</TableHead>
							<TableHead className="w-[200px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold cursor-pointer"
									onClick={() => handleSort("peptideName")}
								>
									<span>Peptide</span>
									{getSortIcon("peptideName")}
								</Button>
							</TableHead>
							<TableHead className="w-[180px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold cursor-pointer"
									onClick={() => handleSort("vendor")}
								>
									<span>Vendor / Mfr</span>
									{getSortIcon("vendor")}
								</Button>
							</TableHead>
							<TableHead className="w-[90px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold cursor-pointer"
									onClick={() => handleSort("purity")}
								>
									<span>Purity</span>
									{getSortIcon("purity")}
								</Button>
							</TableHead>
							<TableHead className="w-[120px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold cursor-pointer"
									onClick={() => handleSort("content")}
								>
									<span>Content</span>
									{getSortIcon("content")}
								</Button>
							</TableHead>
							<TableHead className="w-[400px] pr-4">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold cursor-pointer"
									onClick={() => handleSort("shippingNotes")}
								>
									<span>Shipping / Notes</span>
									{getSortIcon("shippingNotes")}
								</Button>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredReports.length > 0 ? (
							filteredReports.map((report) => (
								<TableRow
									key={report.id}
									className="group cursor-pointer hover:bg-muted/50"
									onClick={() => handleRowClick(report)}
								>
									<TableCell className="font-mono text-xs pl-4">
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
											#{report.janoshikId}
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-col">
											<span className="font-bold text-sm truncate">
												{report.peptideName}
											</span>
											<span className="text-[10px] text-muted-foreground truncate">
												{report.assessmentOf || "Lab Report"}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<div className="flex flex-col gap-1">
											<Badge
												variant="secondary"
												className="w-fit text-[10px] py-0 px-1.5"
											>
												{report.vendor || "Unknown"}
											</Badge>
											{report.manufacturer && (
												<span className="text-[10px] text-muted-foreground italic px-1 truncate">
													[{report.manufacturer}]
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide flex items-center gap-1">
											{report.isBlend ? (
												<Badge
													variant="outline"
													className="border-primary text-primary font-bold text-[10px]"
												>
													BLEND
												</Badge>
											) : report.purity ? (
												<Badge
													variant={report.purity >= 99 ? "success" : "default"}
													className="font-mono text-[10px]"
												>
													{report.purity}%
												</Badge>
											) : (
												<span className="text-muted-foreground text-xs">
													N/A
												</span>
											)}
										</div>
									</TableCell>
									<TableCell>
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide py-1 text-sm font-black max-w-[120px]">
											{report.actualAmount || report.claimedAmount || "N/A"}
										</div>
									</TableCell>
									<TableCell className="w-[400px] pr-4">
										<div
											className="overflow-x-auto whitespace-nowrap scrollbar-hide text-xs text-muted-foreground"
											title={report.shippingNotes || ""}
										>
											{report.shippingNotes}
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="h-24 text-center">
									No forensic reports found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent
					side="right"
					className="w-[350px] sm:w-[450px] overflow-y-auto p-0 gap-0"
					hideCloseButton
				>
					{selectedReport && (
						<div className="flex flex-col h-full">
							<div className="p-6 bg-primary text-primary-foreground">
								<SheetHeader className="text-left">
									<div className="flex justify-between items-start">
										<SheetTitle className="text-primary-foreground text-2xl font-black">
											REPORT #{selectedReport.janoshikId}
										</SheetTitle>
										<Badge
											variant="outline"
											className="text-primary-foreground border-primary-foreground/30"
										>
											{selectedReport.assessmentOf || "Forensic"}
										</Badge>
									</div>
									<SheetDescription className="text-primary-foreground/80 text-lg font-medium leading-tight">
										{selectedReport.peptideName}
										<br />
										<span className="text-sm">
											Tested for {selectedReport.vendor}
										</span>
									</SheetDescription>
								</SheetHeader>

								<div className="grid grid-cols-2 gap-3 mt-6">
									<div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm border border-white/10">
										<div className="text-[10px] uppercase tracking-widest font-bold opacity-70">
											Purity
										</div>
										<div className="text-3xl font-black">
											{selectedReport.purity
												? `${selectedReport.purity}%`
												: "N/A"}
										</div>
									</div>
									<div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm border border-white/10">
										<div className="text-[10px] uppercase tracking-widest font-bold opacity-70">
											Amount Found
										</div>
										<div className="text-3xl font-black truncate">
											{selectedReport.isBlend
												? "BLEND"
												: selectedReport.actualAmount || "N/A"}
										</div>
									</div>
								</div>
							</div>

							<div className="p-6 space-y-8 flex-1">
								<section className="space-y-3">
									<div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
										<ClipboardCheck className="h-4 w-4" />
										<span>Logistics</span>
									</div>
									<div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
										<div>
											<div className="text-muted-foreground text-[10px] uppercase font-bold">
												Task #
											</div>
											<div className="font-mono font-medium">
												{selectedReport.taskNumber || selectedReport.janoshikId}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-[10px] uppercase font-bold">
												Verify Key
											</div>
											<div
												className="font-mono font-medium truncate"
												title={selectedReport.verifyKey || ""}
											>
												{selectedReport.verifyKey || "N/A"}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-[10px] uppercase font-bold">
												Manufacturer
											</div>
											<div className="font-medium">
												{selectedReport.manufacturer || "N/A"}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-[10px] uppercase font-bold">
												Batch
											</div>
											<div className="font-mono font-medium">
												{selectedReport.batchNumber || "N/A"}
											</div>
										</div>
									</div>
								</section>

								<section className="space-y-3">
									<div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
										<History className="h-4 w-4" />
										<span>Timeline & Scope</span>
									</div>
									<div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-muted">
										<div className="flex justify-between items-center text-xs">
											<div className="flex items-center gap-1.5">
												<div className="h-2 w-2 rounded-full bg-orange-400" />
												<span className="text-muted-foreground">Received:</span>
											</div>
											<span className="font-bold">
												{selectedReport.sampleReceivedDate || "Unknown"}
											</span>
										</div>
										<div className="flex justify-between items-center text-xs">
											<div className="flex items-center gap-1.5">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<span className="text-muted-foreground">Reported:</span>
											</div>
											<span className="font-bold">
												{selectedReport.reportDate || "Unknown"}
											</span>
										</div>
										<div className="pt-2 border-t border-muted-foreground/10">
											<div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
												Tests Requested
											</div>
											<div className="text-xs italic leading-tight">
												{selectedReport.testsRequested || "Standard Analysis"}
											</div>
										</div>
									</div>
								</section>

								{selectedReport.comments && (
									<section className="space-y-3">
										<div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
											<Info className="h-4 w-4" />
											<span>Analyst Comments</span>
										</div>
										<div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
											{selectedReport.comments}
										</div>
									</section>
								)}

								<section className="space-y-3">
									<div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tighter">
										<FlaskConical className="h-4 w-4" />
										<span>Original Report</span>
									</div>
									{selectedReport.reportImageUrl ? (
										<div className="border-4 border-white shadow-xl rounded-sm overflow-hidden bg-white group relative">
											<img
												src={selectedReport.reportImageUrl}
												alt={`Janoshik Report ${selectedReport.janoshikId}`}
												className="w-full h-auto transition-transform group-hover:scale-105 cursor-zoom-in"
											/>
										</div>
									) : (
										<div className="h-20 flex items-center justify-center border border-dashed rounded-md text-muted-foreground text-xs italic">
											Lab sheet image not cached locally.
										</div>
									)}
								</section>
							</div>

							<div className="p-6 pt-0 mt-auto">
								<a
									href={`https://www.janoshik.com/tests/${selectedReport.janoshikId}`}
									target="_blank"
									rel="noopener noreferrer"
									className={cn(
										buttonVariants({ variant: "default", size: "lg" }),
										"w-full gap-2 text-sm font-black uppercase tracking-widest",
									)}
								>
									View Official Result <ExternalLink className="h-4 w-4" />
								</a>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
