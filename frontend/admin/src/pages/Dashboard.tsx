import healthService from "@/services/health.service";
import userService from "@/services/user.service";
import type { User } from "@/types/user.type";
import { useEffect, useMemo, useState } from "react";
import { StatsGrid } from "../components/dashboard/StatsGrid";
import { ChartCard } from "../components/dashboard/ChartCard";
import { SimpleChart } from "../components/dashboard/SimpleChart";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { MoreVertical } from "lucide-react";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";

function Dashboard() {
	const [health, setHealth] = useState<string>();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		healthService.getHealth().then((response) => {
			setHealth(response.message);
		});

		userService
			.getMe()
			.then((response) => {
				if (response.success) {
					setUser(response.data);
				}
			})
			.catch((err) => console.error("Failed to fetch user", err));
	}, []);

	const breadcrumb = useMemo(() => [{ title: "Dashboard", link: "/" }], []);
	useBreadcrumb(breadcrumb);

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
		<main className='flex-1 overflow-auto bg-background'>
			{/* Header */}
			<div className='border-b border-border bg-background sticky top-0 z-10'>
				<div className='px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-foreground'>
								{user ? `Xin chào, ${user.full_name || user.email}` : "Dashboard"}
							</h1>
							<p className='text-sm text-muted-foreground mt-1'>
								{health || "Loading..."}
							</p>
						</div>
						<div className='flex items-center gap-4'>
							<button className='p-2 hover:bg-muted rounded-lg transition-colors'>
								<MoreVertical className='w-5 h-5 text-muted-foreground' />
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
								<button className='px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground'>
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
								<div className='flex justify-between items-center pb-3 border-b border-border'>
									<span className='text-sm text-muted-foreground'>
										Conversion Rate
									</span>
									<span className='text-lg font-bold text-foreground'>3.24%</span>
								</div>
								<div className='flex justify-between items-center pb-3 border-b border-border'>
									<span className='text-sm text-muted-foreground'>
										Avg. Order Value
									</span>
									<span className='text-lg font-bold text-foreground'>
										₫1,250
									</span>
								</div>
								<div className='flex justify-between items-center pb-3 border-b border-border'>
									<span className='text-sm text-muted-foreground'>
										Bounce Rate
									</span>
									<span className='text-lg font-bold text-foreground'>42.5%</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>
										Customer Lifetime Value
									</span>
									<span className='text-lg font-bold text-foreground'>
										₫8,500
									</span>
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

export default Dashboard;
