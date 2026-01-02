import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTRPC } from "@/utils/trpc";
import { ReportTable } from "@/components/ReportTable";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	const trpc = useTRPC();

	const { data: reports = [], isLoading } = useQuery(
		trpc.reports.getAll.queryOptions(),
	);

	return (
		<div className="container mx-auto py-8 px-4">
			<header className="mb-8 flex items-end justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Peptide Tracker</h1>
					<p className="text-muted-foreground">
						Real-time lab results from Janoshik Analytical.
					</p>
				</div>
				<div className="text-right text-xs text-muted-foreground">
					{reports.length} reports tracked
				</div>
			</header>

			{isLoading ? (
				<div className="flex h-64 items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
				</div>
			) : (
				<ReportTable reports={reports} />
			)}
		</div>
	);
}
