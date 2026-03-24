import { Card } from "../../../../components/ui/card";
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
		<Card className='border border-[#e0e0e0] bg-white p-6 hover:shadow-md transition-shadow'>
			<div className='flex items-start justify-between'>
				<div className='flex-1'>
					<p className='text-sm text-[#666666] font-medium mb-2'>{title}</p>
					<div className='flex items-baseline gap-2'>
						<h3 className='text-3xl font-bold text-[#1a1a1a]'>{value}</h3>
						{suffix && <span className='text-sm text-[#666666]'>{suffix}</span>}
					</div>
					{trend !== undefined && (
						<p
							className={`text-xs mt-3 font-medium ${
								trendDirection === "up" ? "text-green-600" : "text-red-600"
							}`}>
							{trendDirection === "up" ? "↑" : "↓"} {Math.abs(trend)}% from last month
						</p>
					)}
				</div>
				<div className='text-4xl text-[#2e3820] opacity-10'>{icon}</div>
			</div>
		</Card>
	);
};
