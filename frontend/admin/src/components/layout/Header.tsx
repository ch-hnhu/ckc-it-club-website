import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { CustomBreadcrumb, type BreadcrumbItemType } from "../partials/CustomBreadcrumb";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

export interface HeaderProps {
	breadcrumbs?: BreadcrumbItemType[];
}

function Header({ breadcrumbs }: HeaderProps) {
	const [showNotifications, setShowNotifications] = useState(false);
	const notificationsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				notificationsRef.current &&
				!notificationsRef.current.contains(event.target as Node)
			) {
				setShowNotifications(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

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
				{/* Notifications */}
				<div className='relative' ref={notificationsRef}>
					<button
						onClick={() => setShowNotifications(!showNotifications)}
						className='p-2 hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 rounded-lg transition-colors relative'>
						<Bell className='w-5 h-5 text-[#1a1a1a] dark:text-zinc-100' />
						<span className='absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full'></span>
					</button>
					{showNotifications && (
						<div className='absolute right-0 mt-2 w-80 z-50 bg-white dark:bg-zinc-950 rounded-lg border border-[#e0e0e0] dark:border-zinc-800 shadow-lg'>
							<div className='p-3 border-b border-[#e0e0e0] dark:border-zinc-800'>
								<h3 className='font-semibold text-[#1a1a1a] dark:text-zinc-100'>
									Notifications (5)
								</h3>
							</div>
							<div className='max-h-80 overflow-y-auto'>
								<div className='p-3 border-b border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#f5f5f5] dark:bg-zinc-900 cursor-pointer'>
									<p className='text-sm font-medium text-[#1a1a1a] dark:text-zinc-100'>
										System Update
									</p>
									<p className='text-xs text-[#666666] dark:text-zinc-400'>
										Dashboard updated to v2.1.0
									</p>
									<p className='text-xs text-[#999999] dark:text-zinc-500 mt-1'>
										2 hours ago
									</p>
								</div>
								<div className='p-3 border-b border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#f5f5f5] dark:bg-zinc-900 cursor-pointer'>
									<p className='text-sm font-medium text-[#1a1a1a] dark:text-zinc-100'>
										New User Registration
									</p>
									<p className='text-xs text-[#666666] dark:text-zinc-400'>
										5 new users joined today
									</p>
									<p className='text-xs text-[#999999] dark:text-zinc-500 mt-1'>
										4 hours ago
									</p>
								</div>
								<div className='p-3 border-b border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#f5f5f5] dark:bg-zinc-900 cursor-pointer'>
									<p className='text-sm font-medium text-[#1a1a1a] dark:text-zinc-100'>
										New Order
									</p>
									<p className='text-xs text-[#666666] dark:text-zinc-400'>
										Order #12345 received
									</p>
									<p className='text-xs text-[#999999] dark:text-zinc-500 mt-1'>
										6 hours ago
									</p>
								</div>
							</div>
							<div className='p-3 border-t border-[#e0e0e0] dark:border-zinc-800 text-center'>
								<a
									href='#'
									className='text-xs text-[#2e3820] dark:text-zinc-200 hover:underline'>
									View all notifications
								</a>
							</div>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;
