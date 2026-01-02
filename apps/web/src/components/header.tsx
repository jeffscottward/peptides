import { Link } from "@tanstack/react-router";

export default function Header() {
	const links = [{ to: "/", label: "Home" }] as const;

	return (
		<div>
			<div className="flex flex-row items-center justify-between px-4 py-2">
				<nav className="flex gap-6 text-sm font-medium">
					{links.map(({ to, label }) => {
						return (
							<Link
								key={to}
								to={to}
								className="hover:text-primary transition-colors"
							>
								{label}
							</Link>
						);
					})}
					<a
						href="/api/v1/reports"
						className="hover:text-primary transition-colors"
						target="_blank"
						rel="noreferrer"
					>
						API
					</a>
				</nav>
				<div className="flex items-center gap-2"></div>
			</div>
			<hr />
		</div>
	);
}
