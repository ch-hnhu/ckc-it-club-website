import React from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

interface DataPoint {
	name: string;
	value: number;
}

interface SimpleChartProps {
	type?: "line" | "bar";
	data: DataPoint[];
	dataKey: string;
	height?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
	type = "line",
	data,
	dataKey,
	height = 300,
}) => {
	const chartConfig = {
		[dataKey]: {
			label: dataKey.charAt(0).toUpperCase() + dataKey.slice(1),
			color: "var(--primary)",
		},
	} satisfies ChartConfig;

	return (
		<ChartContainer config={chartConfig} className={`w-full`} style={{ height }}>
			{type === "line" ? (
				<LineChart 
					data={data}
					margin={{ left: -20, right: 10, top: 10, bottom: 10 }}
				>
					<CartesianGrid vertical={false} strokeDasharray='3 3' className="stroke-muted" />
					<XAxis 
						dataKey="name"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						className="fill-muted-foreground text-[12px]"
					/>
					<YAxis 
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						className="fill-muted-foreground text-[12px]"
					/>
					<ChartTooltip
						cursor={{ stroke: "var(--border)" }}
						content={<ChartTooltipContent hideLabel />}
					/>
					<Line
						type='monotone'
						dataKey={dataKey}
						stroke={`var(--color-${dataKey})`}
						strokeWidth={2}
						dot={{ fill: `var(--color-${dataKey})`, r: 4 }}
						activeDot={{ r: 6 }}
					/>
				</LineChart>
			) : (
				<BarChart 
					data={data}
					margin={{ left: -20, right: 10, top: 10, bottom: 10 }}
				>
					<CartesianGrid vertical={false} strokeDasharray='3 3' className="stroke-muted" />
					<XAxis 
						dataKey="name"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						className="fill-muted-foreground text-[12px]"
					/>
					<YAxis 
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						className="fill-muted-foreground text-[12px]"
					/>
					<ChartTooltip
						cursor={{ fill: "var(--muted)", opacity: 0.4 }}
						content={<ChartTooltipContent hideLabel />}
					/>
					<Bar 
						dataKey={dataKey} 
						fill={`var(--color-${dataKey})`} 
						radius={[4, 4, 0, 0]} 
					/>
				</BarChart>
			)}
		</ChartContainer>
	);
};
