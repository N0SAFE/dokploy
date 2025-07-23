import { Eye, EyeOff, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { api } from "@/utils/api";

interface Props {
	applicationId: string;
	env?: string;
	projectEnv?: string;
}

export const ShowEvaluatedEnvironment = ({ applicationId, env, projectEnv }: Props) => {
	const [showValues, setShowValues] = useState(false);
	const [showGenerated, setShowGenerated] = useState(false);

	const { data, error, isLoading } = api.application.evaluateEnvironmentVariables.useQuery(
		{ 
			applicationId,
			...(env !== undefined && { env }),
			...(projectEnv !== undefined && { projectEnv }),
		},
		{ enabled: !!applicationId }
	);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Environment Variable Preview</CardTitle>
					<CardDescription>Loading environment variable evaluation...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-sm text-muted-foreground">Evaluating variables...</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Environment Variable Preview</CardTitle>
					<CardDescription>Failed to evaluate environment variables</CardDescription>
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
	const generatedCount = data?.generatedVariables?.length || 0;

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

	// Group generated variables by category
	const groupedGeneratedVars = (data?.generatedVariables || []).reduce((acc, variable) => {
		const category = variable.category;
		if (!acc[category]) {
			acc[category] = [];
		}
		acc[category].push(variable);
		return acc;
	}, {} as Record<string, typeof data.generatedVariables>);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							Environment Variable Preview
							{hasError ? (
								<Badge variant="destructive">Error</Badge>
							) : (
								<div className="flex gap-2">
									<Badge variant="secondary">{evaluatedCount} resolved</Badge>
									{generatedCount > 0 && (
										<Badge variant="outline">{generatedCount} available</Badge>
									)}
								</div>
							)}
						</CardTitle>
						<CardDescription>
							Preview how your environment variables will be resolved at runtime
						</CardDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowValues(!showValues)}
						disabled={evaluatedCount === 0 && generatedCount === 0}
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
							Successfully resolved {evaluatedCount} environment variables.
							{data?.projectEnvironment && " Project-level variables are also available for resolution."}
						</AlertDescription>
					</Alert>
				)}

				{evaluatedCount === 0 && !hasError && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							No environment variables defined. Add variables in the Environment Settings section above to see their resolved values here.
						</AlertDescription>
					</Alert>
				)}

				{/* Resolved Environment Variables Section */}
				{evaluatedCount > 0 && (
					<div>
						<div className="mb-2 text-sm font-medium">Resolved Environment Variables:</div>
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

				{/* Generated Variables Section */}
				{generatedCount > 0 && (
					<Collapsible open={showGenerated} onOpenChange={setShowGenerated}>
						<CollapsibleTrigger asChild>
							<Button variant="ghost" className="w-full justify-between p-0">
								<div className="flex items-center gap-2">
									<Info className="h-4 w-4" />
									<span className="text-sm font-medium">
										Available Generated Variables ({generatedCount})
									</span>
								</div>
								{showGenerated ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>
						<CollapsibleContent className="space-y-3 mt-3">
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription>
									These variables are automatically generated by Dokploy and available for use in your environment variables.
									You can reference them using <code>${"{{VARIABLE_NAME}}"}</code> syntax.
								</AlertDescription>
							</Alert>
							
							{Object.entries(groupedGeneratedVars).map(([category, variables]) => (
								<div key={category} className="space-y-2">
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="capitalize">
											{category}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{variables.length} variable{variables.length !== 1 ? 's' : ''}
										</span>
									</div>
									<div className="bg-muted p-3 rounded-md">
										{variables.map((variable) => (
											<div key={variable.key} className="mb-2 last:mb-0">
												<div className="flex items-center gap-2">
													<code className="text-xs font-mono bg-background px-1 py-0.5 rounded">
														{variable.key}
													</code>
													<span className="text-xs text-muted-foreground">
														{showValues ? `= ${variable.value}` : '= •••••••••'}
													</span>
												</div>
												{variable.description && (
													<div className="text-xs text-muted-foreground mt-1 ml-1">
														{variable.description}
													</div>
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</CollapsibleContent>
					</Collapsible>
				)}

				<div className="text-xs text-muted-foreground border-t pt-3">
					<strong>Environment Variable Resolution:</strong>
					<ul className="mt-1 space-y-1 ml-4">
						<li>• <code>${"{{VARIABLE}}"}</code> - Resolves to same-scope variables first, then project variables</li>
						<li>• <code>${"{{project.VARIABLE}}"}</code> - Explicitly resolves to project-level variables</li>
						<li>• Variables can reference other variables in complex chains</li>
						<li>• Circular dependencies are automatically detected and prevented</li>
						{generatedCount > 0 && (
							<li>• Generated variables are automatically available for reference</li>
						)}
					</ul>
				</div>
			</CardContent>
		</Card>
	);
};