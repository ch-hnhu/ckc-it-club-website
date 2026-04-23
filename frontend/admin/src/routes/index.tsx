import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import FacultyList from "@/pages/faculty/FacultyList";
import MajorList from "@/pages/major/MajorList";
import SchoolClassList from "@/pages/school-class/SchoolClassList";
import UserList from "@/pages/user/UserList";
import ContactList from "@/pages/contact/ContactList";
import ApplicationRequestsPage from "@/pages/recruitment/ApplicationRequestsPage";
import ApplicationDetailPage from "@/pages/recruitment/ApplicationDetailPage";
import ApplicationQuestionsPage from "@/pages/recruitment/ApplicationQuestionsPage";
import ApplicationQuestionDetailPage from "@/pages/recruitment/ApplicationQuestionDetailPage";
import ApplicationAnswersPage from "@/pages/recruitment/ApplicationAnswersPage";
import { LoginForm } from "@/pages/auth/LoginForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/NotFound";

const router = createBrowserRouter([
	{
		path: "/login",
		element: <LoginForm />,
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
				path: "departments",
				element: <FacultyList />,
			},
			{
				path: "majors",
				element: <MajorList />,
			},
			{
				path: "classes",
				element: <SchoolClassList />,
			},
			{
				path: "contacts",
				element: <ContactList />,
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
