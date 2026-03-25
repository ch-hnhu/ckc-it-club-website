import { StatCard } from "./StatCard";
import { ShoppingCart, TrendingUp, Users, Eye } from "lucide-react";

export const StatsGrid = () => {
	const stats = [
		{
			icon: <ShoppingCart />,
			title: "Total Orders",
			value: 150,
			suffix: "orders",
			trend: 12,
			trendDirection: "up" as const,
		},
		{
			icon: <TrendingUp />,
			title: "Revenue",
			value: "₫45.2M",
			trend: 8,
			trendDirection: "up" as const,
		},
		{
			icon: <Users />,
			title: "Total Users",
			value: 1240,
			trend: 5,
			trendDirection: "up" as const,
		},
		{
			icon: <Eye />,
			title: "Page Views",
			value: 8500,
			trend: 3,
			trendDirection: "down" as const,
		},
	];

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
			{stats.map((stat, idx) => (
				<StatCard key={idx} {...stat} />
			))}
		</div>
	);
};
