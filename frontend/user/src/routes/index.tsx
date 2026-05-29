import MainLayout from "@/layouts/MainLayout";
import ContactPage from "@/pages/ContactPage";
import CommunityLayout from "@/pages/community/CommunityLayout";
import CommunityFeedPage from "@/pages/community/CommunityFeedPage";
import CommunityCreatePage from "@/pages/community/CommunityCreatePage";
import CommunityPostDetailPage from "@/pages/community/CommunityPostDetailPage";
import BlogFeedPage from "@/pages/community/BlogFeedPage";
import BlogDetailPage from "@/pages/community/BlogDetailPage";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
	{
		path: "/",
		element: <MainLayout />,
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
				path: "cong-dong/dang-bai",
				element: <CommunityCreatePage />,
			},
			{
				path: "cong-dong/blog",
				element: <BlogFeedPage />,
			},
			{
				path: "cong-dong/blog/:slug",
				element: <BlogDetailPage />,
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
]);

export default router;
