import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ShowProviderFormMonorepo } from "@/components/dashboard/monorepo/general/generic/show";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";

const MonorepoServiceSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Service name is required"),
	appName: z.string().min(1, "App name is required"),
	description: z.string().optional(),
	env: z.string().optional(),
	buildType: z.enum([
		"dockerfile",
		"heroku_buildpacks",
		"paketo_buildpacks",
		"nixpacks",
		"static",
		"railpack",
	]).default("nixpacks"),
	// Dockerfile specific
	dockerfile: z.string().optional(),
	dockerContextPath: z.string().optional(),
	dockerBuildStage: z.string().optional(),
	buildPath: z.string().optional(),
	// Heroku buildpack specific
	herokuVersion: z.string().optional(),
	// Static specific
	publishDirectory: z.string().optional(),
	isStaticSpa: z.boolean().optional(),
	// Command specific (for custom builds)
	command: z.string().optional(),
	// Health check
	healthCheckPath: z.string().optional(),
	enabled: z.boolean().default(true),
});

const updateMonorepoSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	services: z.array(MonorepoServiceSchema),
});

type UpdateMonorepo = z.infer<typeof updateMonorepoSchema>;

interface Props {
	monorepoId: string;
}

export const ShowGeneralMonorepo = ({ monorepoId }: Props) => {
	const { data, refetch } = api.monorepo.one.useQuery({ monorepoId });
	const { mutateAsync, isLoading } = api.monorepo.update.useMutation();
	const { mutateAsync: updateServices, isLoading: isUpdatingServices } = 
		api.monorepo.updateServices.useMutation();
	const [servicesMode, setServicesMode] = useState(false);

	const form = useForm<UpdateMonorepo>({
		defaultValues: {
			name: "",
			description: "",
			services: [],
		},
		resolver: zodResolver(updateMonorepoSchema),
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "services",
	});

	useEffect(() => {
		if (data) {
			form.reset({
				name: data.name,
				description: data.description || "",
				services: data.servicesConfig?.services || [],
			});
			setServicesMode((data.servicesConfig?.services || []).length > 0);
		}
	}, [data, form]);

	const onSubmit = async (formData: UpdateMonorepo) => {
		await mutateAsync({
			monorepoId,
			name: formData.name,
			description: formData.description,
		})
		.then(async () => {
			if (servicesMode) {
				await updateServices({
					monorepoId,
					servicesConfig: { services: formData.services },
				});
			}
			toast.success("Monorepo Updated");
			refetch();
		})
		.catch(() => {
			toast.error("Error updating the monorepo");
		});
	};

	const addService = () => {
		append({
			id: crypto.randomUUID(),
			name: `Service ${fields.length + 1}`,
			appName: `service-${fields.length + 1}`,
			description: "",
			env: "",
			buildType: "nixpacks",
			dockerfile: "",
			dockerContextPath: "",
			dockerBuildStage: "",
			buildPath: "",
			herokuVersion: "24",
			publishDirectory: "",
			isStaticSpa: false,
			command: "",
			healthCheckPath: "",
			enabled: true,
		});
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Provider Configuration Card */}
			<Card>
				<CardHeader>
					<CardTitle>Source Provider</CardTitle>
					<CardDescription>
						Configure the source provider for your monorepo (applies to all services)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ShowProviderFormMonorepo monorepoId={monorepoId} />
				</CardContent>
			</Card>

			{/* General Settings Card */}
			<Card>
				<CardHeader>
					<CardTitle>General Settings</CardTitle>
					<CardDescription>
						Configure basic monorepo settings and services with individual build types
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="Monorepo name" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Description of your monorepo..."
												className="resize-none"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Services Mode Toggle */}
							<div className="flex items-center justify-between">
								<div className="space-y-0.5">
									<FormLabel>Multiple Services</FormLabel>
									<div className="text-sm text-muted-foreground">
										Enable to configure multiple services within this monorepo
									</div>
								</div>
								<Switch
									checked={servicesMode}
									onCheckedChange={setServicesMode}
								/>
							</div>

							{/* Services Configuration */}
							{servicesMode && (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="text-sm font-medium">Services</h4>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addService}
										>
											<PlusIcon className="size-4 mr-2" />
											Add Service
										</Button>
									</div>

									{fields.map((field, index) => (
										<Card key={field.id} className="border-dashed">
											<CardHeader>
												<div className="flex items-center justify-between">
													<CardTitle className="text-base">
														Service {index + 1}
													</CardTitle>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => remove(index)}
														disabled={fields.length === 1}
													>
														<TrashIcon className="size-4" />
													</Button>
												</div>
											</CardHeader>
											<CardContent className="space-y-4">
												<div className="grid grid-cols-2 gap-4">
													<FormField
														control={form.control}
														name={`services.${index}.name`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Service Name</FormLabel>
																<FormControl>
																	<Input placeholder="Frontend" {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>

													<FormField
														control={form.control}
														name={`services.${index}.appName`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>App Name</FormLabel>
																<FormControl>
																	<Input placeholder="frontend" {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												</div>

												<FormField
													control={form.control}
													name={`services.${index}.description`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Description</FormLabel>
															<FormControl>
																<Input placeholder="Service description" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`services.${index}.buildType`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Build Type</FormLabel>
															<Select
																onValueChange={field.onChange}
																defaultValue={field.value}
															>
																<FormControl>
																	<SelectTrigger>
																		<SelectValue placeholder="Select build type" />
																	</SelectTrigger>
																</FormControl>
																<SelectContent>
																	<SelectItem value="nixpacks">Nixpacks</SelectItem>
																	<SelectItem value="dockerfile">Dockerfile</SelectItem>
																	<SelectItem value="heroku_buildpacks">Heroku Buildpacks</SelectItem>
																	<SelectItem value="paketo_buildpacks">Paketo Buildpacks</SelectItem>
																	<SelectItem value="static">Static</SelectItem>
																	<SelectItem value="railpack">Railpack</SelectItem>
																</SelectContent>
															</Select>
															<FormMessage />
														</FormItem>
													)}
												/>

												{/* Build-type specific fields */}
												{form.watch(`services.${index}.buildType`) === "dockerfile" && (
													<div className="grid grid-cols-2 gap-4">
														<FormField
															control={form.control}
															name={`services.${index}.dockerfile`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Dockerfile Path</FormLabel>
																	<FormControl>
																		<Input placeholder="Dockerfile" {...field} />
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<FormField
															control={form.control}
															name={`services.${index}.dockerContextPath`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Context Path</FormLabel>
																	<FormControl>
																		<Input placeholder="./" {...field} />
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<FormField
															control={form.control}
															name={`services.${index}.dockerBuildStage`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Build Stage</FormLabel>
																	<FormControl>
																		<Input placeholder="production" {...field} />
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</div>
												)}

												{form.watch(`services.${index}.buildType`) === "heroku_buildpacks" && (
													<FormField
														control={form.control}
														name={`services.${index}.herokuVersion`}
														render={({ field }) => (
															<FormItem>
																<FormLabel>Heroku Version</FormLabel>
																<FormControl>
																	<Input placeholder="24" {...field} />
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}

												{form.watch(`services.${index}.buildType`) === "static" && (
													<div className="grid grid-cols-2 gap-4">
														<FormField
															control={form.control}
															name={`services.${index}.publishDirectory`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Publish Directory</FormLabel>
																	<FormControl>
																		<Input placeholder="dist" {...field} />
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>

														<FormField
															control={form.control}
															name={`services.${index}.isStaticSpa`}
															render={({ field }) => (
																<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
																	<div className="space-y-0.5">
																		<FormLabel>SPA Mode</FormLabel>
																		<div className="text-sm text-muted-foreground">
																			Enable for single page applications
																		</div>
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
												)}

												<FormField
													control={form.control}
													name={`services.${index}.buildPath`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Build Path</FormLabel>
															<FormControl>
																<Input placeholder="./" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`services.${index}.healthCheckPath`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Health Check Path</FormLabel>
															<FormControl>
																<Input placeholder="/health" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`services.${index}.enabled`}
													render={({ field }) => (
														<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
															<div className="space-y-0.5">
																<FormLabel>Enable Service</FormLabel>
																<div className="text-sm text-muted-foreground">
																	Enable this service for deployment
																</div>
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
											</CardContent>
										</Card>
									))}
								</div>
							)}

							<Button type="submit" isLoading={isLoading || isUpdatingServices}>
								Update Monorepo
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
};