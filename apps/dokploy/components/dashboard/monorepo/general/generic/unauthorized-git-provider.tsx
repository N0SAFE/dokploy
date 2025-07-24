import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	BitbucketIcon,
	GiteaIcon,
	GithubIcon,
	GitlabIcon,
} from "@/components/icons/data-tools-icons";

interface Props {
	type: "github" | "gitlab" | "bitbucket" | "gitea";
	className?: string;
}

const providerConfig = {
	github: {
		name: "GitHub",
		icon: GithubIcon,
		href: "/dashboard/settings/github",
	},
	gitlab: {
		name: "GitLab",
		icon: GitlabIcon,
		href: "/dashboard/settings/gitlab",
	},
	bitbucket: {
		name: "Bitbucket",
		icon: BitbucketIcon,
		href: "/dashboard/settings/bitbucket",
	},
	gitea: {
		name: "Gitea",
		icon: GiteaIcon,
		href: "/dashboard/settings/gitea",
	},
};

export const UnauthorizedGitProviderMonorepo = ({ type, className }: Props) => {
	const config = providerConfig[type];
	const IconComponent = config.icon;

	return (
		<Alert className={className}>
			<AlertCircle className="h-4 w-4" />
			<AlertTitle className="flex items-center gap-2">
				<IconComponent className="size-4" />
				{config.name} Not Connected
			</AlertTitle>
			<AlertDescription className="mt-2">
				<p className="mb-3">
					You need to connect your {config.name} account before you can use it as a
					source provider for your monorepo.
				</p>
				<Button asChild variant="default" size="sm">
					<Link href={config.href}>
						Connect {config.name}
					</Link>
				</Button>
			</AlertDescription>
		</Alert>
	);
};