import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Secrets } from "@/components/ui/secrets";
import { api } from "@/utils/api";

const addEnvironmentSchema = z.object({
	env: z.string(),
	previewEnv: z.string(),
});

type EnvironmentSchema = z.infer<typeof addEnvironmentSchema>;

interface Props {
	monorepoId: string;
}

export const ShowMonorepoEnvironment = ({ monorepoId }: Props) => {
	const { mutateAsync, isLoading } = api.monorepo.update.useMutation();

	const { data, refetch } = api.monorepo.one.useQuery(
		{
			monorepoId,
		},
		{
			enabled: !!monorepoId,
		},
	);

	const form = useForm<EnvironmentSchema>({
		defaultValues: {
			env: "",
			previewEnv: "",
		},
		resolver: zodResolver(addEnvironmentSchema),
	});

	// Watch form values
	const currentEnv = form.watch("env");
	const currentPreviewEnv = form.watch("previewEnv");
	const hasChanges =
		currentEnv !== (data?.env || "") ||
		currentPreviewEnv !== (data?.previewEnv || "");

	useEffect(() => {
		if (data) {
			form.reset({
				env: data.env || "",
				previewEnv: data.previewEnv || "",
			});
		}
	}, [data, form]);

	const onSubmit = async (formData: EnvironmentSchema) => {
		mutateAsync({
			monorepoId,
			env: formData.env,
			previewEnv: formData.previewEnv,
		})
			.then(async () => {
				toast.success("Environment variables updated");
				await refetch();
			})
			.catch(() => {
				toast.error("Error updating environment variables");
			});
	};

	const handleCancel = () => {
		form.reset({
			env: data?.env || "",
			previewEnv: data?.previewEnv || "",
		});
	};

	return (
		<Card className="bg-background px-6 pb-6">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex w-full flex-col gap-4"
				>
					<Secrets
						name="env"
						title="Shared Environment Variables"
						description={
							<span>
								Shared environment variables available to all services in the monorepo.
								{hasChanges && (
									<span className="text-yellow-500 ml-2">
										(You have unsaved changes)
									</span>
								)}
							</span>
						}
						placeholder={["NODE_ENV=production", "API_URL=https://api.example.com", "SHARED_SECRET=xyz"].join("\n")}
					/>
					
					<Secrets
						name="previewEnv"
						title="Preview Environment Variables"
						description={
							<span>
								Environment variables for preview deployments. These override shared variables during preview builds.
							</span>
						}
						placeholder={["NODE_ENV=preview", "API_URL=https://preview-api.example.com"].join("\n")}
					/>

					<div className="flex flex-row justify-end gap-2">
						{hasChanges && (
							<Button type="button" variant="outline" onClick={handleCancel}>
								Cancel
							</Button>
						)}
						<Button
							isLoading={isLoading}
							className="w-fit"
							type="submit"
							disabled={!hasChanges}
						>
							Save
						</Button>
					</div>
				</form>
			</Form>
		</Card>
	);
};