import { Building, ChevronRight, House, Trophy, UserRoundPlus, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface SidebarProps {
	isOpen?: boolean;
	onClose?: () => void;
}

function Sidebar({ isOpen = true }: SidebarProps) {
	const [expandedMenu, setExpandedMenu] = useState<string | null>("dashboard");

	const toggleMenu = (menuName: string) => {
		setExpandedMenu(expandedMenu === menuName ? null : menuName);
	};

	const menuItems = [
		{
			id: "dashboard",
			label: "Dashboard",
			icon: House,
			subItems: [
				{ label: "Thống kê", href: "/" },
				{ label: "Báo cáo", href: "/reports" },
			],
		},
		{
			id: "users",
			label: "Quản lý người dùng",
			icon: Users,
			subItems: [
				{ label: "Người dùng", href: "/users" },
				{ label: "Vai trò", href: "/roles" },
				{ label: "Phân quyền", href: "/permissions" },
			],
		},
		{
			id: "organization",
			label: "Quản lý đơn vị",
			icon: Building,
			subItems: [
				{ label: "Khoa", href: "/departments" },
				{ label: "Ngành", href: "/majors" },
				{ label: "Lớp", href: "/classes" },
			],
		},
		{
			id: "club",
			label: "Quản lý CLB",
			icon: Trophy,
			subItems: [
				{ label: "Các ban", href: "/divisions" },
				{ label: "Thông tin CLB", href: "/club-info" },
				{ label: "Trường thông tin", href: "/fields" },
			],
		},
		{
			id: "recruitment",
			label: "Tuyển thành viên",
			icon: UserRoundPlus,
			subItems: [
				{ label: "Câu hỏi ứng tuyển", href: "/questions" },
				{ label: "Câu trả lời", href: "/answers" },
				{ label: "Yêu cầu tham gia", href: "/requests" },
			],
		},
	];

	return (
		<aside
			className={`bg-card border-border absolute left-0 top-0 z-20 flex h-full w-64 flex-col border-r transition-transform duration-300 lg:static ${
				isOpen ? "translate-x-0" : "-translate-x-full"
			}`}>
			<div className='border-border flex h-16 flex-shrink-0 items-center gap-3 border-b px-6'>
				<div className='bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center overflow-hidden rounded-full font-bold'>
					<img
						src='../../../public/img/ckc-it-club-logo.jpg'
						alt='Logo'
						className='h-full w-full rounded-full object-cover'
					/>
				</div>
				<div className='min-w-0 flex-1'>
					<h2 className='text-primary truncate text-sm font-semibold'>CKC IT CLUB</h2>
					<p className='text-muted-foreground text-xs'>Dashboard</p>
				</div>
			</div>

			<nav className='flex-1 overflow-y-auto py-4'>
				<ul className='space-y-1 px-3'>
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isExpanded = expandedMenu === item.id;

						return (
							<li key={item.id}>
								<button
									onClick={() => toggleMenu(item.id)}
									className='text-foreground hover:bg-muted flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors group'>
									<div className='flex flex-1 items-center gap-3'>
										<Icon className='text-muted-foreground group-hover:text-primary h-4 w-4' />
										<span className='text-xs font-medium lg:text-sm'>{item.label}</span>
									</div>
									<ChevronRight
										className={`text-muted-foreground h-4 w-4 transition-transform ${
											isExpanded ? "rotate-90" : ""
										}`}
									/>
								</button>
								{isExpanded && (
									<ul className='border-border mt-1 ml-[22px] space-y-1 border-l pl-[10px]'>
										{item.subItems.map((subItem) => (
											<li key={subItem.href}>
												<Link
													to={subItem.href}
													className='text-muted-foreground hover:text-primary hover:bg-muted block rounded-lg px-3 py-2 text-xs transition-colors hover:!no-underline lg:text-sm'>
													{subItem.label}
												</Link>
											</li>
										))}
									</ul>
								)}
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}

export default Sidebar;
