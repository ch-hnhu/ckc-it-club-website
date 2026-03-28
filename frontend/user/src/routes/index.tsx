import MainLayout from "@/layouts/MainLayout";
import LandingPage from "@/pages/LandingPage";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
	{
		path: "/",
		element: <MainLayout />,
		children: [
			{
				index: true,
				element: <LandingPage />,
			},
		],
	},
]);

export default router;
