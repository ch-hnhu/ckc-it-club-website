import MainLayout from "@/layouts/MainLayout";
import ContactPage from "@/pages/ContactPage";
import CommunityLayout from "@/pages/community/CommunityLayout";
import CommunityFeedPage from "@/pages/community/CommunityFeedPage";
import CommunityChatPage from "@/pages/community/CommunityChatPage";
import CommunityCreatePage from "@/pages/community/CommunityCreatePage";
import EditPostPage from "@/pages/community/EditPostPage";
import CommunityPostDetailPage from "@/pages/community/CommunityPostDetailPage";
import CommunityLeaderboardPage from "@/pages/community/CommunityLeaderboardPage";
import BlogFeedPage from "@/pages/blog/BlogFeedPage";
import BlogCreatePage from "@/pages/blog/BlogCreatePage";
import BlogDetailPage from "@/pages/blog/BlogDetailPage";
import BlogEditPage from "@/pages/blog/BlogEditPage";
import ResourceListPage from "@/pages/resource/ResourceListPage";
import ResourceCreatePage from "@/pages/resource/ResourceCreatePage";
import LearningFeedPage from "@/pages/learning/LearningFeedPage";
import CourseDetailPage from "@/pages/learning/CourseDetailPage";
import LessonDetailPage from "@/pages/learning/LessonDetailPage";
import VideoDetailPage from "@/pages/learning/VideoDetailPage";
import QuizPlayPage from "@/pages/learning/QuizPlayPage";
import EventsFeedPage from "@/pages/event/EventsFeedPage";
import EventDetailPage from "@/pages/event/EventDetailPage";
import LandingPage from "@/pages/LandingPage";
import AboutPage from "@/pages/AboutPage";
import CommunityRulesPage from "@/pages/CommunityRulesPage";
import NotificationsPage from "@/pages/notification/NotificationsPage";
import ApplicationPage from "@/pages/ApplicationPage";
import UserProfilePage from "@/pages/user/UserProfilePage";
import AccountPage from "@/pages/user/AccountPage";
import MyPointsPage from "@/pages/gamification/MyPointsPage";
import MyCertificatesPage from "@/pages/learning/MyCertificatesPage";
import CertificateVerifyPage from "@/pages/learning/CertificateVerifyPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import RegisterVerifyOtpPage from "@/pages/auth/RegisterVerifyOtpPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import ErrorPage from "@/pages/ErrorPage";
import RouteTitleManager from "@/components/RouteTitleManager";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
	{
		element: <RouteTitleManager />,
		children: [
			{
				path: "/",
				element: <MainLayout />,
				errorElement: <ErrorPage />,
				children: [
					{
						index: true,
						element: <LandingPage />,
						handle: { title: "Trang chủ" },
					},
					{
						path: "lien-he",
						element: <ContactPage />,
						handle: { title: "Liên hệ" },
					},
					{
						path: "ve-chung-toi",
						element: <AboutPage />,
						handle: { title: "Về chúng tôi" },
					},
					{
						path: "quy-tac-cong-dong",
						element: <CommunityRulesPage />,
						handle: { title: "Quy tắc cộng đồng" },
					},
					{
						path: "tai-khoan",
						element: <AccountPage />,
						handle: { title: "Tài khoản" },
					},
					{
						path: "thong-bao",
						element: <NotificationsPage />,
						handle: { title: "Thông báo" },
					},
					{
						path: "ung-tuyen",
						element: <ApplicationPage />,
						handle: { title: "Ứng tuyển" },
					},
					{
						path: "blog",
						element: <BlogFeedPage />,
						handle: { title: "Blog" },
					},
					{
						path: "blog/dang-bai",
						element: <BlogCreatePage />,
						handle: { title: "Đăng bài blog" },
					},
					{
						path: "blog/:slug/chinh-sua",
						element: <BlogEditPage />,
						handle: { title: "Chỉnh sửa blog" },
					},
					{
						path: "blog/:slug",
						element: <BlogDetailPage />,
						handle: { title: "Chi tiết blog" },
					},
					{
						path: "tai-nguyen",
						element: <ResourceListPage />,
						handle: { title: "Tài nguyên" },
					},
					{
						path: "tai-nguyen/gui",
						element: <ResourceCreatePage />,
						handle: { title: "Gửi tài nguyên" },
					},
					{
						path: "khoa-hoc",
						element: <LearningFeedPage />,
						handle: { title: "Khóa học" },
					},
					{
						path: "khoa-hoc/:slug",
						element: <CourseDetailPage />,
						handle: { title: "Chi tiết khóa học" },
					},
					{
						path: "khoa-hoc/:slug/:lessonSlug",
						element: <LessonDetailPage />,
						handle: { title: "Bài học" },
					},
					{
						path: "khoa-hoc/:slug/:lessonSlug/quiz",
						element: <QuizPlayPage />,
						handle: { title: "Làm bài kiểm tra" },
					},
					{
						path: "khoa-hoc/:slug/:lessonSlug/:videoSlug",
						element: <VideoDetailPage />,
						handle: { title: "Video bài học" },
					},
					{
						path: "su-kien",
						element: <EventsFeedPage />,
						handle: { title: "Sự kiện" },
					},
					{
						path: "su-kien/:slug",
						element: <EventDetailPage />,
						handle: { title: "Chi tiết sự kiện" },
					},
					{
						path: "diem-cua-toi",
						element: <MyPointsPage />,
						handle: { title: "Điểm của tôi" },
					},
					{
						path: "chung-chi-cua-toi",
						element: <MyCertificatesPage />,
						handle: { title: "Chứng chỉ của tôi" },
					},
					{
						path: "verify/:code",
						element: <CertificateVerifyPage />,
						handle: { title: "Xác minh chứng chỉ" },
					},
					{
						// Dynamic catch-all for /@username profile pages — must be last
						// Static routes above (blog, lien-he, cong-dong) always win on exact match
						path: ":username",
						element: <UserProfilePage />,
						handle: { title: "Trang cá nhân" },
					},
					{
						path: "cong-dong",
						element: <CommunityLayout />,
						handle: { title: "Cộng đồng" },
						children: [
							{
								index: true,
								element: <CommunityFeedPage />,
								handle: { title: "Cộng đồng" },
							},
							{
								path: "bai-viet/:id",
								element: <CommunityPostDetailPage />,
								handle: { title: "Chi tiết bài viết" },
							},
							{
								path: "bai-viet/:id/chinh-sua",
								element: <EditPostPage />,
								handle: { title: "Chỉnh sửa bài viết" },
							},
							{
								path: "chat",
								element: <CommunityChatPage />,
								handle: { title: "Trò chuyện" },
							},
							{
								path: "dang-bai",
								element: <CommunityCreatePage />,
								handle: { title: "Đăng bài" },
							},
							{
								path: "bang-xep-hang",
								element: <CommunityLeaderboardPage />,
								handle: { title: "Bảng xếp hạng" },
							},
							{
								path: ":channelSlug",
								element: <CommunityFeedPage />,
								handle: { title: "Kênh cộng đồng" },
							},
						],
					},
				],
			},
			{
				path: "/login",
				element: <LoginPage />,
				handle: { title: "Đăng nhập" },
			},
			{
				path: "/register",
				element: <RegisterPage />,
				handle: { title: "Đăng ký" },
			},
			{
				path: "/register/verify-otp",
				element: <RegisterVerifyOtpPage />,
				handle: { title: "Xác thực OTP" },
			},
			{
				path: "/forgot-password",
				element: <ForgotPasswordPage />,
				handle: { title: "Quên mật khẩu" },
			},
			{
				path: "/verify-otp",
				element: <VerifyOtpPage />,
				handle: { title: "Xác thực OTP" },
			},
			{
				path: "/reset-password",
				element: <ResetPasswordPage />,
				handle: { title: "Đặt lại mật khẩu" },
			},
			{
				path: "*",
				element: <ErrorPage />,
				handle: { title: "Không tìm thấy trang" },
			},
		],
	},
]);

export default router;
