import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	monorepoId: string;
	gitlabProviders: any[];
}

export const SaveGitlabProviderMonorepo = ({ monorepoId, gitlabProviders }: Props) => {
	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle>GitLab Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">GitLab provider configuration will be implemented soon.</p>
			</CardContent>
		</Card>
	);
};