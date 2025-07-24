import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	monorepoId: string;
	giteaProviders: any[];
}

export const SaveGiteaProviderMonorepo = ({ monorepoId, giteaProviders }: Props) => {
	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle>Gitea Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">Gitea provider configuration will be implemented soon.</p>
			</CardContent>
		</Card>
	);
};