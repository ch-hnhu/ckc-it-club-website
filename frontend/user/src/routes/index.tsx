import MainLayout from "@/layouts/MainLayout";
import ContactPage from "@/pages/ContactPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
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
			{
				path: "lien-he",
				element: <ContactPage />,
			},
		],
	},
	{
		path: "/login",
		element: <LoginPage />,
	},
]);

export default router;
