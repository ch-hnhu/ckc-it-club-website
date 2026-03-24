import { Card } from "../../../../components/ui/card";
import React from "react";

interface ChartCardProps {
	title: string;
	description?: string;
	children: React.ReactNode;
	action?: React.ReactNode;
	fullWidth?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
	title,
	description,
	children,
	action,
	fullWidth = false,
}) => {
	return (
		<Card
			className={`border border-[#e0e0e0] bg-white p-6 ${
				fullWidth ? "col-span-full" : ""
			}`}>
			<div className='flex items-center justify-between mb-6'>
				<div className='flex-1'>
					<h3 className='text-lg font-bold text-[#1a1a1a]'>{title}</h3>
					{description && <p className='text-sm text-[#666666] mt-1'>{description}</p>}
				</div>
				{action && <div>{action}</div>}
			</div>
			<div>{children}</div>
		</Card>
	);
};
