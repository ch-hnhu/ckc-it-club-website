import React from "react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

export interface DonutSlice {
	name: string;
	value: number;
	color: string;
}

interface DonutChartProps {
	data: DonutSlice[];
	/** Số/chữ lớn ở giữa vòng (ví dụ "10%") */
	centerValue?: string;
	/** Chú thích nhỏ dưới centerValue */
	centerLabel?: string;
	height?: number;
}

/**
 * Biểu đồ donut dùng chung cho dashboard: vòng tròn + nhãn giữa,
 * legend liệt kê từng lát kèm giá trị (không phụ thuộc màu để đọc số liệu).
 */
export const DonutChart: React.FC<DonutChartProps> = ({
	data,
	centerValue,
	centerLabel,
	height = 180,
}) => {
	const visible = data.filter((slice) => slice.value > 0);
	const total = data.reduce((sum, slice) => sum + slice.value, 0);

	const chartConfig = Object.fromEntries(
		data.map((slice) => [slice.name, { label: slice.name, color: slice.color }]),
	) satisfies ChartConfig;

	return (
		<div className='flex flex-col items-center gap-4'>
			<ChartContainer
				config={chartConfig}
				className='aspect-square'
				style={{ height }}>
				<PieChart>
					<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
					<Pie
						data={visible}
						dataKey='value'
						nameKey='name'
						innerRadius={height / 2 - 38}
						outerRadius={height / 2 - 10}
						paddingAngle={visible.length > 1 ? 2 : 0}
						strokeWidth={2}
						stroke='var(--card)'>
						{visible.map((slice) => (
							<Cell key={slice.name} fill={slice.color} />
						))}
						{centerValue && (
							<Label
								content={({ viewBox }) => {
									if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
									const { cx, cy } = viewBox as { cx: number; cy: number };
									return (
										<text x={cx} y={cy} textAnchor='middle' dominantBaseline='middle'>
											<tspan
												x={cx}
												y={centerLabel ? cy - 6 : cy}
												className='fill-foreground text-2xl font-bold'>
												{centerValue}
											</tspan>
											{centerLabel && (
												<tspan
													x={cx}
													y={cy + 16}
													className='fill-muted-foreground text-[11px]'>
													{centerLabel}
												</tspan>
											)}
										</text>
									);
								}}
							/>
						)}
					</Pie>
				</PieChart>
			</ChartContainer>

			{/* Legend kèm giá trị — đọc được không cần phân biệt màu */}
			<div className='w-full space-y-1.5'>
				{data.map((slice) => (
					<div key={slice.name} className='flex items-center gap-2 text-sm'>
						<span
							className='w-2.5 h-2.5 rounded-sm flex-shrink-0'
							style={{ backgroundColor: slice.color }}
						/>
						<span className='text-muted-foreground flex-1 truncate'>{slice.name}</span>
						<span className='font-semibold text-foreground tabular-nums'>{slice.value}</span>
						{total > 0 && (
							<span className='text-xs text-muted-foreground tabular-nums w-10 text-right'>
								{Math.round((slice.value / total) * 100)}%
							</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
