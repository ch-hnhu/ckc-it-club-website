import { useState } from "react";
import Header from "../components/layout/Header";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/layout/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import type { BreadcrumbItemType } from "../components/partials/CustomBreadcrumb";

export type OutletContextType = {
	setBreadcrumbs: (breadcrumbs: BreadcrumbItemType[]) => void;
};

function MainLayout() {
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemType[]>([{ title: "Dashboard" }]);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className='flex flex-col h-screen bg-white dark:bg-zinc-950'>
				<div className='flex-shrink-0'>
					<Header breadcrumbs={breadcrumbs} />
				</div>
				<div className='flex flex-1 overflow-hidden relative'>
					<main className='flex-1 flex flex-col overflow-hidden'>
						<div className='flex-1 overflow-auto'>
							<Outlet context={{ setBreadcrumbs } satisfies OutletContextType} />
						</div>
					</main>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default MainLayout;
