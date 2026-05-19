import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import FacultyList from "@/pages/faculty/FacultyList";
import MajorList from "@/pages/major/MajorList";
import SchoolClassList from "@/pages/school-class/SchoolClassList";
import ContactList from "@/pages/contact/ContactList";
import UserList from "@/pages/user/UserList";
import CreateUser from "@/pages/user/CreateUser";
import UpdateUser from "@/pages/user/UpdateUser";
import ApplicationRequestsPage from "@/pages/recruitment/ApplicationRequestsPage";
import ApplicationDetailPage from "@/pages/recruitment/ApplicationDetailPage";
import ApplicationQuestionsPage from "@/pages/recruitment/ApplicationQuestionsPage";
import ApplicationQuestionDetailPage from "@/pages/recruitment/ApplicationQuestionDetailPage";
import ApplicationAnswersPage from "@/pages/recruitment/ApplicationAnswersPage";
import { LoginForm } from "@/pages/auth/LoginForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotFound from "@/pages/NotFound";
import RoleList from "@/pages/role/RoleList";
import DivisionManagementPage from "@/pages/division/DivisionManagementPage";
import PermissionList from "@/pages/permission/PermissionList";
import ClubInformationList from "@/pages/club-information/ClubInformationList";
import ClubInformationDetailPage from "@/pages/club-information/ClubInformationDetailPage";
import OrganizationImportListPage from "@/pages/organization/OrganizationImportListPage";
import NotificationsPage from "@/pages/notification/NotificationsPage";

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
				path: "users/create",
				element: <CreateUser />,
			},
			{
				path: "users/:id",
				element: <UpdateUser />,
			},
			{
				path: "roles",
				element: <RoleList />,
			},
			{
				path: "permissions",
				element: <PermissionList />,
			},
			{
				path: "organization/upload",
				element: <OrganizationImportListPage />,
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
				path: "divisions",
				element: <DivisionManagementPage />,
			},
			{
				path: "club-informations",
				element: <ClubInformationList />,
			},
			{
				path: "club-informations/:id",
				element: <ClubInformationDetailPage />,
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
			{
				path: "notifications",
				element: <NotificationsPage />,
			},
		],
	},
]);

export default router;
