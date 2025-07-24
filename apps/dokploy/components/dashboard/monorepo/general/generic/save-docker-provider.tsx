import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	monorepoId: string;
}

export const SaveDockerProviderMonorepo = ({ monorepoId }: Props) => {
	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle>Docker Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">Docker provider configuration will be implemented soon.</p>
			</CardContent>
		</Card>
	);
};