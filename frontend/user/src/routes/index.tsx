import MainLayout from "@/layouts/MainLayout";
import ContactPage from "@/pages/ContactPage";
import CommunityCreatePage from "@/pages/community/CommunityCreatePage";
import CommunityPage from "@/pages/community/CommunityPage";
import CommunityPostDetailPage from "@/pages/community/CommunityPostDetailPage";
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
				path: "cong-dong",
				element: <CommunityPage />,
			},
			{
				path: "cong-dong/bai-viet/:id",
				element: <CommunityPostDetailPage />,
			},
			{
				path: "cong-dong/dang-bai",
				element: <CommunityCreatePage />,
			},
			{
				path: "cong-dong/:channelSlug",
				element: <CommunityPage />,
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
