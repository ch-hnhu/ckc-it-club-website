import { useEffect } from "react";
import ApexCharts from "apexcharts";
import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/maps/world.js";
import { OverlayScrollbars } from "overlayscrollbars";
import Sortable from "sortablejs";
import Header from "../components/partials/Header";
import Sidebar from "../components/partials/Sidebar";
import Footer from "../components/partials/Footer";
import { Outlet } from "react-router-dom";

function App() {
	useEffect(() => {
		const cleanupFns: Array<() => void> = [];
		const safeCleanup = (fn: () => void) => {
			try {
				fn();
			} catch {
				// Some third-party libs can throw during teardown in React StrictMode.
			}
		};

		const sidebarWrapper = document.querySelector<HTMLElement>(".sidebar-wrapper");
		const isMobile = window.innerWidth <= 992;
		if (sidebarWrapper && !isMobile) {
			const osInstance = OverlayScrollbars(sidebarWrapper, {
				scrollbars: {
					theme: "os-theme-light",
					autoHide: "leave",
					clickScroll: true,
				},
			});
			cleanupFns.push(() => osInstance.destroy());
		}

		const sortableContainers = document.querySelectorAll<HTMLElement>(".connectedSortable");
		const sortableInstances = Array.from(sortableContainers).map(
			(container) =>
				new Sortable(container, {
					group: "shared",
					handle: ".card-header",
				}),
		);
		cleanupFns.push(() => sortableInstances.forEach((instance) => instance.destroy()));

		document
			.querySelectorAll<HTMLElement>(".connectedSortable .card-header")
			.forEach((cardHeader) => {
				cardHeader.style.cursor = "move";
			});

		const salesChartElement = document.querySelector<HTMLElement>("#revenue-chart");
		if (salesChartElement) {
			const salesChart = new ApexCharts(salesChartElement, {
				series: [
					{
						name: "Digital Goods",
						data: [28, 48, 40, 19, 86, 27, 90],
					},
					{
						name: "Electronics",
						data: [65, 59, 80, 81, 56, 55, 40],
					},
				],
				chart: {
					height: 300,
					type: "area",
					toolbar: {
						show: false,
					},
				},
				legend: {
					show: false,
				},
				colors: ["#0d6efd", "#20c997"],
				dataLabels: {
					enabled: false,
				},
				stroke: {
					curve: "smooth",
				},
				xaxis: {
					type: "datetime",
					categories: [
						"2023-01-01",
						"2023-02-01",
						"2023-03-01",
						"2023-04-01",
						"2023-05-01",
						"2023-06-01",
						"2023-07-01",
					],
				},
				tooltip: {
					x: {
						format: "MMMM yyyy",
					},
				},
			});
			salesChart.render();
			cleanupFns.push(() => salesChart.destroy());
		}

		const worldMapElement = document.querySelector<HTMLElement>("#world-map");
		if (worldMapElement) {
			const map = new jsVectorMap({
				selector: "#world-map",
				map: "world",
			});
			cleanupFns.push(() => safeCleanup(() => map.destroy()));
		}

		const sparklineConfigs: Array<{ selector: string; data: number[] }> = [
			{
				selector: "#sparkline-1",
				data: [1000, 1200, 920, 927, 931, 1027, 819, 930, 1021],
			},
			{
				selector: "#sparkline-2",
				data: [515, 519, 520, 522, 652, 810, 370, 627, 319, 630, 921],
			},
			{
				selector: "#sparkline-3",
				data: [15, 19, 20, 22, 33, 27, 31, 27, 19, 30, 21],
			},
		];

		sparklineConfigs.forEach(({ selector, data }) => {
			const element = document.querySelector<HTMLElement>(selector);
			if (!element) {
				return;
			}

			const chart = new ApexCharts(element, {
				series: [{ data }],
				chart: {
					type: "area",
					height: 50,
					sparkline: {
						enabled: true,
					},
				},
				stroke: {
					curve: "straight",
				},
				fill: {
					opacity: 0.3,
				},
				yaxis: {
					min: 0,
				},
				colors: ["#DCE6EC"],
			});
			chart.render();
			cleanupFns.push(() => chart.destroy());
		});

		return () => {
			cleanupFns.forEach((cleanup) => safeCleanup(cleanup));
		};
	}, []);

	return (
		<>
			<div className='app-wrapper'>
				<Header />
				<Sidebar />
				<Outlet />
				<Footer />
			</div>
		</>
	);
}

export default App;
