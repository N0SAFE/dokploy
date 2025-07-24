import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	monorepoId: string;
	bitbucketProviders: any[];
}

export const SaveBitbucketProviderMonorepo = ({ monorepoId, bitbucketProviders }: Props) => {
	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle>Bitbucket Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">Bitbucket provider configuration will be implemented soon.</p>
			</CardContent>
		</Card>
	);
};