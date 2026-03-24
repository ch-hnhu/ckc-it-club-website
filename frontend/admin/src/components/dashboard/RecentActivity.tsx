import { Card } from "../../../../components/ui/card";
import { ChevronRight } from "lucide-react";
import React from "react";

interface ActivityItem {
	id: string;
	title: string;
	description: string;
	timestamp: string;
	icon?: React.ReactNode;
}

interface RecentActivityProps {
	items: ActivityItem[];
	title?: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
	items,
	title = "Recent Activity",
}) => {
	return (
		<Card className='border border-[#e0e0e0] bg-white p-6'>
			<h3 className='text-lg font-bold text-[#1a1a1a] mb-6'>{title}</h3>
			<div className='space-y-4'>
				{items.map((item) => (
					<div key={item.id} className='flex items-start gap-4 pb-4 border-b border-[#e5e5e5] last:border-0 last:pb-0'>
						{item.icon && (
							<div className='text-2xl text-[#2e3820] mt-1'>{item.icon}</div>
						)}
						<div className='flex-1 min-w-0'>
							<div className='flex items-start justify-between gap-2'>
								<div className='flex-1'>
									<p className='font-medium text-[#1a1a1a] text-sm'>{item.title}</p>
									<p className='text-xs text-[#666666] mt-1'>{item.description}</p>
								</div>
								<span className='text-xs text-[#999999] whitespace-nowrap'>
									{item.timestamp}
								</span>
							</div>
						</div>
						<ChevronRight className='w-4 h-4 text-[#cccccc] flex-shrink-0 mt-1' />
					</div>
				))}
			</div>
		</Card>
	);
};
