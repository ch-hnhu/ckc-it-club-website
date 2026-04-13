import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { AppSidebar } from "../components/layout/AppSidebar";
import Header from "../components/layout/Header";
import type { BreadcrumbItemType } from "../components/partials/CustomBreadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export type OutletContextType = {
	setBreadcrumbs: (breadcrumbs: BreadcrumbItemType[]) => void;
};

function MainLayout() {
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemType[]>([{ title: "Dashboard" }]);
	const outletContext = useMemo(
		() => ({ setBreadcrumbs } satisfies OutletContextType),
		[setBreadcrumbs],
	);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className='flex h-screen flex-col bg-background'>
				<div className='flex-shrink-0'>
					<Header breadcrumbs={breadcrumbs} />
				</div>
				<div className='relative flex flex-1 overflow-hidden'>
					<main className='flex flex-1 flex-col overflow-hidden'>
						<div className='flex-1 overflow-auto'>
							<Outlet context={outletContext} />
						</div>
					</main>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default MainLayout;
