import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { DashboardTrendPoint } from "@/services/dashboard.service";

interface TrendChartProps {
	data: DashboardTrendPoint[];
	height?: number;
}

const chartConfig = {
	new_members: { label: "Thành viên mới", color: "#16a34a" },
	posts: { label: "Bài đăng", color: "#3b82f6" },
	event_registrations: { label: "Đăng ký sự kiện", color: "#d97706" },
	enrollments: { label: "Ghi danh khoá học", color: "#8b5cf6" },
} satisfies ChartConfig;

function monthLabel(ym: string): string {
	const [year, month] = ym.split("-");
	return `Thg ${Number(month)}/${year.slice(2)}`;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, height = 280 }) => {
	const chartData = data.map((point) => ({ ...point, label: monthLabel(point.month) }));

	return (
		<ChartContainer config={chartConfig} className='w-full' style={{ height }}>
			<AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
				<defs>
					{(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
						<linearGradient key={key} id={`trend-${key}`} x1='0' y1='0' x2='0' y2='1'>
							<stop offset='5%' stopColor={chartConfig[key].color} stopOpacity={0.25} />
							<stop offset='95%' stopColor={chartConfig[key].color} stopOpacity={0} />
						</linearGradient>
					))}
				</defs>
				<CartesianGrid vertical={false} strokeDasharray='3 3' className='stroke-muted' />
				<XAxis
					dataKey='label'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					className='fill-muted-foreground text-[12px]'
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					allowDecimals={false}
					className='fill-muted-foreground text-[12px]'
				/>
				<ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent />} />
				<ChartLegend content={<ChartLegendContent />} />
				{(Object.keys(chartConfig) as (keyof typeof chartConfig)[]).map((key) => (
					<Area
						key={key}
						type='monotone'
						dataKey={key}
						stroke={chartConfig[key].color}
						strokeWidth={2}
						fill={`url(#trend-${key})`}
						dot={{ fill: chartConfig[key].color, r: 3 }}
						activeDot={{ r: 5 }}
					/>
				))}
			</AreaChart>
		</ChartContainer>
	);
};
