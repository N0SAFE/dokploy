import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input, NumberInput } from "@/components/ui/input";
import { Secrets } from "@/components/ui/secrets";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/utils/api";

const schema = z
	.object({
		env: z.string(),
		buildArgs: z.string(),
		wildcardDomain: z.string(),
		port: z.number(),
		previewLimit: z.number(),
		previewHttps: z.boolean(),
		previewPath: z.string(),
		previewCertificateType: z.enum(["letsencrypt", "none", "custom"]),
		previewCustomCertResolver: z.string().optional(),
		previewRequireCollaboratorPermissions: z.boolean(),
	})
	.superRefine((input, ctx) => {
		if (
			input.previewCertificateType === "custom" &&
			!input.previewCustomCertResolver
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["previewCustomCertResolver"],
				message: "Required",
			});
		}
	});

type Schema = z.infer<typeof schema>;

interface Props {
	monorepoId: string;
}

export const ShowMonorepoPreviewSettings = ({ monorepoId }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isEnabled, setIsEnabled] = useState(false);
	const { mutateAsync: updateMonorepo, isLoading } =
		api.monorepo.update.useMutation();

	const { data, refetch } = api.monorepo.one.useQuery({ monorepoId });

	const form = useForm<Schema>({
		defaultValues: {
			env: "",
			buildArgs: "",
			wildcardDomain: "*.traefik.me",
			port: 3000,
			previewLimit: 3,
			previewHttps: false,
			previewPath: "/",
			previewCertificateType: "none",
			previewRequireCollaboratorPermissions: true,
		},
		resolver: zodResolver(schema),
	});

	const previewHttps = form.watch("previewHttps");

	useEffect(() => {
		setIsEnabled(data?.isPreviewDeploymentsActive || false);
	}, [data?.isPreviewDeploymentsActive]);

	useEffect(() => {
		if (data) {
			form.reset({
				env: data.previewEnv || "",
				buildArgs: data.previewBuildArgs || "",
				wildcardDomain: data.previewWildcard || "*.traefik.me",
				port: data.previewPort || 3000,
				previewLimit: data.previewLimit || 3,
				previewHttps: data.previewHttps || false,
				previewPath: data.previewPath || "/",
				previewCertificateType: data.previewCertificateType || "none",
				previewCustomCertResolver: data.previewCustomCertResolver || "",
				previewRequireCollaboratorPermissions:
					data.previewRequireCollaboratorPermissions ?? true,
			});
		}
	}, [data, form]);

	const onSubmit = async (formData: Schema) => {
		await updateMonorepo({
			monorepoId,
			previewEnv: formData.env,
			previewBuildArgs: formData.buildArgs,
			previewWildcard: formData.wildcardDomain,
			previewPort: formData.port,
			previewLimit: formData.previewLimit,
			previewHttps: formData.previewHttps,
			previewPath: formData.previewPath,
			previewCertificateType: formData.previewCertificateType,
			previewCustomCertResolver: formData.previewCustomCertResolver,
			previewRequireCollaboratorPermissions:
				formData.previewRequireCollaboratorPermissions,
		})
			.then(async () => {
				toast.success("Preview settings updated successfully");
				await refetch();
				setIsOpen(false);
			})
			.catch(() => {
				toast.error("Error updating preview settings");
			});
	};

	const togglePreviewDeployments = async () => {
		await updateMonorepo({
			monorepoId,
			isPreviewDeploymentsActive: !isEnabled,
		})
			.then(async () => {
				setIsEnabled(!isEnabled);
				toast.success(
					`Preview deployments ${!isEnabled ? "enabled" : "disabled"}`,
				);
				await refetch();
			})
			.catch(() => {
				toast.error("Error updating preview deployments");
			});
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-row items-center justify-between gap-4">
				<div>
					<h3 className="text-lg font-medium">Preview Deployments</h3>
					<p className="text-sm text-muted-foreground">
						Automatically deploy preview environments for pull requests
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm">
								<Settings2 className="h-4 w-4 mr-2" />
								Settings
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<DialogHeader>
								<DialogTitle>Preview Deployment Settings</DialogTitle>
								<DialogDescription>
									Configure settings for preview deployments of your monorepo
								</DialogDescription>
							</DialogHeader>
							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
									<div className="grid grid-cols-1 gap-4">
										<Secrets
											name="env"
											title="Preview Environment Variables"
											description="Environment variables for preview deployments"
											placeholder="PREVIEW_MODE=true"
										/>

										<Secrets
											name="buildArgs"
											title="Preview Build Arguments"
											description="Build arguments for preview deployments"
											placeholder="BUILD_TARGET=preview"
										/>

										<FormField
											control={form.control}
											name="wildcardDomain"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Wildcard Domain</FormLabel>
													<FormControl>
														<Input
															placeholder="*.traefik.me"
															{...field}
														/>
													</FormControl>
													<FormDescription>
														Domain pattern for preview deployments
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="grid grid-cols-2 gap-4">
											<FormField
												control={form.control}
												name="port"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Port</FormLabel>
														<FormControl>
															<NumberInput
																placeholder="3000"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="previewLimit"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Preview Limit</FormLabel>
														<FormControl>
															<NumberInput
																placeholder="3"
																{...field}
															/>
														</FormControl>
														<FormDescription>
															Maximum number of preview deployments
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>

										<FormField
											control={form.control}
											name="previewPath"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Preview Path</FormLabel>
													<FormControl>
														<Input placeholder="/" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="previewHttps"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">
															Enable HTTPS
														</FormLabel>
														<FormDescription>
															Use HTTPS for preview deployments
														</FormDescription>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>

										{previewHttps && (
											<>
												<FormField
													control={form.control}
													name="previewCertificateType"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Certificate Type</FormLabel>
															<Select
																onValueChange={field.onChange}
																value={field.value}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select certificate type" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="none">None</SelectItem>
																	<SelectItem value="letsencrypt">
																		Let's Encrypt
																	</SelectItem>
																	<SelectItem value="custom">Custom</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												{form.watch("previewCertificateType") === "custom" && (
													<FormField
														control={form.control}
														name="previewCustomCertResolver"
														render={({ field }) => (
															<FormItem>
																<FormLabel>Custom Certificate Resolver</FormLabel>
																<FormControl>
																	<Input
																		placeholder="custom-resolver"
																		{...field}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}
											</>
										)}

										<FormField
											control={form.control}
											name="previewRequireCollaboratorPermissions"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">
															Require Collaborator Permissions
														</FormLabel>
														<FormDescription>
															Only allow previews from project collaborators
														</FormDescription>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
									</div>

									<DialogFooter>
										<Button
											type="button"
											variant="outline"
											onClick={() => setIsOpen(false)}
										>
											Cancel
										</Button>
										<Button type="submit" isLoading={isLoading}>
											Save Settings
										</Button>
									</DialogFooter>
								</form>
							</Form>
						</DialogContent>
					</Dialog>

					<Switch
						checked={isEnabled}
						onCheckedChange={togglePreviewDeployments}
					/>
				</div>
			</div>
		</div>
	);
};