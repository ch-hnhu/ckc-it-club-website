import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import UserList from "@/pages/user/UserList";
import { LoginForm } from "@/pages/auth/LoginForm";

import LoginSuccess from "@/pages/auth/LoginSuccess";

const router = createBrowserRouter([
	{
		path: "/login",
		element: <LoginForm />,
	},
	{
		path: "/login-success",
		element: <LoginSuccess />,
	},
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
		],
	},
]);

export default router;
