import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	monorepoId: string;
}

export const SaveGitProviderMonorepo = ({ monorepoId }: Props) => {
	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle>Git Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">Git provider configuration will be implemented soon.</p>
			</CardContent>
		</Card>
	);
};