import { useCallback, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import { AppSidebar } from "../components/layout/AppSidebar";
import Header from "../components/layout/Header";
import type { BreadcrumbItemType } from "../components/partials/CustomBreadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePermissionNavigationGuard } from "@/hooks/usePermissionNavigationGuard";

export type OutletContextType = {
	setBreadcrumbs: (breadcrumbs: BreadcrumbItemType[]) => void;
};

function MainLayout() {
	const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItemType[]>([{ title: "Dashboard" }]);
	const canNavigate = usePermissionNavigationGuard();
	const outletContext = useMemo(
		() => ({ setBreadcrumbs } satisfies OutletContextType),
		[setBreadcrumbs],
	);
	const handleNavigationClick = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			if (
				event.defaultPrevented ||
				event.button !== 0 ||
				event.metaKey ||
				event.altKey ||
				event.ctrlKey ||
				event.shiftKey
			) {
				return;
			}

			const target = event.target;
			if (!(target instanceof Element)) return;

			const anchor = target.closest<HTMLAnchorElement>("a[href]");
			if (!anchor || !event.currentTarget.contains(anchor)) return;
			if (anchor.target && anchor.target !== "_self") return;

			const href = anchor.getAttribute("href");
			if (!href || href.startsWith("#")) return;

			const url = new URL(href, window.location.origin);
			if (url.origin !== window.location.origin) return;

			if (!canNavigate(`${url.pathname}${url.search}${url.hash}`)) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		[canNavigate],
	);

	return (
		<SidebarProvider onClickCapture={handleNavigationClick}>
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
