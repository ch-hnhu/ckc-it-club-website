import { Card } from "../ui/card";
import { Link } from "react-router-dom";
import React from "react";

interface StatCardProps {
	icon: React.ReactNode;
	title: string;
	value: string | number;
	suffix?: string;
	description?: string;
	trend?: number;
	trendDirection?: "up" | "down";
	tone?: "default" | "danger";
	to?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
	icon,
	title,
	value,
	suffix,
	description,
	trend,
	trendDirection,
	tone = "default",
	to,
}) => {
	const isDanger = tone === "danger";

	const card = (
		<Card
			className={`border border-border bg-card p-6 h-full transition-shadow hover:shadow-md ${
				to ? "hover:border-primary/30" : ""
			}`}>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex-1 min-w-0'>
					<p className='text-sm text-muted-foreground font-medium mb-2'>{title}</p>
					<div className='flex items-baseline gap-2'>
						<h3
							className={`text-3xl font-bold ${
								isDanger ? "text-destructive" : "text-foreground"
							}`}>
							{value}
						</h3>
						{suffix && <span className='text-sm text-muted-foreground'>{suffix}</span>}
					</div>
					{description && (
						<p className='text-xs text-muted-foreground mt-3 truncate'>{description}</p>
					)}
					{trend !== undefined && (
						<p
							className={`text-xs mt-3 font-medium ${
								trendDirection === "up" ? "text-green-600" : "text-destructive"
							}`}>
							{trendDirection === "up" ? "↑" : "↓"} {Math.abs(trend)}% so với tháng trước
						</p>
					)}
				</div>
				<div
					className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 [&_svg]:w-5 [&_svg]:h-5 ${
						isDanger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
					}`}>
					{icon}
				</div>
			</div>
		</Card>
	);

	return to ? <Link to={to}>{card}</Link> : card;
};
