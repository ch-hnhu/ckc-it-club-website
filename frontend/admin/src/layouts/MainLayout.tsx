import { useState } from "react";
import Header from "../components/partials/Header";
import Sidebar from "../components/partials/Sidebar";
import Footer from "../components/partials/Footer";
import { Outlet } from "react-router-dom";

function MainLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen);
	};

	return (
		<div className='flex flex-col min-h-screen bg-white'>
			<Header onToggleSidebar={toggleSidebar} />
			<div className='flex flex-1 overflow-hidden'>
				<div
					className='fixed lg:static left-0 top-0 z-30 h-full'
					style={{
						width: sidebarOpen ? "16rem" : "0",
						transition: "width 300ms",
					}}>
					<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				</div>
				<main className='flex-1 overflow-auto'>
					<Outlet />
				</main>
			</div>
			<Footer />
		</div>
	);
}

export default MainLayout;
