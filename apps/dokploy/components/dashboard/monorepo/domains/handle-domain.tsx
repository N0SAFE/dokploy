import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/utils/api";

const addDomainSchema = z.object({
	host: z
		.string()
		.min(1, "Domain is required")
		.regex(
			/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|localhost)$/,
			"Please enter a valid domain",
		),
	path: z.string().default("/"),
	port: z.number().int().min(1).max(65535).optional(),
	https: z.boolean().default(false),
	certificateType: z.enum(["none", "letsencrypt", "custom"]).default("none"),
	customCertResolver: z.string().optional(),
	serviceName: z.string().optional(),
});

type AddDomain = z.infer<typeof addDomainSchema>;

interface Service {
	id: string;
	name: string;
	appName: string;
}

interface Props {
	monorepoId: string;
	services: Service[];
}

export const AddDomainMonorepo = ({ monorepoId, services }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const utils = api.useUtils();

	const { mutateAsync, isLoading, error, isError } =
		api.domain.createForMonorepo.useMutation();

	const form = useForm<AddDomain>({
		defaultValues: {
			host: "",
			path: "/",
			port: undefined,
			https: false,
			certificateType: "none",
			customCertResolver: "",
			serviceName: "",
		},
		resolver: zodResolver(addDomainSchema),
	});

	const onSubmit = async (data: AddDomain) => {
		try {
			await mutateAsync({
				monorepoId,
				...data,
			});
			toast.success("Domain added successfully");
			form.reset();
			setIsOpen(false);
			await utils.domain.byMonorepoId.invalidate({ monorepoId });
		} catch (error) {
			toast.error("Failed to add domain");
		}
	};

	const watchHttps = form.watch("https");
	const watchCertificateType = form.watch("certificateType");

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button className="w-full sm:w-auto">
					<Plus className="size-4 mr-2" />
					Add Domain
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Add Domain</DialogTitle>
					<DialogDescription>
						Configure a new domain for your monorepo services
					</DialogDescription>
				</DialogHeader>

				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="host"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Domain</FormLabel>
									<FormControl>
										<Input
											placeholder="example.com"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Enter the domain name (without protocol)
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{services.length > 0 && (
							<FormField
								control={form.control}
								name="serviceName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Service (Optional)</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a service" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="">All Services</SelectItem>
												{services.map((service) => (
													<SelectItem key={service.id} value={service.name}>
														{service.name} ({service.appName})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											Assign this domain to a specific service or leave empty for all services
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="path"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Path</FormLabel>
										<FormControl>
											<Input placeholder="/" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="port"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Port (Optional)</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="3000"
												{...field}
												onChange={(e) => {
													const value = e.target.value;
													field.onChange(value ? parseInt(value, 10) : undefined);
												}}
											/>
										</FormControl>
										<FormDescription>
											Specific port for this service
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="https"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
									<div className="space-y-0.5">
										<FormLabel>HTTPS</FormLabel>
										<FormDescription>
											Enable HTTPS for this domain
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

						{watchHttps && (
							<FormField
								control={form.control}
								name="certificateType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Certificate Type</FormLabel>
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
												<SelectItem value="none">None</SelectItem>
												<SelectItem value="letsencrypt">Let's Encrypt</SelectItem>
												<SelectItem value="custom">Custom</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{watchHttps && watchCertificateType === "custom" && (
							<FormField
								control={form.control}
								name="customCertResolver"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Custom Certificate Resolver</FormLabel>
										<FormControl>
											<Input
												placeholder="my-cert-resolver"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Custom certificate resolver name
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					</form>
				</Form>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setIsOpen(false)}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						isLoading={isLoading}
						onClick={form.handleSubmit(onSubmit)}
					>
						Add Domain
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};