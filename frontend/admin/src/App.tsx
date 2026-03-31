import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/provider/theme-provider";

function App() {
	return (
		<ThemeProvider>
			<RouterProvider router={router} />
			<Toaster />
		</ThemeProvider>
	);
}

export default App;
