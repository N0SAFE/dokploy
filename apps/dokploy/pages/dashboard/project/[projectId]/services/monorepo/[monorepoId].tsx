import { validateRequest } from "@dokploy/server/lib/auth";
import { createServerSideHelpers } from "@trpc/react-query/server";
import copy from "copy-to-clipboard";
import { GitBranch, HelpCircle, ServerOff } from "lucide-react";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement, useEffect, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";
import { DeleteService } from "@/components/dashboard/compose/delete-service";
import { ContainerFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-container-monitoring";
import { ContainerPaidMonitoring } from "@/components/dashboard/monitoring/paid/container/show-paid-container-monitoring";
import { ShowDomainsMonorepo } from "@/components/dashboard/monorepo/domains/show-domains";
import { ShowGeneralMonorepo } from "@/components/dashboard/monorepo/general/show-general-monorepo";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { BreadcrumbSidebar } from "@/components/shared/breadcrumb-sidebar";
import { StatusTooltip } from "@/components/shared/status-tooltip";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { appRouter } from "@/server/api/root";
import { api } from "@/utils/api";

type TabState =
	| "general"
	| "environment"
	| "deployments"
	| "domains"
	| "logs"
	| "monitoring";

const Monorepo = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const { monorepoId } = props;
	const { data } = api.monorepo.one.useQuery(
		{
			monorepoId,
		},
		{
			enabled: !!monorepoId,
		},
	);

	const router = useRouter();
	const { tab } = router.query;
	const [activeTab, setActiveTab] = useState<TabState>("general");

	useEffect(() => {
		if (typeof tab === "string") {
			setActiveTab(tab as TabState);
		}
	}, [tab]);

	const handleTabChange = (value: string) => {
		const tabValue = value as TabState;
		setActiveTab(tabValue);
		const currentUrl = new URL(window.location.href);
		if (tabValue === "general") {
			currentUrl.searchParams.delete("tab");
		} else {
			currentUrl.searchParams.set("tab", tabValue);
		}

		router.push(currentUrl.pathname + currentUrl.search, undefined, {
			shallow: true,
		});
	};

	return (
		<div className="pb-10">
			<BreadcrumbSidebar
				list={[
					{ name: "Projects", href: "/dashboard/projects" },
					{
						name: data?.project?.name || "",
						href: `/dashboard/project/${data?.project?.projectId}`,
					},
					{ name: data?.name || "", href: "" },
				]}
			/>
			<Head>
				<title>Monorepo: {data?.name} | Dokploy</title>
			</Head>

			<div className="flex flex-col gap-4">
				<Card className="bg-sidebar p-2.5 rounded-xl">
					<div className="rounded-xl bg-background shadow-md">
						<CardHeader className="flex flex-row justify-between flex-wrap gap-2">
							<div className="flex flex-col gap-1 w-fit">
								<CardTitle className="flex items-center gap-2">
									<GitBranch className="size-6 text-muted-foreground" />
									{data?.name}
									<span className="text-sm">({data?.appName})</span>
									<StatusTooltip status={data?.monorepoStatus} />
								</CardTitle>
								<CardDescription>{data?.description}</CardDescription>
								<div className="flex flex-row gap-2 items-center">
									<Badge
										variant="secondary"
										className="text-xs font-normal max-w-fit"
									>
										{data?.sourceType || "github"}
									</Badge>
									{data?.serverId && (
										<Badge variant="outline">Remote Server</Badge>
									)}
								</div>
							</div>
							<div className="flex flex-row gap-2 flex-wrap justify-end">
								<TooltipProvider delayDuration={0}>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>
												<Label
													className="cursor-pointer"
													onClick={() => {
														copy(data?.appName || "");
														toast.success("App name copied to clipboard!");
													}}
												>
													{data?.appName}
												</Label>
											</span>
										</TooltipTrigger>
										<TooltipContent side="bottom">
											<p>Click to copy the app name</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
								<DeleteService id={monorepoId} type="monorepo" />
							</div>
						</CardHeader>
					</div>
				</Card>

				<div className="flex flex-col gap-4">
					<Tabs value={activeTab} onValueChange={handleTabChange}>
						<div className="overflow-auto">
							<TabsList className="grid w-full grid-cols-6 max-w-full">
								<TabsTrigger value="general">General</TabsTrigger>
								<TabsTrigger value="environment">Environment</TabsTrigger>
								<TabsTrigger value="deployments">Deployments</TabsTrigger>
								<TabsTrigger value="domains">Domains</TabsTrigger>
								<TabsTrigger value="logs">Logs</TabsTrigger>
								<TabsTrigger value="monitoring">Monitoring</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="general">
							<ShowGeneralMonorepo monorepoId={monorepoId} />
						</TabsContent>

						<TabsContent value="environment">
							<Card className="bg-sidebar p-2.5 rounded-xl">
								<div className="rounded-xl bg-background shadow-md p-6">
									<CardHeader className="p-0 mb-4">
										<CardTitle>Environment Variables</CardTitle>
										<CardDescription>
											Manage environment variables for your monorepo
										</CardDescription>
									</CardHeader>
									<CardContent className="p-0">
										<div className="text-muted-foreground">
											Environment variables management will be implemented here.
										</div>
									</CardContent>
								</div>
							</Card>
						</TabsContent>

						<TabsContent value="deployments">
							<Card className="bg-sidebar p-2.5 rounded-xl">
								<div className="rounded-xl bg-background shadow-md p-6">
									<CardHeader className="p-0 mb-4">
										<CardTitle>Deployments</CardTitle>
										<CardDescription>
											View deployment history and trigger new deployments
										</CardDescription>
									</CardHeader>
									<CardContent className="p-0">
										<div className="text-muted-foreground">
											Deployments management will be implemented here.
										</div>
									</CardContent>
								</div>
							</Card>
						</TabsContent>

						<TabsContent value="domains">
							<ShowDomainsMonorepo monorepoId={monorepoId} />
						</TabsContent>

						<TabsContent value="logs">
							<Card className="bg-sidebar p-2.5 rounded-xl">
								<div className="rounded-xl bg-background shadow-md p-6">
									<CardHeader className="p-0 mb-4">
										<CardTitle>Logs</CardTitle>
										<CardDescription>
											View real-time logs from your monorepo
										</CardDescription>
									</CardHeader>
									<CardContent className="p-0">
										<div className="text-muted-foreground">
											Logs viewer will be implemented here.
										</div>
									</CardContent>
								</div>
							</Card>
						</TabsContent>

						<TabsContent value="monitoring">
							<Card className="bg-sidebar p-2.5 rounded-xl">
								<div className="rounded-xl bg-background shadow-md p-6">
									<CardHeader className="p-0 mb-4">
										<CardTitle>Monitoring</CardTitle>
										<CardDescription>
											Monitor your monorepo performance and health
										</CardDescription>
									</CardHeader>
									<CardContent className="p-0">
										<div className="text-muted-foreground">
											Monitoring dashboard will be implemented here.
										</div>
									</CardContent>
								</div>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
};

export default Monorepo;
Monorepo.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{ monorepoId: string }>,
) {
	const { params } = ctx;
	const { req, res } = ctx;
	const { user, session } = await validateRequest(req);
	if (!user) {
		return {
			redirect: {
				permanent: true,
				destination: "/",
			},
		};
	}
	// Fetch data from external API
	const helpers = createServerSideHelpers({
		router: appRouter,
		ctx: {
			req: req as any,
			res: res as any,
			db: null as any,
			session: session as any,
			user: user as any,
		},
		transformer: superjson,
	});

	if (typeof params?.monorepoId === "string") {
		try {
			await helpers.monorepo.one.fetch({
				monorepoId: params?.monorepoId,
			});
			return {
				props: {
					trpcState: helpers.dehydrate(),
					monorepoId: params?.monorepoId,
				},
			};
		} catch {
			return {
				redirect: {
					permanent: false,
					destination: "/",
				},
			};
		}
	}

	return {
		redirect: {
			permanent: false,
			destination: "/",
		},
	};
}
