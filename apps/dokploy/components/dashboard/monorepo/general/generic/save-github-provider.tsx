import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { api } from "@/utils/api";
import type { Github, Monorepo } from "@/server/db/schema";

const githubProviderSchema = z.object({
	repository: z.string().min(1, "Repository is required"),
	owner: z.string().min(1, "Owner is required"),
	branch: z.string().min(1, "Branch is required"),
	buildPath: z.string().default("/"),
	githubId: z.string().min(1, "GitHub provider is required"),
	triggerType: z.enum(["push", "tag"]).default("push"),
	watchPaths: z.array(z.string()).optional(),
	enableSubmodules: z.boolean().default(false),
});

type GitHubProvider = z.infer<typeof githubProviderSchema>;

interface Props {
	monorepoId: string;
	githubProviders: Github[];
}

export const SaveGithubProviderMonorepo = ({
	monorepoId,
	githubProviders,
}: Props) => {
	const { data, refetch } = api.monorepo.one.useQuery({
		monorepoId,
	});

	const { mutateAsync, isLoading, error, isError } =
		api.monorepo.saveGithubProvider.useMutation();

	const form = useForm<GitHubProvider>({
		defaultValues: {
			repository: "",
			owner: "",
			branch: "",
			buildPath: "/",
			githubId: "",
			triggerType: "push",
			watchPaths: [],
			enableSubmodules: false,
		},
		resolver: zodResolver(githubProviderSchema),
	});

	useEffect(() => {
		if (data) {
			form.reset({
				repository: data.repository || "",
				owner: data.owner || "",
				branch: data.branch || "",
				buildPath: data.buildPath || "/",
				githubId: data.githubId || "",
				triggerType: data.triggerType || "push",
				watchPaths: data.watchPaths || [],
				enableSubmodules: data.enableSubmodules || false,
			});
		}
	}, [form, data]);

	const onSubmit = async (data: GitHubProvider) => {
		await mutateAsync({
			...data,
			monorepoId,
		})
			.then(async () => {
				toast.success("GitHub Provider Updated");
				await refetch();
			})
			.catch(() => {
				toast.error("Error updating GitHub provider");
			});
	};

	const { mutateAsync: fetchBranches, isLoading: isLoadingBranches } =
		api.github.getBranches.useMutation();

	const loadBranches = async () => {
		const githubId = form.getValues("githubId");
		const repository = form.getValues("repository");
		const owner = form.getValues("owner");

		if (!githubId || !repository || !owner) {
			toast.error("Please select a GitHub provider, repository, and owner first");
			return;
		}

		await fetchBranches({
			githubId,
			repo: repository,
			owner,
		})
			.then((response) => {
				if (response && response.length > 0) {
					form.setValue("branch", response[0].name);
					toast.success("Branches loaded");
				}
			})
			.catch(() => {
				toast.error("Error loading branches");
			});
	};

	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					GitHub Configuration
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="githubId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GitHub Provider</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a GitHub provider" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{githubProviders?.map((github) => (
												<SelectItem
													key={github.githubId}
													value={github.githubId}
												>
													{github.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="owner"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Owner</FormLabel>
										<FormControl>
											<Input placeholder="dokploy" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="repository"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Repository</FormLabel>
										<FormControl>
											<Input placeholder="monorepo" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="branch"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Branch</FormLabel>
									<div className="flex gap-2">
										<FormControl>
											<Input placeholder="main" {...field} />
										</FormControl>
										<Button
											type="button"
											onClick={loadBranches}
											disabled={isLoadingBranches}
											variant="outline"
										>
											<RefreshCcw
												className={`h-4 w-4 ${isLoadingBranches ? "animate-spin" : ""}`}
											/>
										</Button>
									</div>
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
									<FormDescription>
										Directory where the build process should run
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="triggerType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Trigger Type</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="push">Push</SelectItem>
											<SelectItem value="tag">Tag</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="enableSubmodules"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Enable Git Submodules</FormLabel>
										<FormDescription>
											Enable support for Git submodules in the repository
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						<Separator />

						<Button type="submit" isLoading={isLoading}>
							Save GitHub Provider
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};