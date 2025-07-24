import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	monorepoId: string;
}

export const ShowBuildChooseFormMonorepo = ({ monorepoId }: Props) => {
	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle>Build Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">
					Build configuration is handled per service in the services section below.
				</p>
			</CardContent>
		</Card>
	);
};