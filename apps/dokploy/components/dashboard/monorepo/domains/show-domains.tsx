import {
	CheckCircle2,
	ExternalLink,
	GlobeIcon,
	InfoIcon,
	Loader2,
	PenBoxIcon,
	RefreshCw,
	Server,
	Trash2,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { DialogAction } from "@/components/shared/dialog-action";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { AddDomainMonorepo } from "./handle-domain";

export type ValidationState = {
	isLoading: boolean;
	isValid?: boolean;
	error?: string;
	resolvedIp?: string;
	message?: string;
	cdnProvider?: string;
};

export type ValidationStates = Record<string, ValidationState>;

interface Props {
	monorepoId: string;
}

export const ShowDomainsMonorepo = ({ monorepoId }: Props) => {
	const [validationStates, setValidationStates] = useState<ValidationStates>({});
	const [selectedService, setSelectedService] = useState<string>("all");

	const { data: monorepo } = api.monorepo.one.useQuery({
		monorepoId,
	});

	const { data: domains } = api.domain.byMonorepoId.useQuery(
		{
			monorepoId,
		},
		{ enabled: !!monorepoId },
	);

	const { mutateAsync: validateDomain } = api.domain.validate.useMutation();
	const { mutateAsync: removeDomain } = api.domain.remove.useMutation();

	const services = monorepo?.servicesConfig?.services || [];

	const handleValidate = async (domainId: string, host: string) => {
		setValidationStates((prev) => ({
			...prev,
			[domainId]: { isLoading: true },
		}));

		try {
			const result = await validateDomain({ domainId });
			setValidationStates((prev) => ({
				...prev,
				[domainId]: {
					isLoading: false,
					isValid: result.isValid,
					resolvedIp: result.resolvedIp,
					message: result.message,
					cdnProvider: result.cdnProvider,
				},
			}));
		} catch (error) {
			setValidationStates((prev) => ({
				...prev,
				[domainId]: {
					isLoading: false,
					isValid: false,
					error: "Validation failed",
				},
			}));
		}
	};

	const handleRemove = async (domainId: string) => {
		try {
			await removeDomain({ domainId });
			toast.success("Domain removed successfully");
		} catch (error) {
			toast.error("Failed to remove domain");
		}
	};

	const filteredDomains = domains?.filter((domain) => {
		if (selectedService === "all") return true;
		return domain.serviceName === selectedService;
	});

	return (
		<div className="flex flex-col gap-4">
			{/* Service Filter */}
			{services.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Filter by Service</CardTitle>
								<CardDescription>
									View domains for specific services or all services
								</CardDescription>
							</div>
							<Select value={selectedService} onValueChange={setSelectedService}>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Select service" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Services</SelectItem>
									{services.map((service) => (
										<SelectItem key={service.id} value={service.name}>
											{service.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardHeader>
				</Card>
			)}

			{/* Add Domain */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GlobeIcon className="size-5" />
						Add Domain
					</CardTitle>
					<CardDescription>
						Configure domains and ports for your monorepo services
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AddDomainMonorepo
						monorepoId={monorepoId}
						services={services}
					/>
				</CardContent>
			</Card>

			{/* Domains List */}
			<Card>
				<CardHeader>
					<CardTitle>Configured Domains</CardTitle>
					<CardDescription>
						Manage and validate your monorepo domains
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!filteredDomains || filteredDomains.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<GlobeIcon className="size-8 text-muted-foreground mb-2" />
							<p className="text-sm text-muted-foreground">
								No domains configured yet
							</p>
							<p className="text-xs text-muted-foreground">
								Add a domain above to get started
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{filteredDomains.map((domain) => {
								const validationState = validationStates[domain.domainId];
								const isValidating = validationState?.isLoading;

								return (
									<div
										key={domain.domainId}
										className="flex items-center justify-between p-4 border rounded-lg"
									>
										<div className="flex flex-col gap-2">
											<div className="flex items-center gap-2">
												<Link
													href={`https://${domain.host}`}
													target="_blank"
													rel="noopener noreferrer"
													className="font-medium hover:underline flex items-center gap-1"
												>
													{domain.host}
													<ExternalLink className="size-3" />
												</Link>
												{domain.certificateType === "letsencrypt" && (
													<Badge variant="secondary" className="text-xs">
														SSL
													</Badge>
												)}
												{domain.serviceName && (
													<Badge variant="outline" className="text-xs">
														{domain.serviceName}
													</Badge>
												)}
												{domain.port && (
													<Badge variant="outline" className="text-xs">
														Port: {domain.port}
													</Badge>
												)}
											</div>

											{validationState && (
												<div className="flex items-center gap-2 text-sm">
													{validationState.isValid ? (
														<div className="flex items-center gap-1 text-green-600">
															<CheckCircle2 className="size-4" />
															Valid
														</div>
													) : (
														<div className="flex items-center gap-1 text-red-600">
															<XCircle className="size-4" />
															Invalid
														</div>
													)}
													{validationState.resolvedIp && (
														<span className="text-muted-foreground">
															→ {validationState.resolvedIp}
														</span>
													)}
													{validationState.cdnProvider && (
														<Badge variant="secondary" className="text-xs">
															{validationState.cdnProvider}
														</Badge>
													)}
												</div>
											)}

											{validationState?.message && (
												<p className="text-xs text-muted-foreground">
													{validationState.message}
												</p>
											)}
										</div>

										<div className="flex items-center gap-2">
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleValidate(domain.domainId, domain.host)}
															disabled={isValidating}
														>
															{isValidating ? (
																<Loader2 className="size-4 animate-spin" />
															) : (
																<RefreshCw className="size-4" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Validate domain</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button variant="outline" size="sm">
															<PenBoxIcon className="size-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Edit domain</p>
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>

											<DialogAction
												title="Delete Domain"
												description={`Are you sure you want to delete the domain ${domain.host}?`}
												onClick={() => handleRemove(domain.domainId)}
											>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="outline"
																size="sm"
																className="text-red-600 hover:text-red-700"
															>
																<Trash2 className="size-4" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															<p>Delete domain</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</DialogAction>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};