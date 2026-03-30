import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import UserList from "@/pages/user/UserList";
import ApplicationRequestsPage from "@/pages/recruitment/ApplicationRequestsPage";
import { LoginForm } from "@/pages/auth/LoginForm";
import LoginSuccess from "@/pages/auth/LoginSuccess";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/NotFound";

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
		element: (
			<ProtectedRoute>
				<MainLayout />
			</ProtectedRoute>
		),
		errorElement: <NotFound />,
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
