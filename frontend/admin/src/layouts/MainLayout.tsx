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
		<div className='flex flex-col h-screen bg-white dark:bg-zinc-950'>
			<div className='flex-shrink-0'>
				<Header onToggleSidebar={toggleSidebar} />
			</div>
			<div className='flex flex-1 overflow-hidden relative'>
				<aside
					className='absolute lg:relative left-0 top-0 z-30 h-full lg:h-auto flex-shrink-0 bg-white dark:bg-zinc-950 border-r border-[#e0e0e0] dark:border-zinc-800'
					style={{
						width: sidebarOpen ? "16rem" : "0",
						transition: "width 300ms",
					}}>
					<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				</aside>
				<main className='flex-1 flex flex-col overflow-hidden'>
					<div className='flex-1 overflow-auto'>
						<Outlet />
					</div>
				</main>
			</div>
			<Footer />
		</div>
	);
}

export default MainLayout;
