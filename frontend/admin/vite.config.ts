import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@/components": path.resolve(__dirname, "../../components"),
		},
	},
	server: {
		port: 5173, // Set default port (thay số này theo ý muốn)
		host: true, // Cho phép access từ network
		open: true, // Tự động mở browser khi start
	},
});
