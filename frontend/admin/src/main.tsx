import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "overlayscrollbars/styles/overlayscrollbars.css";
import "apexcharts/dist/apexcharts.css";
import "jsvectormap/dist/css/jsvectormap.min.css";
import App from "./App.tsx";

declare global {
	interface Window {
		__adminLteBootstrapped?: boolean;
	}
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

const bootstrapAdminLte = () => {
	if (window.__adminLteBootstrapped) {
		return;
	}

	const hasAdminLteTargets = document.querySelector("[data-lte-toggle='sidebar']");
	if (!hasAdminLteTargets) {
		requestAnimationFrame(bootstrapAdminLte);
		return;
	}

	window.__adminLteBootstrapped = true;
	void import("./lib/adminlte/ts/adminlte.ts");
};

bootstrapAdminLte();
