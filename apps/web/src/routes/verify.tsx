import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/verify")({
	component: VerifyComponent,
});

function VerifyComponent() {
	const [taskNumber, setTaskNumber] = useState("");
	const [verifyKey, setVerifyKey] = useState("");

	const handleVerify = (e: React.FormEvent) => {
		e.preventDefault();

		// Clean the task number (remove # if present)
		const cleanTaskNumber = taskNumber.replace(/^#/, "").trim();

		if (!cleanTaskNumber) {
			return;
		}

		// Build the Janoshik verify URL
		// The verify page uses POST, but we can link directly to the test page
		// Format: https://www.janoshik.com/tests/{taskNumber}-{key} or just the task number
		let verifyUrl = `https://www.janoshik.com/tests/${cleanTaskNumber}`;

		// If there's a verify key, append it
		if (verifyKey.trim()) {
			verifyUrl = `https://www.janoshik.com/verify/?task=${cleanTaskNumber}&key=${encodeURIComponent(verifyKey.trim())}`;
		}

		// Open in new tab
		window.open(verifyUrl, "_blank", "noopener,noreferrer");
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<header className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">Verify Report</h1>
				<p className="text-muted-foreground">
					Verify the authenticity of any test conducted by Janoshik Analytical
				</p>
			</header>

			<div className="max-w-md mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Report Verification</CardTitle>
						<CardDescription>
							Enter the task number and verification key from your lab report to
							verify its authenticity on Janoshik.com
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleVerify} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="taskNumber">Task Number</Label>
								<Input
									id="taskNumber"
									type="text"
									placeholder="Task number (eg. #00000)"
									value={taskNumber}
									onChange={(e) => setTaskNumber(e.target.value)}
									className="text-center"
								/>
								<p className="text-xs text-muted-foreground">
									Located on the top left of each report
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="verifyKey">Unique Key (Optional)</Label>
								<Input
									id="verifyKey"
									type="text"
									placeholder="Unique key"
									value={verifyKey}
									onChange={(e) => setVerifyKey(e.target.value)}
									className="text-center"
								/>
								<p className="text-xs text-muted-foreground">
									Located on the bottom of each report. Not required for public
									tests.
								</p>
							</div>

							<Button type="submit" className="w-full gap-2">
								Verify on Janoshik.com
								<ExternalLink className="h-4 w-4" />
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
