import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	monorepoId: string;
}

export const SaveDragNDropMonorepo = ({ monorepoId }: Props) => {
	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle>Drop Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-muted-foreground">Drop provider configuration will be implemented soon.</p>
			</CardContent>
		</Card>
	);
};