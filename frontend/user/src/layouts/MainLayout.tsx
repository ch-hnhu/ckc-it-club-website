import React, { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/partials/Navbar";
import Footer from "@/components/partials/Footer";
import BackToTop from "@/components/partials/BackToTop";
import { getCurrentUser, type AuthUser } from "@/services/auth.service";
import { Outlet, useLocation } from "react-router-dom";

const MainLayout: React.FC = () => {
	const [user, setUser] = useState<AuthUser | null>(null);
	const { pathname } = useLocation();

	const refreshUser = useCallback(async () => {
		const currentUser = await getCurrentUser();
		setUser(currentUser);
	}, []);

	useEffect(() => {
		refreshUser();
	}, [refreshUser]);

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	}, [pathname]);

	return (
		<div className='min-h-screen bg-white text-black flex flex-col'>
			{/* Fixed Navbar */}
			<Navbar user={user} onAuthSuccess={refreshUser} />

			{/* Main content */}
			<main className='flex-grow flex flex-col'>
				<Outlet />
			</main>

			<Footer />

			{/* Back to top button */}
			<BackToTop />
		</div>
	);
};

export default MainLayout;
