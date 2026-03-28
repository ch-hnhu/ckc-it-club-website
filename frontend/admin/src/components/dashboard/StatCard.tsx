import { Card } from "../ui/card";
import React from "react";

interface StatCardProps {
	icon: React.ReactNode;
	title: string;
	value: string | number;
	suffix?: string;
	trend?: number;
	trendDirection?: "up" | "down";
}

export const StatCard: React.FC<StatCardProps> = ({
	icon,
	title,
	value,
	suffix,
	trend,
	trendDirection,
}) => {
	return (
		<Card className='border border-border bg-card p-6 hover:shadow-md transition-shadow'>
			<div className='flex items-start justify-between'>
				<div className='flex-1'>
					<p className='text-sm text-muted-foreground font-medium mb-2'>{title}</p>
					<div className='flex items-baseline gap-2'>
						<h3 className='text-3xl font-bold text-foreground'>{value}</h3>
						{suffix && <span className='text-sm text-muted-foreground'>{suffix}</span>}
					</div>
					{trend !== undefined && (
						<p
							className={`text-xs mt-3 font-medium ${
								trendDirection === "up" ? "text-green-600" : "text-destructive"
							}`}>
							{trendDirection === "up" ? "↑" : "↓"} {Math.abs(trend)}% from last month
						</p>
					)}
				</div>
				<div className='text-4xl text-primary opacity-10'>{icon}</div>
			</div>
		</Card>
	);
};
