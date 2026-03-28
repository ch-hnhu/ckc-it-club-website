import { Menu, Bell, MessageSquare, LogOut, User, Settings, Search } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import userService from "@/services/user.service";
import type { User as UserType } from "@/types/user.type";
import { useNavigate } from "react-router-dom";
import { ModeToggle } from "@/components/partials/mode-toggle";

interface HeaderProps {
	onToggleSidebar?: () => void;
}

function Header({ onToggleSidebar }: HeaderProps) {
	const [showNotifications, setShowNotifications] = useState(false);
	const [showMessages, setShowMessages] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [user, setUser] = useState<UserType | null>(null);
	const navigate = useNavigate();

	const messagesRef = useRef<HTMLDivElement>(null);
	const notificationsRef = useRef<HTMLDivElement>(null);
	const userMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
				setShowMessages(false);
			}
			if (
				notificationsRef.current &&
				!notificationsRef.current.contains(event.target as Node)
			) {
				setShowNotifications(false);
			}
			if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		userService
			.getMe()
			.then((response) => {
				if (response.success) {
					setUser(response.data);
				}
			})
			.catch((err) => console.error("Failed to fetch user", err));
	}, []);

	const handleLogout = () => {
		localStorage.clear();
		navigate("/login");
	};

	return (
		<header className='sticky top-0 z-40 border-b border-[#e0e0e0] dark:border-zinc-800 bg-white dark:bg-zinc-950'>
			<div className='h-16 px-6 flex items-center justify-between'>
				{/* Left Side */}
				<div className='flex items-center gap-4'>
					<button
						onClick={onToggleSidebar}
						className='p-2 hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 rounded-lg transition-colors'
						aria-label='Toggle sidebar'>
						<Menu className='w-5 h-5 text-[#1a1a1a] dark:text-zinc-100' />
					</button>
					<h1 className='text-xl font-semibold text-[#1a1a1a] dark:text-zinc-100 hidden md:block'>
						Dashboard
					</h1>
				</div>

				{/* Right Side */}
				<div className='flex items-center gap-2'>
					{/* Mode Toggle */}
					<div className='relative'>
						<ModeToggle />
					</div>
					{/* Search */}
					<div className='hidden md:flex items-center px-3 py-2 rounded-lg bg-[#f5f5f5] dark:bg-zinc-900 gap-2'>
						<Search className='w-4 h-4 text-[#666666] dark:text-zinc-400' />
						<input
							type='text'
							placeholder='Search...'
							className='bg-transparent border-none outline-none text-sm text-[#1a1a1a] dark:text-zinc-100 placeholder-[#999999] w-32'
						/>
					</div>
					{/* Messages */}
					<div className='relative' ref={messagesRef}>
						<button
							onClick={() => setShowMessages(!showMessages)}
							className='p-2 hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 rounded-lg transition-colors relative'>
							<MessageSquare className='w-5 h-5 text-[#1a1a1a] dark:text-zinc-100' />
							<span className='absolute top-1 right-1 w-2 h-2 bg-[#2e3820] dark:bg-zinc-300 rounded-full'></span>
						</button>
						{showMessages && (
							<div className='absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-950 rounded-lg border border-[#e0e0e0] dark:border-zinc-800 shadow-lg'>
								<div className='p-3 border-b border-[#e0e0e0] dark:border-zinc-800'>
									<h3 className='font-semibold text-[#1a1a1a] dark:text-zinc-100'>
										Messages
									</h3>
								</div>
								<div className='max-h-80 overflow-y-auto'>
									<div className='p-3 border-b border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#f5f5f5] dark:bg-zinc-900 cursor-pointer'>
										<p className='text-sm font-medium text-[#1a1a1a] dark:text-zinc-100'>
											Sarah Doe
										</p>
										<p className='text-xs text-[#666666] dark:text-zinc-400'>
											Hey, are you available?
										</p>
									</div>
									<div className='p-3 border-b border-[#e5e5e5] dark:border-zinc-800 hover:bg-[#f5f5f5] dark:bg-zinc-900 cursor-pointer'>
										<p className='text-sm font-medium text-[#1a1a1a] dark:text-zinc-100'>
											John Smith
										</p>
										<p className='text-xs text-[#666666] dark:text-zinc-400'>
											Thanks for the update
										</p>
									</div>
								</div>
								<div className='p-3 border-t border-[#e0e0e0] dark:border-zinc-800 text-center'>
									<a
										href='#'
										className='text-xs text-[#2e3820] dark:text-zinc-200 hover:underline'>
										View all messages
									</a>
								</div>
							</div>
						)}
					</div>

					{/* Notifications */}
					<div className='relative' ref={notificationsRef}>
						<button
							onClick={() => setShowNotifications(!showNotifications)}
							className='p-2 hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 rounded-lg transition-colors relative'>
							<Bell className='w-5 h-5 text-[#1a1a1a] dark:text-zinc-100' />
							<span className='absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full'></span>
						</button>
						{showNotifications && (
							<div className='absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 rounded-lg border border-[#e0e0e0] dark:border-zinc-800 shadow-lg'>
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

					{/* User Menu */}
					<div className='relative' ref={userMenuRef}>
						<button
							onClick={() => setShowUserMenu(!showUserMenu)}
							className='p-2 hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 rounded-lg transition-colors'>
							<div className='w-8 h-8 rounded-full bg-[#2e3820] dark:bg-zinc-800 flex items-center justify-center text-white'>
								<span className='text-xs font-semibold'>
									<img
										src={user?.avatar || "https://placehold.net/avatar.png"}
										alt={user?.full_name || "N/A"}
										className='w-8 h-8 rounded-full'
									/>
								</span>
							</div>
						</button>
						{showUserMenu && (
							<div className='absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-950 rounded-lg border border-[#e0e0e0] dark:border-zinc-800 shadow-lg'>
								<div className='px-5 py-3 border-b border-[#e0e0e0] dark:border-zinc-800'>
									<p className='font-semibold text-[#1a1a1a] dark:text-zinc-100'>
										{user?.full_name || "N/A"}
									</p>
									<p className='text-xs text-[#666666] dark:text-zinc-400'>
										{user?.email || "N/A"}
									</p>
								</div>
								<div className='p-1'>
									<button className='w-full px-4 py-2 text-left text-sm text-[#1a1a1a] dark:text-zinc-100 hover:bg-muted/90 flex items-center gap-2 transition-colors rounded-lg'>
										<User className='w-4 h-4' />
										Tài khoản
									</button>
									<button className='w-full px-4 py-2 text-left text-sm text-[#1a1a1a] dark:text-zinc-100 hover:bg-muted/90 flex items-center gap-2 transition-colors rounded-lg'>
										<Settings className='w-4 h-4' />
										Cài đặt
									</button>
								</div>
								<div className='border-t border-[#e0e0e0] dark:border-zinc-800 p-1'>
									<button
										onClick={handleLogout}
										className='w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors rounded-lg'>
										<LogOut className='w-4 h-4' />
										Đăng xuất
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}

export default Header;
