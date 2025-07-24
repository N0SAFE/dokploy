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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
});

type UpdateMonorepo = z.infer<typeof updateMonorepoSchema>;

interface Props {
	monorepoId: string;
}

export const ShowGeneralMonorepo = ({ monorepoId }: Props) => {
	const { data, refetch } = api.monorepo.one.useQuery({ monorepoId });
	const { mutateAsync, isLoading } = api.monorepo.update.useMutation();

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
		},
		resolver: zodResolver(updateMonorepoSchema),
	});

	useEffect(() => {
		if (data) {
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
			});
		}
	}, [data, form]);

	const onSubmit = async (formData: UpdateMonorepo) => {
		await mutateAsync({
			monorepoId,
			...formData,
		})
			.then(async () => {
				toast.success("Monorepo updated successfully");
				await refetch();
			})
			.catch(() => {
				toast.error("Error updating monorepo");
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
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6"
						>
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
													<SelectItem value="docker-compose">Docker Compose</SelectItem>
													<SelectItem value="command">Command</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{deploymentType === "dockerfile" && (
								<div className="space-y-4">
									<h3 className="text-lg font-medium">Dockerfile Configuration</h3>
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
									<h3 className="text-lg font-medium">Docker Compose Configuration</h3>
									<div className="grid grid-cols-1 gap-4">
										<FormField
											control={form.control}
											name="composePath"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Compose File Path</FormLabel>
													<FormControl>
														<Input placeholder="./docker-compose.yml" {...field} />
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
								<Button type="submit" isLoading={isLoading}>
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