import React from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
	return (
		<ResponsiveContainer width='100%' height={height}>
			{type === "line" ? (
				<LineChart data={data}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
					<XAxis stroke='#666666' style={{ fontSize: "12px" }} />
					<YAxis stroke='#666666' style={{ fontSize: "12px" }} />
					<Tooltip
						contentStyle={{
							backgroundColor: "#ffffff",
							border: "1px solid #e0e0e0",
							borderRadius: "6px",
						}}
						cursor={{ stroke: "#2e3820" }}
					/>
					<Line
						type='monotone'
						dataKey={dataKey}
						stroke='#2e3820'
						dot={{ fill: "#2e3820", r: 4 }}
						activeDot={{ r: 6 }}
						strokeWidth={2}
					/>
				</LineChart>
			) : (
				<BarChart data={data}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e0e0e0' />
					<XAxis stroke='#666666' style={{ fontSize: "12px" }} />
					<YAxis stroke='#666666' style={{ fontSize: "12px" }} />
					<Tooltip
						contentStyle={{
							backgroundColor: "#ffffff",
							border: "1px solid #e0e0e0",
							borderRadius: "6px",
						}}
						cursor={{ fill: "#f5f5f5" }}
					/>
					<Bar dataKey={dataKey} fill='#2e3820' radius={[4, 4, 0, 0]} />
				</BarChart>
			)}
		</ResponsiveContainer>
	);
};
