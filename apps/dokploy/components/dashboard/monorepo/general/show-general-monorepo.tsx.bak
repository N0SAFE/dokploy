import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
	port: z.number().int().min(1).max(65535).optional(),
	domains: z.array(z.string()).optional(),
	env: z.string().optional(),
	dockerfile: z.string().optional(),
	dockerContextPath: z.string().optional(),
	dockerBuildStage: z.string().optional(),
	buildPath: z.string().optional(),
	command: z.string().optional(),
	healthCheckPath: z.string().optional(),
	enabled: z.boolean().default(true),
});

const updateMonorepoSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	deploymentType: z.enum(["dockerfile", "docker-compose", "command"]),
	dockerfile: z.string().optional(),
	dockerContextPath: z.string().optional(),
	dockerBuildStage: z.string().optional(),
	buildPath: z.string().optional(),
	composePath: z.string().optional(),
	composeFile: z.string().optional(),
	command: z.string().optional(),
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
			deploymentType: "dockerfile",
			dockerfile: "",
			dockerContextPath: "",
			dockerBuildStage: "",
			buildPath: "",
			composePath: "./docker-compose.yml",
			composeFile: "",
			command: "",
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
			const services = data.servicesConfig?.services || [];
			setServicesMode(services.length > 0);
			
			form.reset({
				name: data.name,
				description: data.description || "",
				deploymentType: data.deploymentType,
				dockerfile: data.dockerfile || "",
				dockerContextPath: data.dockerContextPath || "",
				dockerBuildStage: data.dockerBuildStage || "",
				buildPath: data.buildPath || "",
				composePath: data.composePath || "./docker-compose.yml",
				composeFile: data.composeFile || "",
				command: data.command || "",
				services,
			});
		}
	}, [data, form]);

	const onSubmit = async (formData: UpdateMonorepo) => {
		try {
			// Update basic monorepo settings
			const { services, ...basicSettings } = formData;
			await mutateAsync({
				monorepoId,
				...basicSettings,
			});

			// Update services configuration if in services mode
			if (servicesMode && services) {
				await updateServices({
					monorepoId,
					servicesConfig: { services },
				});
			}

			toast.success("Monorepo updated successfully");
			await refetch();
		} catch (error) {
			toast.error("Error updating monorepo");
		}
	};

	const addService = () => {
		append({
			id: `service-${Date.now()}`,
			name: "",
			appName: `${data?.appName || "monorepo"}-service-${fields.length + 1}`,
			description: "",
			port: 3000,
			domains: [],
			env: "",
			dockerfile: "",
			dockerContextPath: "",
			dockerBuildStage: "",
			buildPath: "",
			command: "",
			healthCheckPath: "/",
			enabled: true,
		});
	};

	const deploymentType = form.watch("deploymentType");

	return (
		<Card className="bg-sidebar p-2.5 rounded-xl">
			<div className="rounded-xl bg-background shadow-md p-6">
				<CardHeader className="p-0 mb-6">
					<CardTitle>General Settings</CardTitle>
					<CardDescription>
						Configure your monorepo deployment settings
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<div className="grid grid-cols-1 gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input placeholder="My Monorepo" {...field} />
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

								<FormField
									control={form.control}
									name="deploymentType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Deployment Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select deployment type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="dockerfile">Dockerfile</SelectItem>
													<SelectItem value="docker-compose">
														Docker Compose
													</SelectItem>
													<SelectItem value="command">Command</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* Services Mode Toggle */}
							<div className="flex items-center space-x-2">
								<Switch
									id="services-mode"
									checked={servicesMode}
									onCheckedChange={setServicesMode}
								/>
								<FormLabel htmlFor="services-mode" className="cursor-pointer">
									Enable Multiple Services Mode
								</FormLabel>
							</div>

							{servicesMode && (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h3 className="text-lg font-medium">Services Configuration</h3>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={addService}
										>
											<PlusIcon className="w-4 h-4 mr-2" />
											Add Service
										</Button>
									</div>

									{fields.map((field, index) => (
										<Card key={field.id} className="p-4">
											<div className="flex items-center justify-between mb-4">
												<h4 className="font-medium">Service {index + 1}</h4>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => remove(index)}
													className="text-red-500 hover:text-red-700"
												>
													<TrashIcon className="w-4 h-4" />
												</Button>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
																<Input placeholder="frontend-app" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`services.${index}.port`}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Port</FormLabel>
															<FormControl>
																<Input
																	type="number"
																	placeholder="3000"
																	{...field}
																	onChange={(e) => field.onChange(Number(e.target.value))}
																/>
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
																<Input placeholder="/" {...field} />
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={form.control}
													name={`services.${index}.description`}
													render={({ field }) => (
														<FormItem className="md:col-span-2">
															<FormLabel>Description</FormLabel>
															<FormControl>
																<Textarea
																	placeholder="Service description..."
																	className="resize-none"
																	{...field}
																/>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>

												{deploymentType === "dockerfile" && (
													<>
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
															name={`services.${index}.buildPath`}
															render={({ field }) => (
																<FormItem>
																	<FormLabel>Build Path</FormLabel>
																	<FormControl>
																		<Input placeholder="/apps/frontend" {...field} />
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
													</>
												)}

												{deploymentType === "command" && (
													<FormField
														control={form.control}
														name={`services.${index}.command`}
														render={({ field }) => (
															<FormItem className="md:col-span-2">
																<FormLabel>Command</FormLabel>
																<FormControl>
																	<Textarea
																		placeholder="npm run start:frontend"
																		className="font-mono text-sm resize-none"
																		rows={3}
																		{...field}
																	/>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
												)}

												<FormField
													control={form.control}
													name={`services.${index}.enabled`}
													render={({ field }) => (
														<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
															<div className="space-y-0.5">
																<FormLabel className="text-base">
																	Enabled
																</FormLabel>
																<FormLabel className="text-sm text-muted-foreground">
																	Enable this service for deployment
																</FormLabel>
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
										</Card>
									))}
								</div>
							)}

							{deploymentType === "dockerfile" && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium">
										Dockerfile Configuration
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="dockerfile"
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
											name="dockerContextPath"
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
											name="buildPath"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Build Path</FormLabel>
													<FormControl>
														<Input placeholder="/" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="dockerBuildStage"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Build Stage (Optional)</FormLabel>
													<FormControl>
														<Input placeholder="production" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							)}

							{deploymentType === "docker-compose" && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium">
										Docker Compose Configuration
									</h3>
									<div className="grid grid-cols-1 gap-4">
										<FormField
											control={form.control}
											name="composePath"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Compose File Path</FormLabel>
													<FormControl>
														<Input
															placeholder="./docker-compose.yml"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="composeFile"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Compose File Content (Optional)</FormLabel>
													<FormControl>
														<Textarea
															placeholder="version: '3.8'&#10;services:&#10;  app:&#10;    build: .&#10;    ports:&#10;      - '3000:3000'"
															className="font-mono text-sm resize-none"
															rows={10}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							)}

							{deploymentType === "command" && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium">Command Configuration</h3>
									<FormField
										control={form.control}
										name="command"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Command</FormLabel>
												<FormControl>
													<Textarea
														placeholder="npm install && npm run build && npm start"
														className="font-mono text-sm resize-none"
														rows={4}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							<div className="flex justify-end">
								<Button type="submit" isLoading={isLoading || isUpdatingServices}>
									Save Changes
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</div>
		</Card>
	);
};
