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
import AboutPageEditor from "@/pages/about-page/AboutPageEditor";
import LandingPageEditor from "@/pages/landing-page/LandingPageEditor";
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
import RouteTitleManager from "@/components/RouteTitleManager";

const appRoutes = [
	{
		path: "/login",
		element: <LoginForm />,
		handle: { title: "Đăng nhập" },
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
				handle: { title: "Bảng điều khiển" },
			},
			{
				path: "users",
				element: (
					<PermissionRoute permission='users.view'>
						<UserList />
					</PermissionRoute>
				),
				handle: { title: "Người dùng" },
			},
			{
				path: "users/create",
				element: (
					<PermissionRoute permission='users.create'>
						<CreateUser />
					</PermissionRoute>
				),
				handle: { title: "Thêm người dùng" },
			},
			{
				path: "users/:id",
				element: (
					<PermissionRoute permission='users.update'>
						<UpdateUser />
					</PermissionRoute>
				),
				handle: { title: "Cập nhật người dùng" },
			},
			{
				path: "roles",
				element: (
					<PermissionRoute permission='roles.view'>
						<RoleList />
					</PermissionRoute>
				),
				handle: { title: "Vai trò" },
			},
			{
				path: "roles/:id",
				element: (
					<PermissionRoute permission='roles.view'>
						<RoleDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết vai trò" },
			},
			{
				path: "permissions",
				element: (
					<PermissionRoute permission='permissions.view'>
						<PermissionList />
					</PermissionRoute>
				),
				handle: { title: "Quyền hạn" },
			},
			{
				path: "organization/upload",
				element: (
					<PermissionRoute permission='academic_structure.import'>
						<OrganizationImportListPage />
					</PermissionRoute>
				),
				handle: { title: "Tải lên danh sách đơn vị" },
			},
			{
				path: "departments",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<FacultyList />
					</PermissionRoute>
				),
				handle: { title: "Khoa" },
			},
			{
				path: "departments/trash",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<FacultyTrashPage />
					</PermissionRoute>
				),
				handle: { title: "Thùng rác khoa" },
			},
			{
				path: "majors",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<MajorList />
					</PermissionRoute>
				),
				handle: { title: "Ngành" },
			},
			{
				path: "majors/trash",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<MajorTrashPage />
					</PermissionRoute>
				),
				handle: { title: "Thùng rác ngành" },
			},
			{
				path: "classes",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<SchoolClassList />
					</PermissionRoute>
				),
				handle: { title: "Lớp" },
			},
			{
				path: "classes/trash",
				element: (
					<PermissionRoute permission='academic_data.view'>
						<SchoolClassTrashPage />
					</PermissionRoute>
				),
				handle: { title: "Thùng rác lớp" },
			},
			{
				path: "contacts",
				element: (
					<PermissionRoute permission='contacts.view'>
						<ContactList />
					</PermissionRoute>
				),
				handle: { title: "Quản lý liên hệ" },
			},
			{
				path: "divisions",
				element: (
					<PermissionRoute permission='club_info.view'>
						<DivisionManagementPage />
					</PermissionRoute>
				),
				handle: { title: "Các ban" },
			},
			{
				path: "divisions/trash",
				element: (
					<PermissionRoute permission='club_info.view'>
						<DepartmentTrashPage />
					</PermissionRoute>
				),
				handle: { title: "Thùng rác ban" },
			},
			{
				path: "divisions/:id",
				element: (
					<PermissionRoute permission='club_info.view'>
						<DepartmentDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết ban" },
			},
			{
				path: "club-informations",
				element: (
					<PermissionRoute permission='club_info.view'>
						<ClubInformationList />
					</PermissionRoute>
				),
				handle: { title: "Thông tin CLB" },
			},
			{
				path: "club-informations/create",
				element: (
					<PermissionRoute permission='club_info.manage'>
						<CreateClubInformationPage />
					</PermissionRoute>
				),
				handle: { title: "Thêm thông tin CLB" },
			},
			{
				path: "club-informations/:id",
				element: (
					<PermissionRoute permission='club_info.view'>
						<ClubInformationDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết thông tin CLB" },
			},
			{
				path: "landing-page",
				element: (
					<PermissionRoute permission='club_info.view'>
						<LandingPageEditor />
					</PermissionRoute>
				),
				handle: { title: "Quản lý trang chủ" },
			},
			{
				path: "about-page",
				element: (
					<PermissionRoute permission='club_info.view'>
						<AboutPageEditor />
					</PermissionRoute>
				),
				handle: { title: "Quản lý trang giới thiệu" },
			},
			{
				path: "requests",
				element: (
					<PermissionRoute permission='applications.view'>
						<ApplicationRequestsPage />
					</PermissionRoute>
				),
				handle: { title: "Yêu cầu tham gia" },
			},
			{
				path: "requests/:applicationId",
				element: (
					<PermissionRoute permission='applications.view'>
						<ApplicationDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết đơn ứng tuyển" },
			},
			{
				path: "questions",
				element: (
					<PermissionRoute permission='application_questions.view'>
						<ApplicationQuestionsPage />
					</PermissionRoute>
				),
				handle: { title: "Form ứng tuyển" },
			},
			{
				path: "questions/:questionId",
				element: (
					<PermissionRoute permission='application_questions.view'>
						<ApplicationQuestionDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết câu hỏi" },
			},
			{
				path: "mail-templates",
				element: (
					<PermissionRoute permission='mail_templates.view'>
						<MailTemplateListPage />
					</PermissionRoute>
				),
				handle: { title: "Mail template" },
			},
			{
				path: "mail-templates/:id",
				element: (
					<PermissionRoute permission='mail_templates.view'>
						<MailTemplateDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết mail template" },
			},
			{
				path: "notifications",
				element: <NotificationsPage />,
				handle: { title: "Thông báo" },
			},
			{
				path: "learning/courses/:courseId/lessons/:lessonId/quiz/create",
				element: (
					<PermissionRoute permission='quizzes.manage'>
						<QuizCreatePage />
					</PermissionRoute>
				),
				handle: { title: "Tạo bài kiểm tra" },
			},
			{
				path: "events",
				element: (
					<PermissionRoute permission='events.view'>
						<EventListPage />
					</PermissionRoute>
				),
				handle: { title: "Quản lý sự kiện" },
			},
			{
				path: "events/create",
				element: (
					<PermissionRoute permission='events.manage'>
						<EventCreatePage />
					</PermissionRoute>
				),
				handle: { title: "Tạo sự kiện" },
			},
			{
				path: "events/:id",
				element: (
					<PermissionRoute permission='events.view'>
						<EventDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết sự kiện" },
			},
			{
				path: "events/:id/edit",
				element: (
					<PermissionRoute permission='events.manage'>
						<EventEditPage />
					</PermissionRoute>
				),
				handle: { title: "Chỉnh sửa sự kiện" },
			},
			{
				path: "community/channels",
				element: (
					<PermissionRoute permission='community.channels.manage'>
						<ChannelListPage />
					</PermissionRoute>
				),
				handle: { title: "Kênh cộng đồng" },
			},
			{
				path: "community/posts",
				element: (
					<PermissionRoute permission='community.posts.view'>
						<PostListPage />
					</PermissionRoute>
				),
				handle: { title: "Post" },
			},
			{
				path: "community/blogs",
				element: (
					<PermissionRoute permission='community.blogs.view'>
						<BlogListPage />
					</PermissionRoute>
				),
				handle: { title: "Blog" },
			},
			{
				path: "community/blogs/create",
				element: (
					<PermissionRoute permission='community.blogs.manage'>
						<BlogCreatePage />
					</PermissionRoute>
				),
				handle: { title: "Tạo blog" },
			},
			{
				path: "community/blogs/:id",
				element: (
					<PermissionRoute permission='community.blogs.view'>
						<BlogDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết blog" },
			},
			{
				path: "community/comments",
				element: (
					<PermissionRoute permission='community.comments.view'>
						<CommentListPage />
					</PermissionRoute>
				),
				handle: { title: "Bình luận" },
			},
			{
				path: "community/tags",
				element: (
					<PermissionRoute permission='community.tags.manage'>
						<TagListPage />
					</PermissionRoute>
				),
				handle: { title: "Tags" },
			},
			{
				path: "community/chat",
				element: (
					<PermissionRoute permission='community.chat.view'>
						<ChatRoomListPage />
					</PermissionRoute>
				),
				handle: { title: "Phòng chat" },
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
				handle: { title: "Media" },
			},
			{
				path: "community/skills",
				element: (
					<PermissionRoute permission='community.skills.manage'>
						<SkillListPage />
					</PermissionRoute>
				),
				handle: { title: "Skills" },
			},
			{
				path: "community/reports",
				element: (
					<PermissionRoute permission='community.reports.view'>
						<ReportListPage />
					</PermissionRoute>
				),
				handle: { title: "Báo cáo vi phạm" },
			},
			{
				path: "community/blog-reports",
				element: (
					<PermissionRoute permission='community.reports.view'>
						<BlogReportListPage />
					</PermissionRoute>
				),
				handle: { title: "Báo cáo blog" },
			},
			{
				path: "community/resources",
				element: (
					<PermissionRoute permission='community.resources.view'>
						<ResourceListPage />
					</PermissionRoute>
				),
				handle: { title: "Danh sách tài nguyên" },
			},
			{
				path: "community/resource-reports",
				element: (
					<PermissionRoute permission='community.reports.view'>
						<ResourceReportListPage />
					</PermissionRoute>
				),
				handle: { title: "Báo cáo tài nguyên" },
			},
			{
				path: "courses",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseListPage />
					</PermissionRoute>
				),
				handle: { title: "Khóa học" },
			},
			{
				path: "courses/trash",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseTrashPage />
					</PermissionRoute>
				),
				handle: { title: "Thùng rác khóa học" },
			},
			{
				path: "course-categories",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseCategoryListPage />
					</PermissionRoute>
				),
				handle: { title: "Danh mục khóa học" },
			},
			{
				path: "courses/create",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CourseFormPage />
					</PermissionRoute>
				),
				handle: { title: "Tạo khóa học" },
			},
			{
				path: "courses/:slug",
				element: (
					<PermissionRoute permission='courses.view'>
						<CourseDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết khóa học" },
			},
			{
				path: "courses/:slug/edit",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CourseFormPage />
					</PermissionRoute>
				),
				handle: { title: "Chỉnh sửa khóa học" },
			},
			{
				path: "courses/:slug/lessons/:lessonId",
				element: (
					<PermissionRoute permission='courses.view'>
						<LessonDetailPage />
					</PermissionRoute>
				),
				handle: { title: "Chi tiết bài học" },
			},
			{
				path: "courses/:slug/lessons/create",
				element: (
					<PermissionRoute permission='courses.manage'>
						<LessonFormPage />
					</PermissionRoute>
				),
				handle: { title: "Tạo bài học" },
			},
			{
				path: "courses/:slug/lessons/:lessonId/edit",
				element: (
					<PermissionRoute permission='courses.manage'>
						<LessonFormPage />
					</PermissionRoute>
				),
				handle: { title: "Chỉnh sửa bài học" },
			},
			{
				path: "certificate-templates",
				element: (
					<PermissionRoute permission='courses.view'>
						<CertificateTemplateListPage />
					</PermissionRoute>
				),
				handle: { title: "Giấy chứng nhận" },
			},
			{
				path: "certificate-templates/create",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CertificateTemplateEditorPage />
					</PermissionRoute>
				),
				handle: { title: "Tạo giấy chứng nhận" },
			},
			{
				path: "certificate-templates/:id/edit",
				element: (
					<PermissionRoute permission='courses.manage'>
						<CertificateTemplateEditorPage />
					</PermissionRoute>
				),
				handle: { title: "Chỉnh sửa giấy chứng nhận" },
			},
			{
				path: "gamification/point-rules",
				element: (
					<PermissionRoute permission='gamification.manage'>
						<PointRulesPage />
					</PermissionRoute>
				),
				handle: { title: "Activity Point Rules" },
			},
			{
				path: "gamification/ranks",
				element: (
					<PermissionRoute permission='gamification.manage'>
						<RanksPage />
					</PermissionRoute>
				),
				handle: { title: "Rank Rules" },
			},
			{
				path: "gamification/leaderboard",
				element: (
					<PermissionRoute permission='gamification.view'>
						<LeaderboardPage />
					</PermissionRoute>
				),
				handle: { title: "Leaderboard" },
			},
			{
				path: "to-do-list",
				element: (
					<PermissionRoute permission='admin_panel.access'>
						<ProjectHubListPage />
					</PermissionRoute>
				),
				handle: { title: "Việc cần làm" },
			},
			{
				path: "to-do-list/:slug",
				element: (
					<PermissionRoute permission='admin_panel.access'>
						<ProjectBoardPage />
					</PermissionRoute>
				),
				handle: { title: "Bảng công việc" },
			},
		],
	},
];

const router = createBrowserRouter([
	{
		element: <RouteTitleManager />,
		children: appRoutes,
	},
]);

export default router;
