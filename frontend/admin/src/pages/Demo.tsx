import { StatsGrid } from "../components/dashboard/StatsGrid";
import { ChartCard } from "../components/dashboard/ChartCard";
import { SimpleChart } from "../components/dashboard/SimpleChart";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { MoreVertical } from "lucide-react";

export default function Demo() {
	const chartData = [
		{ name: "Jan", value: 400 },
		{ name: "Feb", value: 520 },
		{ name: "Mar", value: 480 },
		{ name: "Apr", value: 620 },
		{ name: "May", value: 580 },
		{ name: "Jun", value: 750 },
		{ name: "Jul", value: 890 },
	];

	const activityItems = [
		{
			id: "1",
			title: "New order received",
			description: "Order #12345 from customer John Doe",
			timestamp: "2 hours ago",
			icon: "📦",
		},
		{
			id: "2",
			title: "User registration",
			description: "New user Sarah registered",
			timestamp: "4 hours ago",
			icon: "👤",
		},
		{
			id: "3",
			title: "System update",
			description: "Dashboard updated to v2.1.0",
			timestamp: "1 day ago",
			icon: "⚙️",
		},
		{
			id: "4",
			title: "Payment processed",
			description: "Invoice #INV-2024-001 paid",
			timestamp: "2 days ago",
			icon: "💳",
		},
	];

	return (
		<main className='flex-1 overflow-auto bg-white'>
			{/* Header */}
			<div className='border-b border-[#e0e0e0] bg-white sticky top-0 z-10'>
				<div className='px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-[#1a1a1a]'>Dashboard</h1>
							<p className='text-sm text-[#666666] mt-1'>Welcome to your admin panel</p>
						</div>
						<div className='flex items-center gap-4'>
							<button className='p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors'>
								<MoreVertical className='w-5 h-5 text-[#666666]' />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className='p-6 space-y-6'>
				{/* Stats Grid */}
				<StatsGrid />

				{/* Charts Section */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Main Chart */}
					<div className='lg:col-span-2'>
						<ChartCard
							title='Revenue Trend'
							description='Monthly revenue for the last 7 months'
							action={
								<button className='px-3 py-1 text-sm border border-[#e0e0e0] rounded-lg hover:bg-[#f5f5f5] transition-colors text-[#666666]'>
									Export
								</button>
							}>
							<SimpleChart type='line' data={chartData} dataKey='value' />
						</ChartCard>
					</div>

					{/* Secondary Stats */}
					<div className='space-y-6'>
						<ChartCard title='Top Metrics' description='Key performance indicators'>
							<div className='space-y-4'>
								<div className='flex justify-between items-center pb-3 border-b border-[#e5e5e5]'>
									<span className='text-sm text-[#666666]'>Conversion Rate</span>
									<span className='text-lg font-bold text-[#2e3820]'>3.24%</span>
								</div>
								<div className='flex justify-between items-center pb-3 border-b border-[#e5e5e5]'>
									<span className='text-sm text-[#666666]'>Avg. Order Value</span>
									<span className='text-lg font-bold text-[#2e3820]'>₫1,250</span>
								</div>
								<div className='flex justify-between items-center pb-3 border-b border-[#e5e5e5]'>
									<span className='text-sm text-[#666666]'>Bounce Rate</span>
									<span className='text-lg font-bold text-[#2e3820]'>42.5%</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-[#666666]'>Customer Lifetime Value</span>
									<span className='text-lg font-bold text-[#2e3820]'>₫8,500</span>
								</div>
							</div>
						</ChartCard>
					</div>
				</div>

				{/* Bottom Section */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Recent Activity */}
					<div className='lg:col-span-2'>
						<RecentActivity items={activityItems} />
					</div>

					{/* Sales by Category */}
					<ChartCard title='Sales by Category'>
						<SimpleChart type='bar' data={chartData} dataKey='value' height={250} />
					</ChartCard>
				</div>
			</div>
		</main>
	);
}
