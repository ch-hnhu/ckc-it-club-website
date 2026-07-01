import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import FacultyList from "@/pages/faculty/FacultyList";
import FacultyTrashPage from "@/pages/faculty/FacultyTrashPage";
import MajorList from "@/pages/major/MajorList";
import MajorTrashPage from "@/pages/major/MajorTrashPage";
import SchoolClassList from "@/pages/school-class/SchoolClassList";
import SchoolClassTrashPage from "@/pages/school-class/SchoolClassTrashPage";
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
import ProjectHubListPage from "@/pages/projecthub/ProjectHubListPage";
import ProjectBoardPage from "@/pages/projecthub/ProjectBoardPage";
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
import ChannelListPage from "@/pages/community/ChannelListPage";
import PostListPage from "@/pages/community/PostListPage";
import BlogListPage from "@/pages/community/BlogListPage";
import BlogCreatePage from "@/pages/community/BlogCreatePage";
import BlogDetailPage from "@/pages/community/BlogDetailPage";
import CommentListPage from "@/pages/community/CommentListPage";
import TagListPage from "@/pages/community/TagListPage";
import ChatRoomListPage from "@/pages/community/ChatRoomListPage";
import MediaListPage from "@/pages/community/MediaListPage";
import SkillListPage from "@/pages/community/SkillListPage";
import ReportListPage from "@/pages/community/ReportListPage";
import BlogReportListPage from "@/pages/community/BlogReportListPage";
import ResourceListPage from "@/pages/community/ResourceListPage";
import ResourceReportListPage from "@/pages/community/ResourceReportListPage";
import MailTemplateListPage from "@/pages/mail-template/MailTemplateListPage";
import MailTemplateDetailPage from "@/pages/mail-template/MailTemplateDetailPage";
import EventListPage from "@/pages/event/EventListPage";
import EventCreatePage from "@/pages/event/EventCreatePage";
import EventEditPage from "@/pages/event/EventEditPage";
import EventDetailPage from "@/pages/event/EventDetailPage";
import CourseListPage from "@/pages/learning/CourseListPage";
import CourseCategoryListPage from "@/pages/learning/CourseCategoryListPage";
import CourseFormPage from "@/pages/learning/CourseFormPage";
import CourseDetailPage from "@/pages/learning/CourseDetailPage";
import CourseTrashPage from "@/pages/learning/CourseTrashPage";
import LessonFormPage from "@/pages/learning/LessonFormPage";
import LessonDetailPage from "@/pages/learning/LessonDetailPage";
import CertificateTemplateListPage from "@/pages/learning/CertificateTemplateListPage";
import CertificateTemplateEditorPage from "@/pages/learning/CertificateTemplateEditorPage";
import PointRulesPage from "@/pages/gamification/PointRulesPage";
import RanksPage from "@/pages/gamification/RanksPage";
import LeaderboardPage from "@/pages/gamification/LeaderboardPage";
import QuizCreatePage from "@/pages/learning/QuizCreatePage";

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
					<PermissionRoute permission='roles.view'>
						<RoleList />
					</PermissionRoute>
				),
			},
			{
				path: "roles/:id",
				element: (
					<PermissionRoute permission='roles.view'>
						<RoleDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "permissions",
				element: (
					<PermissionRoute permission='permissions.view'>
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
				path: "classes/trash",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<SchoolClassTrashPage />
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
				path: "mail-templates",
				element: (
					<PermissionRoute permission='mail_templates.view'>
						<MailTemplateListPage />
					</PermissionRoute>
				),
			},
			{
				path: "mail-templates/:id",
				element: (
					<PermissionRoute permission='mail_templates.view'>
						<MailTemplateDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "notifications",
				element: <NotificationsPage />,
			},
			{
				path: "learning/courses/:courseId/lessons/:lessonId/quiz/create",
				element: (
					<PermissionRoute permission='quizzes.manage'>
						<QuizCreatePage />
					</PermissionRoute>
				),
			},
			{
				path: "events",
				element: (
					<PermissionRoute permission='events.view'>
						<EventListPage />
					</PermissionRoute>
				),
			},
			{
				path: "events/create",
				element: (
					<PermissionRoute permission='events.manage'>
						<EventCreatePage />
					</PermissionRoute>
				),
			},
			{
				path: "events/:id",
				element: (
					<PermissionRoute permission='events.view'>
						<EventDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "events/:id/edit",
				element: (
					<PermissionRoute permission='events.manage'>
						<EventEditPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/channels",
				element: (
					<PermissionRoute permission='community.channels.manage'>
						<ChannelListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/posts",
				element: (
					<PermissionRoute permission='community.posts.view'>
						<PostListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/blogs",
				element: (
					<PermissionRoute permission='community.blogs.view'>
						<BlogListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/blogs/create",
				element: (
					<PermissionRoute permission='community.blogs.manage'>
						<BlogCreatePage />
					</PermissionRoute>
				),
			},
			{
				path: "community/blogs/:id",
				element: (
					<PermissionRoute permission='community.blogs.view'>
						<BlogDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/comments",
				element: (
					<PermissionRoute permission='community.comments.view'>
						<CommentListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/tags",
				element: (
					<PermissionRoute permission='community.tags.manage'>
						<TagListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/chat",
				element: (
					<PermissionRoute permission='community.chat.view'>
						<ChatRoomListPage />
					</PermissionRoute>
				),
			},
			{
				// Redirect alias — xử lý link cũ trong thông báo
				path: "community/chat-rooms",
				element: <Navigate to='/community/chat' replace />,
			},
			{
				path: "community/media",
				element: (
					<PermissionRoute permission='community.media.view'>
						<MediaListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/skills",
				element: (
					<PermissionRoute permission='community.skills.manage'>
						<SkillListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/reports",
				element: (
					<PermissionRoute permission='community.reports.view'>
						<ReportListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/blog-reports",
				element: (
					<PermissionRoute permission='community.reports.view'>
						<BlogReportListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/resources",
				element: (
					<PermissionRoute permission='community.resources.view'>
						<ResourceListPage />
					</PermissionRoute>
				),
			},
			{
				path: "community/resource-reports",
				element: (
					<PermissionRoute permission='community.reports.view'>
						<ResourceReportListPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseListPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses/trash",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseTrashPage />
					</PermissionRoute>
				),
			},
			{
				path: "course-categories",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseCategoryListPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses/create",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CourseFormPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses/:slug",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses/:slug/edit",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CourseFormPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses/:slug/lessons/:lessonId",
				element: (
					<PermissionRoute permission='courses.view'>
						<LessonDetailPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses/:slug/lessons/create",
				element: (
					<PermissionRoute permission='courses.manage'>
						<LessonFormPage />
					</PermissionRoute>
				),
			},
			{
				path: "courses/:slug/lessons/:lessonId/edit",
				element: (
					<PermissionRoute permission='courses.manage'>
						<LessonFormPage />
					</PermissionRoute>
				),
			},
			{
				path: "certificate-templates",
				element: (
					<PermissionRoute permission='courses.view'>
						<CertificateTemplateListPage />
					</PermissionRoute>
				),
			},
			{
				path: "certificate-templates/create",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CertificateTemplateEditorPage />
					</PermissionRoute>
				),
			},
			{
				path: "certificate-templates/:id/edit",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CertificateTemplateEditorPage />
					</PermissionRoute>
				),
			},
			{
				path: "gamification/point-rules",
				element: (
					<PermissionRoute permission='gamification.manage'>
						<PointRulesPage />
					</PermissionRoute>
				),
			},
			{
				path: "gamification/ranks",
				element: (
					<PermissionRoute permission='gamification.manage'>
						<RanksPage />
					</PermissionRoute>
				),
			},
			{
				path: "gamification/leaderboard",
				element: (
					<PermissionRoute permission='gamification.view'>
						<LeaderboardPage />
					</PermissionRoute>
				),
			},
			{
				path: "to-do-list",
				element: (
					<PermissionRoute permission='admin_panel.access'>
						<ProjectHubListPage />
					</PermissionRoute>
				),
			},
			{
				path: "to-do-list/:slug",
				element: (
					<PermissionRoute permission='admin_panel.access'>
						<ProjectBoardPage />
					</PermissionRoute>
				),
			},
		],
	},
]);

export default router;
