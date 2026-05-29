import React, { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/partials/Navbar";
import Footer from "@/components/partials/Footer";
import BackToTop from "@/components/partials/BackToTop";
import { getCurrentUser, type AuthUser } from "@/services/auth.service";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

const MainLayout: React.FC = () => {
	const [user, setUser] = useState<AuthUser | null>(null);
	const { pathname } = useLocation();
	const isCommunityPage =
		(pathname.startsWith("/cong-dong") || pathname.startsWith("/community")) &&
		!pathname.startsWith("/cong-dong/blog");

	const refreshUser = useCallback(async () => {
		const currentUser = await getCurrentUser();
		setUser(currentUser);
	}, []);

	useEffect(() => {
		let isMounted = true;

		getCurrentUser().then((currentUser) => {
			if (isMounted) {
				setUser(currentUser);
			}
		});

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	}, [pathname]);

	return (
		<div className='min-h-screen bg-white text-black flex flex-col'>
			{/* Fixed Navbar */}
			<Navbar user={user} onAuthSuccess={refreshUser} />

			{/* Main content */}
			<main className='flex-grow flex flex-col'>
				<Outlet context={{ user }} />
			</main>

			{!isCommunityPage && <Footer />}

			{/* Back to top button */}
			<BackToTop />

			{/* Global toast notifications */}
			<Toaster
				position='bottom-right'
				richColors
				toastOptions={{
					classNames: {
						toast: "!rounded-xl !border-2 !border-black !shadow-[4px_4px_0_#111] !font-bold !text-sm",
					},
				}}
			/>
		</div>
	);
};

export default MainLayout;
