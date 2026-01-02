import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ExternalLink,
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

// Define Report interface locally to avoid workspace import issues
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

			// Handle string comparison
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
				`${report.peptideName} ${report.vendor} ${report.shippingNotes} ${report.janoshikId}`.toLowerCase();
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
						placeholder="Search peptides, vendors, IDs..."
						className="pl-8"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			<div className="rounded-md border overflow-hidden">
				<Table className="table-fixed">
					<TableHeader>
						<TableRow className="bg-muted/50">
							<TableHead className="w-[80px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold"
									onClick={() => handleSort("janoshikId")}
								>
									<span>ID</span>
									{getSortIcon("janoshikId")}
								</Button>
							</TableHead>
							<TableHead className="w-[120px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold"
									onClick={() => handleSort("peptideName")}
								>
									<span>Peptide</span>
									{getSortIcon("peptideName")}
								</Button>
							</TableHead>
							<TableHead className="w-[300px] max-w-[300px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold"
									onClick={() => handleSort("vendor")}
								>
									<span>Vendor</span>
									{getSortIcon("vendor")}
								</Button>
							</TableHead>
							<TableHead className="w-[100px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold"
									onClick={() => handleSort("purity")}
								>
									<span>Purity</span>
									{getSortIcon("purity")}
								</Button>
							</TableHead>
							<TableHead className="w-[250px] max-w-[250px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold"
									onClick={() => handleSort("content")}
								>
									<span>Content</span>
									{getSortIcon("content")}
								</Button>
							</TableHead>
							<TableHead className="w-[300px] max-w-[300px]">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-3 h-8 font-bold"
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
									<TableCell className="font-mono text-xs">
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
											#{report.janoshikId}
										</div>
									</TableCell>
									<TableCell className="font-medium">
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide max-w-[120px]">
											{report.peptideName}
										</div>
									</TableCell>
									<TableCell className="w-[300px] max-w-[300px]">
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide max-w-[300px]">
											<Badge variant="secondary" className="whitespace-nowrap">
												{report.vendor}
											</Badge>
										</div>
									</TableCell>
									<TableCell className="w-[100px] max-w-[100px]">
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
											{report.purity ? (
												<Badge
													variant={report.purity >= 99 ? "success" : "default"}
													className="font-mono"
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
									<TableCell className="w-[250px] max-w-[250px]">
										<div className="overflow-x-auto whitespace-nowrap scrollbar-hide py-1 text-sm font-semibold max-w-[250px]">
											{report.actualAmount || report.claimedAmount}
										</div>
									</TableCell>
									<TableCell className="w-[300px] max-w-[300px]">
										<div
											className="overflow-x-auto whitespace-nowrap scrollbar-hide text-xs text-muted-foreground max-w-[300px]"
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
									No reports found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent
					side="right"
					className="w-[400px] sm:w-[600px] overflow-y-auto"
				>
					{selectedReport && (
						<>
							<SheetHeader>
								<SheetTitle className="text-2xl">
									Report #{selectedReport.janoshikId}
								</SheetTitle>
								<SheetDescription className="text-lg">
									{selectedReport.peptideName} tested by {selectedReport.vendor}
								</SheetDescription>
							</SheetHeader>
							<div className="mt-6 space-y-6">
								<div className="grid grid-cols-2 gap-4">
									<div className="rounded-lg border p-4 bg-muted/30">
										<div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
											Purity
										</div>
										<div className="text-3xl font-black text-primary">
											{selectedReport.purity
												? `${selectedReport.purity}%`
												: "N/A"}
										</div>
									</div>
									<div className="rounded-lg border p-4 bg-muted/30">
										<div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
											Amount Found
										</div>
										<div className="text-3xl font-black text-primary">
											{selectedReport.actualAmount ||
												selectedReport.claimedAmount}
										</div>
									</div>
								</div>

								<div className="space-y-2">
									<h4 className="font-bold text-sm uppercase tracking-tight text-muted-foreground">
										Shipping & Notes
									</h4>
									<p className="text-base text-foreground bg-muted p-4 rounded-md border">
										{selectedReport.shippingNotes ||
											"No extra notes available."}
									</p>
								</div>

								<div className="space-y-2">
									<h4 className="font-bold text-sm uppercase tracking-tight text-muted-foreground">
										Original Report Image
									</h4>
									{selectedReport.reportImageUrl ? (
										<div className="border rounded-md overflow-hidden shadow-lg bg-white">
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

								<a
									href={`https://www.janoshik.com/tests/${selectedReport.janoshikId}`}
									target="_blank"
									rel="noopener noreferrer"
									className={cn(
										buttonVariants({ variant: "default", size: "lg" }),
										"w-full gap-2 text-lg font-bold",
									)}
								>
									View Official Result on Janoshik.com{" "}
									<ExternalLink className="h-5 w-5" />
								</a>
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
