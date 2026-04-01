import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import UserList from "@/pages/user/UserList";
import ApplicationRequestsPage from "@/pages/recruitment/ApplicationRequestsPage";
import ApplicationDetailPage from "@/pages/recruitment/ApplicationDetailPage";
import ApplicationQuestionsPage from "@/pages/recruitment/ApplicationQuestionsPage";
import ApplicationQuestionDetailPage from "@/pages/recruitment/ApplicationQuestionDetailPage";
import ApplicationAnswersPage from "@/pages/recruitment/ApplicationAnswersPage";
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
			{
				path: "requests/:applicationId",
				element: <ApplicationDetailPage />,
			},
			{
				path: "questions",
				element: <ApplicationQuestionsPage />,
			},
			{
				path: "questions/:questionId",
				element: <ApplicationQuestionDetailPage />,
			},
			{
				path: "answers",
				element: <ApplicationAnswersPage />,
			},
		],
	},
]);

export default router;
