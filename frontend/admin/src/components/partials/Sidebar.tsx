import { Building, House, Trophy, UserRoundPlus, Users, ChevronRight } from "lucide-react";
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
				{ label: "Lựa chọn câu hỏi", href: "/selected-questions" },
				{ label: "Câu trả lời", href: "/answers" },
				{ label: "Yêu cầu tham gia", href: "/requests" },
			],
		},
	];

	return (
		<aside
			className={`absolute lg:static left-0 top-0 h-full w-64 bg-white dark:bg-zinc-950 border-r border-[#e0e0e0] dark:border-zinc-800 transition-transform duration-300 flex flex-col z-20 ${
				isOpen ? "translate-x-0" : "-translate-x-full"
			}`}>
			{/* Brand */}
			<div className='h-16 px-6 flex items-center border-b border-[#e0e0e0] dark:border-zinc-800 gap-3 flex-shrink-0'>
				<div className='w-8 h-8 rounded-full bg-[#2e3820] dark:bg-zinc-800 flex items-center justify-center text-white font-bold overflow-hidden'>
					<img
						src='../../../public/img/ckc-it-club-logo.jpg'
						alt='Logo'
						className='w-full h-full object-cover rounded-full'
					/>
				</div>
				<div className='flex-1 min-w-0'>
					<h2 className='text-sm font-semibold text-[#2e3820] dark:text-zinc-200 truncate'>
						CKC IT CLUB
					</h2>
					<p className='text-xs text-[#999999] dark:text-zinc-500'>Dashboard</p>
				</div>
			</div>

			{/* Navigation */}
			<nav className='py-4 flex-1 overflow-y-auto'>
				<ul className='space-y-1 px-3'>
					{menuItems.map((item) => {
						const Icon = item.icon;
						const isExpanded = expandedMenu === item.id;

						return (
							<li key={item.id}>
								<button
									onClick={() => toggleMenu(item.id)}
									className='w-full px-3 py-2 rounded-lg text-[#1a1a1a] dark:text-zinc-100 hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 transition-colors flex items-center justify-between group'>
									<div className='flex items-center gap-3 flex-1'>
										<Icon className='w-4 h-4 text-[#666666] dark:text-zinc-400 group-hover:text-[#2e3820] dark:text-zinc-200' />
										<span className='text-sm lg:text-md text-xs font-medium'>
											{item.label}
										</span>
									</div>
									<ChevronRight
										className={`w-4 h-4 text-[#999999] dark:text-zinc-500 transition-transform ${
											isExpanded ? "rotate-90" : ""
										}`}
									/>
								</button>

								{/* Submenu */}
								{isExpanded && (
									<ul className='mt-1 space-y-1 ml-[22px] pl-[10px] border-l border-[#e0e0e0] dark:border-zinc-800'>
										{item.subItems.map((subItem) => (
											<li key={subItem.href}>
												<Link
													to={subItem.href}
													className='block px-3 py-2 text-sm lg:text-md text-xs font-small text-[#666666] dark:text-zinc-400 hover:text-[#2e3820] dark:hover:text-[#2e3820] hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 hover:!no-underline rounded-lg transition-colors'>
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
