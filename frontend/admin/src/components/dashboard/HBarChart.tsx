import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

export interface HBarSeries {
	key: string;
	label: string;
	color: string;
}

interface HBarChartProps {
	/** Mỗi phần tử: { name: string } + giá trị số cho từng series.key */
	data: Array<Record<string, string | number>>;
	series: HBarSeries[];
	/** Xếp chồng các series trên cùng một thanh */
	stacked?: boolean;
	height?: number;
	/** Độ rộng cột nhãn tên bên trái */
	labelWidth?: number;
}

/**
 * Biểu đồ thanh ngang dùng chung cho dashboard — phù hợp khi nhãn danh mục dài
 * (tên khoá học, vai trò...). Hỗ trợ 1 hoặc nhiều series (xếp chồng).
 */
export const HBarChart: React.FC<HBarChartProps> = ({
	data,
	series,
	stacked = false,
	height = 240,
	labelWidth = 140,
}) => {
	const chartConfig = Object.fromEntries(
		series.map((s) => [s.key, { label: s.label, color: s.color }]),
	) satisfies ChartConfig;

	return (
		<ChartContainer config={chartConfig} className='w-full' style={{ height }}>
			<BarChart
				data={data}
				layout='vertical'
				margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
				barCategoryGap='28%'>
				<CartesianGrid horizontal={false} strokeDasharray='3 3' className='stroke-muted' />
				<XAxis
					type='number'
					tickLine={false}
					axisLine={false}
					allowDecimals={false}
					className='fill-muted-foreground text-[12px]'
				/>
				<YAxis
					type='category'
					dataKey='name'
					width={labelWidth}
					tickLine={false}
					axisLine={false}
					tickMargin={6}
					className='fill-muted-foreground text-[12px]'
					tickFormatter={(value: string) =>
						value.length > 18 ? `${value.slice(0, 17)}…` : value
					}
				/>
				<ChartTooltip
					cursor={{ fill: "var(--muted)", opacity: 0.4 }}
					content={<ChartTooltipContent />}
				/>
				{series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
				{series.map((s, index) => (
					<Bar
						key={s.key}
						dataKey={s.key}
						fill={s.color}
						stackId={stacked ? "stack" : undefined}
						// Bo góc ở đầu thanh (series cuối cùng khi xếp chồng)
						radius={
							!stacked || index === series.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]
						}
						maxBarSize={22}
					/>
				))}
			</BarChart>
		</ChartContainer>
	);
};
