import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { CustomBreadcrumb, type BreadcrumbItemType } from "../partials/CustomBreadcrumb";
import NotificationBell from "./NotificationBell";

export interface HeaderProps {
	breadcrumbs?: BreadcrumbItemType[];
}

function Header({ breadcrumbs }: HeaderProps) {
	return (
		<header className='flex h-16 shrink-0 items-center justify-between border-b border-[#e0e0e0] dark:border-zinc-800 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
			<div className='flex items-center gap-2'>
				<SidebarTrigger className='-ml-1' />
				<Separator
					orientation='vertical'
					className='mr-2 data-[orientation=vertical]:h-4'
				/>
				{breadcrumbs && <CustomBreadcrumb items={breadcrumbs} />}
			</div>
			<div className='flex items-center gap-2'>
				<NotificationBell />
			</div>
		</header>
	);
}

export default Header;
