import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/utils/api";
import { ExternalLink, GitBranch, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ShowMonorepoPreviewSettings } from "./show-monorepo-preview-settings";

interface Props {
	monorepoId: string;
}

export const ShowMonorepoPreviewDeployments = ({ monorepoId }: Props) => {
	const { data: monorepo } = api.monorepo.one.useQuery({ monorepoId });
	const { data: previewDeployments, refetch } = api.previewDeployments.all.useQuery({
		monorepoId,
	});

	const { mutateAsync: redeployPreview, isLoading: isRedeploying } =
		api.previewDeployments.redeploy.useMutation();
	
	const { mutateAsync: deletePreview, isLoading: isDeleting } =
		api.previewDeployments.delete.useMutation();

	const handleRedeploy = async (previewId: string) => {
		try {
			await redeployPreview({ previewDeploymentId: previewId });
			toast.success("Preview deployment redeployed successfully");
			await refetch();
		} catch (error) {
			toast.error("Failed to redeploy preview deployment");
		}
	};

	const handleDelete = async (previewId: string) => {
		try {
			await deletePreview({ previewDeploymentId: previewId });
			toast.success("Preview deployment deleted successfully");
			await refetch();
		} catch (error) {
			toast.error("Failed to delete preview deployment");
		}
	};

	const getStatusBadge = (status: string) => {
		const statusMap = {
			idle: { variant: "secondary" as const, label: "Idle" },
			running: { variant: "default" as const, label: "Running" },
			done: { variant: "success" as const, label: "Done" },
			error: { variant: "destructive" as const, label: "Error" },
		};

		const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.idle;

		return (
			<Badge variant={statusInfo.variant}>
				{statusInfo.label}
			</Badge>
		);
	};

	if (!monorepo?.isPreviewDeploymentsActive) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Preview Deployments</CardTitle>
					<CardDescription>
						Preview deployments are not enabled for this monorepo
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ShowMonorepoPreviewSettings monorepoId={monorepoId} />
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Preview Deployments</CardTitle>
					<CardDescription>
						Automatic preview deployments for pull requests in your monorepo
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ShowMonorepoPreviewSettings monorepoId={monorepoId} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Active Preview Deployments</CardTitle>
					<CardDescription>
						Currently active preview deployments for this monorepo
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!previewDeployments || previewDeployments.length === 0 ? (
						<div className="text-center py-8">
							<GitBranch className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">
								No preview deployments found. Create a pull request to generate a preview deployment.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Branch</TableHead>
									<TableHead>Pull Request</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Domain</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{previewDeployments.map((preview) => (
									<TableRow key={preview.previewDeploymentId}>
										<TableCell>
											<div className="flex items-center gap-2">
												<GitBranch className="h-4 w-4" />
												<span className="font-mono text-sm">{preview.branch}</span>
											</div>
										</TableCell>
										<TableCell>
											<a
												href={preview.pullRequestURL}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-2 text-blue-600 hover:underline"
											>
												#{preview.pullRequestNumber}
												<ExternalLink className="h-3 w-3" />
											</a>
											<p className="text-sm text-muted-foreground truncate max-w-xs">
												{preview.pullRequestTitle}
											</p>
										</TableCell>
										<TableCell>
											{getStatusBadge(preview.previewStatus)}
										</TableCell>
										<TableCell>
											{new Date(preview.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell>
											{preview.domain ? (
												<a
													href={`https://${preview.domain.host}`}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-2 text-blue-600 hover:underline"
												>
													{preview.domain.host}
													<ExternalLink className="h-3 w-3" />
												</a>
											) : (
												<span className="text-muted-foreground">No domain</span>
											)}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleRedeploy(preview.previewDeploymentId)}
													disabled={isRedeploying}
												>
													<RefreshCw className="h-3 w-3" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDelete(preview.previewDeploymentId)}
													disabled={isDeleting}
													className="text-red-600 hover:text-red-700"
												>
													<Trash2 className="h-3 w-3" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
};