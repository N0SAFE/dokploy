import { GitBranch, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { SaveDockerProviderMonorepo } from "@/components/dashboard/monorepo/general/generic/save-docker-provider";
import { SaveGitProviderMonorepo } from "@/components/dashboard/monorepo/general/generic/save-git-provider";
import { SaveGiteaProviderMonorepo } from "@/components/dashboard/monorepo/general/generic/save-gitea-provider";
import { SaveGithubProviderMonorepo } from "@/components/dashboard/monorepo/general/generic/save-github-provider";
import {
	BitbucketIcon,
	DockerIcon,
	GiteaIcon,
	GithubIcon,
	GitIcon,
	GitlabIcon,
} from "@/components/icons/data-tools-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { SaveBitbucketProviderMonorepo } from "./save-bitbucket-provider";
import { SaveDragNDropMonorepo } from "./save-drag-n-drop";
import { SaveGitlabProviderMonorepo } from "./save-gitlab-provider";
import { UnauthorizedGitProviderMonorepo } from "./unauthorized-git-provider";

type TabState =
	| "github"
	| "docker"
	| "git"
	| "drop"
	| "gitlab"
	| "bitbucket"
	| "gitea";

interface Props {
	monorepoId: string;
}

export const ShowProviderFormMonorepo = ({ monorepoId }: Props) => {
	const { data: githubProviders, isLoading: isLoadingGithub } =
		api.github.githubProviders.useQuery();
	const { data: gitlabProviders, isLoading: isLoadingGitlab } =
		api.gitlab.gitlabProviders.useQuery();
	const { data: bitbucketProviders, isLoading: isLoadingBitbucket } =
		api.bitbucket.bitbucketProviders.useQuery();
	const { data: giteaProviders, isLoading: isLoadingGitea } =
		api.gitea.giteaProviders.useQuery();

	const { data: monorepo, refetch } = api.monorepo.one.useQuery({
		monorepoId,
	});

	const [activeTab, setActiveTab] = useState<TabState>(
		(monorepo?.sourceType as TabState) || "github",
	);

	const isLoadingProviders =
		isLoadingGithub || isLoadingGitlab || isLoadingBitbucket || isLoadingGitea;

	if (isLoadingProviders) {
		return (
			<div className="flex flex-row gap-2 items-center justify-center w-full">
				<Loader2 className="size-4 animate-spin" />
				<span className="text-sm text-muted-foreground">Loading providers...</span>
			</div>
		);
	}

	return (
		<div className="w-full">
			<Tabs
				value={activeTab}
				onValueChange={(value) => setActiveTab(value as TabState)}
				className="w-full"
			>
				<TabsList className="grid w-full grid-cols-7 mb-4">
					<TabsTrigger value="github" className="flex items-center gap-2">
						<GithubIcon className="size-4" />
						GitHub
					</TabsTrigger>
					<TabsTrigger value="gitlab" className="flex items-center gap-2">
						<GitlabIcon className="size-4" />
						GitLab
					</TabsTrigger>
					<TabsTrigger value="bitbucket" className="flex items-center gap-2">
						<BitbucketIcon className="size-4" />
						Bitbucket
					</TabsTrigger>
					<TabsTrigger value="gitea" className="flex items-center gap-2">
						<GiteaIcon className="size-4" />
						Gitea
					</TabsTrigger>
					<TabsTrigger value="docker" className="flex items-center gap-2">
						<DockerIcon className="size-4" />
						Docker
					</TabsTrigger>
					<TabsTrigger value="git" className="flex items-center gap-2">
						<GitIcon className="size-4" />
						Git
					</TabsTrigger>
					<TabsTrigger value="drop" className="flex items-center gap-2">
						<UploadCloud className="size-4" />
						Drop
					</TabsTrigger>
				</TabsList>

				<TabsContent value="github">
					{githubProviders && githubProviders.length > 0 ? (
						<SaveGithubProviderMonorepo
							monorepoId={monorepoId}
							githubProviders={githubProviders}
						/>
					) : (
						<UnauthorizedGitProviderMonorepo
							type="github"
							className="rounded-lg"
						/>
					)}
				</TabsContent>

				<TabsContent value="gitlab">
					{gitlabProviders && gitlabProviders.length > 0 ? (
						<SaveGitlabProviderMonorepo
							monorepoId={monorepoId}
							gitlabProviders={gitlabProviders}
						/>
					) : (
						<UnauthorizedGitProviderMonorepo
							type="gitlab"
							className="rounded-lg"
						/>
					)}
				</TabsContent>

				<TabsContent value="bitbucket">
					{bitbucketProviders && bitbucketProviders.length > 0 ? (
						<SaveBitbucketProviderMonorepo
							monorepoId={monorepoId}
							bitbucketProviders={bitbucketProviders}
						/>
					) : (
						<UnauthorizedGitProviderMonorepo
							type="bitbucket"
							className="rounded-lg"
						/>
					)}
				</TabsContent>

				<TabsContent value="gitea">
					{giteaProviders && giteaProviders.length > 0 ? (
						<SaveGiteaProviderMonorepo
							monorepoId={monorepoId}
							giteaProviders={giteaProviders}
						/>
					) : (
						<UnauthorizedGitProviderMonorepo
							type="gitea"
							className="rounded-lg"
						/>
					)}
				</TabsContent>

				<TabsContent value="docker">
					<SaveDockerProviderMonorepo monorepoId={monorepoId} />
				</TabsContent>

				<TabsContent value="git">
					<SaveGitProviderMonorepo monorepoId={monorepoId} />
				</TabsContent>

				<TabsContent value="drop">
					<SaveDragNDropMonorepo monorepoId={monorepoId} />
				</TabsContent>
			</Tabs>
		</div>
	);
};