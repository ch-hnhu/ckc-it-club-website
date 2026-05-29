import MainLayout from "@/layouts/MainLayout";
import ContactPage from "@/pages/ContactPage";
import CommunityLayout from "@/pages/community/CommunityLayout";
import CommunityFeedPage from "@/pages/community/CommunityFeedPage";
import CommunityCreatePage from "@/pages/community/CommunityCreatePage";
import CommunityPostDetailPage from "@/pages/community/CommunityPostDetailPage";
import BlogFeedPage from "@/pages/Blog/BlogFeedPage";
import BlogDetailPage from "@/pages/Blog/BlogDetailPage";
import LandingPage from "@/pages/LandingPage";
import UserProfilePage from "@/pages/UserProfilePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import ErrorPage from "@/pages/ErrorPage";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
	{
		path: "/",
		element: <MainLayout />,
		errorElement: <ErrorPage />,
		children: [
			{
				index: true,
				element: <LandingPage />,
			},
			{
				path: "lien-he",
				element: <ContactPage />,
			},
			{
				path: "blog",
				element: <BlogFeedPage />,
			},
			{
				path: "blog/:slug",
				element: <BlogDetailPage />,
			},
			{
				// Dynamic catch-all for /@username profile pages — must be last
				// Static routes above (blog, lien-he, cong-dong) always win on exact match
				path: ":username",
				element: <UserProfilePage />,
			},
			{
				path: "cong-dong",
				element: <CommunityLayout />,
				children: [
					{
						index: true,
						element: <CommunityFeedPage />,
					},
					{
						path: "bai-viet/:id",
						element: <CommunityPostDetailPage />,
					},
					{
						path: "dang-bai",
						element: <CommunityCreatePage />,
					},
					{
						path: ":channelSlug",
						element: <CommunityFeedPage />,
					},
				],
			},
		],
	},
	{
		path: "/login",
		element: <LoginPage />,
	},
	{
		path: "/register",
		element: <RegisterPage />,
	},
	{
		path: "/forgot-password",
		element: <ForgotPasswordPage />,
	},
	{
		path: "/verify-otp",
		element: <VerifyOtpPage />,
	},
	{
		path: "/reset-password",
		element: <ResetPasswordPage />,
	},
	{
		path: "*",
		element: <ErrorPage />,
	},
]);

export default router;
