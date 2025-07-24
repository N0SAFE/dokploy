import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";

const DropDeploymentSchema = z.object({
	dropBuildPath: z.string().default(""),
	zip: z.instanceof(File).optional(),
});

type DropDeployment = z.infer<typeof DropDeploymentSchema>;

interface Props {
	monorepoId: string;
}

export const SaveDragNDropMonorepo = ({ monorepoId }: Props) => {
	const { data, refetch } = api.monorepo.one.useQuery({ monorepoId });

	const { mutateAsync } = api.monorepo.saveDropProvider.useMutation();

	const form = useForm<DropDeployment>({
		defaultValues: {
			dropBuildPath: "",
		},
		resolver: zodResolver(DropDeploymentSchema),
	});

	useEffect(() => {
		if (data) {
			form.reset({
				dropBuildPath: data.dropBuildPath || "",
			});
		}
	}, [data, form, form.reset, form.formState.isSubmitSuccessful]);
	
	const zip = form.watch("zip");

	const onSubmit = async (values: DropDeployment) => {
		// For now, just save the configuration
		await mutateAsync({
			monorepoId,
			dropBuildPath: values.dropBuildPath || "/",
		})
			.then(async () => {
				toast.success("Drop configuration saved");
				await refetch();
			})
			.catch(() => {
				toast.error("Error saving the drop configuration");
			});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				<div className="grid md:grid-cols-2 gap-4 ">
					<div className="md:col-span-2 space-y-4">
						<FormField
							control={form.control}
							name="dropBuildPath"
							render={({ field }) => (
								<FormItem className="w-full ">
									<FormLabel>Build Path</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Build Path" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="zip"
							render={({ field }) => (
								<FormItem className="w-full ">
									<FormLabel>Zip file</FormLabel>
									<FormControl>
										<Dropzone
											{...field}
											dropMessage="Drop files or click here"
											accept=".zip"
											onChange={(e) => {
												if (e instanceof FileList) {
													field.onChange(e[0]);
												} else {
													field.onChange(e);
												}
											}}
										/>
									</FormControl>
									<FormMessage />
									{zip instanceof File && (
										<div className="flex flex-row gap-4 items-center">
											<span className="text-sm text-muted-foreground">
												{zip.name} ({zip.size} bytes)
											</span>
											<Button
												type="button"
												className="w-fit"
												variant="ghost"
												onClick={() => {
													field.onChange(null);
												}}
											>
												<TrashIcon className="w-4 h-4 text-muted-foreground" />
											</Button>
										</div>
									)}
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="flex flex-row justify-end">
					<Button
						type="submit"
						className="w-fit"
						isLoading={form.formState.isSubmitting}
					>
						{zip ? "Deploy" : "Save Configuration"}
					</Button>
				</div>
			</form>
		</Form>
	);
};