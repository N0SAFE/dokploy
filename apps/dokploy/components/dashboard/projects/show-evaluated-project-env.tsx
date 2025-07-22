import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api } from "@/utils/api";

interface Props {
	projectId: string;
}

export const ShowEvaluatedProjectEnvironment = ({ projectId }: Props) => {
	const [showValues, setShowValues] = useState(false);

	const { data, error, isLoading } = api.project.evaluateEnvironmentVariables.useQuery(
		{ projectId },
		{ enabled: !!projectId }
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Project Environment Preview</CardTitle>
					<CardDescription>Loading project environment variable evaluation...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-sm text-muted-foreground">Evaluating project variables...</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Project Environment Preview</CardTitle>
					<CardDescription>Failed to evaluate project environment variables</CardDescription>
				</CardHeader>
				<CardContent>
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error.message}</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		);
	}

	const hasError = data?.error;
	const evaluatedCount = Object.keys(data?.evaluatedEnvironment || {}).length;

	// Convert evaluated environment to display format
	const evaluatedEnvString = Object.entries(data?.evaluatedEnvironment || {})
		.map(([key, value]) => {
			if (showValues) {
				return `${key}=${value}`;
			} else {
				// Mask the values for security
				return `${key}=${'•'.repeat(Math.min(8, String(value).length))}`;
			}
		})
		.join('\n');

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							Project Environment Preview
							{hasError ? (
								<Badge variant="destructive">Error</Badge>
							) : (
								<Badge variant="secondary">{evaluatedCount} variables</Badge>
							)}
						</CardTitle>
						<CardDescription>
							Preview how your project-level environment variables will be resolved
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowValues(!showValues)}
						disabled={evaluatedCount === 0}
					>
						{showValues ? (
							<>
								<EyeOff className="h-4 w-4 mr-2" />
								Hide Values
							</>
						) : (
							<>
								<Eye className="h-4 w-4 mr-2" />
								Show Values
							</>
						)}
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{hasError && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>Evaluation Error:</strong> {data.error}
						</AlertDescription>
					</Alert>
				)}

				{!hasError && evaluatedCount > 0 && (
					<Alert>
						<CheckCircle2 className="h-4 w-4" />
						<AlertDescription>
							Successfully resolved {evaluatedCount} project environment variables.
						</AlertDescription>
					</Alert>
				)}

				{evaluatedCount === 0 && !hasError && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							No project environment variables defined. Add variables in the Project Environment section above to see their resolved values here.
						</AlertDescription>
					</Alert>
				)}

				{evaluatedCount > 0 && (
					<div>
						<div className="mb-2 text-sm font-medium">Resolved Project Environment Variables:</div>
						<pre className="bg-muted p-3 rounded-md text-sm min-h-[100px] overflow-auto">
							{evaluatedEnvString || "No environment variables to display"}
						</pre>
						{!showValues && evaluatedCount > 0 && (
							<p className="text-xs text-muted-foreground mt-2">
								Values are hidden for security. Click "Show Values" to reveal them.
							</p>
						)}
					</div>
				)}

				<div className="text-xs text-muted-foreground border-t pt-3">
					<strong>Project Environment Variable Resolution:</strong>
					<ul className="mt-1 space-y-1 ml-4">
						<li>• <code>${"{{VARIABLE}}"}</code> - Resolves to project-level variables</li>
						<li>• Variables can reference other variables in complex chains</li>
						<li>• Circular dependencies are automatically detected and prevented</li>
						<li>• These variables are available to all services in this project via <code>${"{{project.VARIABLE}}"}</code></li>
					</ul>
				</div>
			</CardContent>
		</Card>
	);
};