import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import FacultyList from "@/pages/faculty/FacultyList";
import FacultyTrashPage from "@/pages/faculty/FacultyTrashPage";
import MajorList from "@/pages/major/MajorList";
import MajorTrashPage from "@/pages/major/MajorTrashPage";
import SchoolClassList from "@/pages/school-class/SchoolClassList";
import ContactList from "@/pages/contact/ContactList";
import UserList from "@/pages/user/UserList";
import CreateUser from "@/pages/user/CreateUser";
import UpdateUser from "@/pages/user/UpdateUser";
import ApplicationRequestsPage from "@/pages/recruitment/ApplicationRequestsPage";
import ApplicationDetailPage from "@/pages/recruitment/ApplicationDetailPage";
import ApplicationQuestionsPage from "@/pages/recruitment/ApplicationQuestionsPage";
import ApplicationQuestionDetailPage from "@/pages/recruitment/ApplicationQuestionDetailPage";
import { LoginForm } from "@/pages/auth/LoginForm";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import NotFound from "@/pages/NotFound";
import RoleList from "@/pages/role/RoleList";
import RoleDetailPage from "@/pages/role/RoleDetailPage";
import DivisionManagementPage from "@/pages/division/DivisionManagementPage";
import DepartmentDetailPage from "@/pages/division/DepartmentDetailPage";
import DepartmentTrashPage from "@/pages/division/DepartmentTrashPage";
import PermissionList from "@/pages/permission/PermissionList";
import ClubInformationList from "@/pages/club-information/ClubInformationList";
import ClubInformationDetailPage from "@/pages/club-information/ClubInformationDetailPage";
import CreateClubInformationPage from "@/pages/club-information/CreateClubInformationPage";
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
				element: (
					<PermissionRoute permission='dashboard.view'>
						<Dashboard />
					</PermissionRoute>
				),
			},
			{
				path: "users",
				element: (
					<PermissionRoute permission='users.view'>
						<UserList />
					</PermissionRoute>
				),
			},
			{
				path: "users/create",
				element: (
					<PermissionRoute permission='users.create'>
						<CreateUser />
					</PermissionRoute>
				),
			},
			{
				path: "users/:id",
				element: (
					<PermissionRoute permission='users.update'>
						<UpdateUser />
					</PermissionRoute>
				),
			},
			{
				path: "roles",
				element: (
					<PermissionRoute permission='roles.manage'>
						<RoleList />
					</PermissionRoute>
				),
			},
			{
				path: "roles/:id",
				element: (
					<PermissionRoute permission='roles.manage'>
						<RoleDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "permissions",
				element: (
					<PermissionRoute permission='permissions.manage'>
						<PermissionList />
					</PermissionRoute>
				),
			},
			{
				path: "organization/upload",
				element: (
					<PermissionRoute permission='academic_structure.import'>
						<OrganizationImportListPage />
					</PermissionRoute>
				),
			},
			{
				path: "departments",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<FacultyList />
					</PermissionRoute>
				),
			},
			{
				path: "departments/trash",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<FacultyTrashPage />
					</PermissionRoute>
				),
			},
			{
				path: "majors",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<MajorList />
					</PermissionRoute>
				),
			},
			{
				path: "majors/trash",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<MajorTrashPage />
					</PermissionRoute>
				),
			},
			{
				path: "classes",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<SchoolClassList />
					</PermissionRoute>
				),
			},
			{
				path: "contacts",
				element: (
					<PermissionRoute permission='contacts.view'>
						<ContactList />
					</PermissionRoute>
				),
			},
			{
				path: "divisions",
				element: (
					<PermissionRoute permission='club_info.view'>
						<DivisionManagementPage />
					</PermissionRoute>
				),
			},
			{
				path: "divisions/trash",
				element: (
					<PermissionRoute permission='club_info.view'>
						<DepartmentTrashPage />
					</PermissionRoute>
				),
			},
			{
				path: "divisions/:id",
				element: (
					<PermissionRoute permission='club_info.view'>
						<DepartmentDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "club-informations",
				element: (
					<PermissionRoute permission='club_info.view'>
						<ClubInformationList />
					</PermissionRoute>
				),
			},
			{
				path: "club-informations/create",
				element: (
					<PermissionRoute permission='club_info.manage'>
						<CreateClubInformationPage />
					</PermissionRoute>
				),
			},
			{
				path: "club-informations/:id",
				element: (
					<PermissionRoute permission='club_info.view'>
						<ClubInformationDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "requests",
				element: (
					<PermissionRoute permission='applications.view'>
						<ApplicationRequestsPage />
					</PermissionRoute>
				),
			},
			{
				path: "requests/:applicationId",
				element: (
					<PermissionRoute permission='applications.view'>
						<ApplicationDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "questions",
				element: (
					<PermissionRoute permission='application_questions.view'>
						<ApplicationQuestionsPage />
					</PermissionRoute>
				),
			},
			{
				path: "questions/:questionId",
				element: (
					<PermissionRoute permission='application_questions.view'>
						<ApplicationQuestionDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "notifications",
				element: <NotificationsPage />,
			},
		],
	},
]);

export default router;
