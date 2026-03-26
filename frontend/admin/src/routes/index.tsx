import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import UserList from "@/pages/user/UserList";
import ApplicationRequestsPage from "@/pages/recruitment/ApplicationRequestsPage";

const router = createBrowserRouter([
	{
		path: "/",
		element: <MainLayout />,
		children: [
			{
				index: true,
				element: <Dashboard />,
			},
			{
				path: "users",
				element: <UserList />,
			},
			{
				path: "requests",
				element: <ApplicationRequestsPage />,
			},
		],
	},
]);

export default router;
