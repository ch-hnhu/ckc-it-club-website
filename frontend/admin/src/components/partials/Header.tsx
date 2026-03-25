import { Menu, Bell, MessageSquare, LogOut, User, Settings, Search } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
	onToggleSidebar?: () => void;
}

function Header({ onToggleSidebar }: HeaderProps) {
	const [showNotifications, setShowNotifications] = useState(false);
	const [showMessages, setShowMessages] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);

	return (
		<header className='sticky top-0 z-40 border-b border-[#e0e0e0] bg-white'>
			<div className='h-16 px-6 flex items-center justify-between'>
				{/* Left Side */}
				<div className='flex items-center gap-4'>
					<button
						onClick={onToggleSidebar}
						className='p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors'
						aria-label='Toggle sidebar'>
						<Menu className='w-5 h-5 text-[#1a1a1a]' />
					</button>
					<h1 className='text-xl font-semibold text-[#1a1a1a] hidden md:block'>
						Dashboard
					</h1>
				</div>

				{/* Right Side */}
				<div className='flex items-center gap-2'>
					{/* Search */}
					<div className='hidden md:flex items-center px-3 py-2 rounded-lg bg-[#f5f5f5] gap-2'>
						<Search className='w-4 h-4 text-[#666666]' />
						<input
							type='text'
							placeholder='Search...'
							className='bg-transparent border-none outline-none text-sm text-[#1a1a1a] placeholder-[#999999] w-32'
						/>
					</div>

					{/* Messages */}
					<div className='relative'>
						<button
							onClick={() => setShowMessages(!showMessages)}
							className='p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors relative'>
							<MessageSquare className='w-5 h-5 text-[#1a1a1a]' />
							<span className='absolute top-1 right-1 w-2 h-2 bg-[#2e3820] rounded-full'></span>
						</button>
						{showMessages && (
							<div className='absolute right-0 mt-2 w-64 bg-white rounded-lg border border-[#e0e0e0] shadow-lg'>
								<div className='p-3 border-b border-[#e0e0e0]'>
									<h3 className='font-semibold text-[#1a1a1a]'>Messages</h3>
								</div>
								<div className='max-h-80 overflow-y-auto'>
									<div className='p-3 border-b border-[#e5e5e5] hover:bg-[#f5f5f5] cursor-pointer'>
										<p className='text-sm font-medium text-[#1a1a1a]'>Sarah Doe</p>
										<p className='text-xs text-[#666666]'>Hey, are you available?</p>
									</div>
									<div className='p-3 border-b border-[#e5e5e5] hover:bg-[#f5f5f5] cursor-pointer'>
										<p className='text-sm font-medium text-[#1a1a1a]'>John Smith</p>
										<p className='text-xs text-[#666666]'>Thanks for the update</p>
									</div>
								</div>
								<div className='p-3 border-t border-[#e0e0e0] text-center'>
									<a href='#' className='text-xs text-[#2e3820] hover:underline'>View all messages</a>
								</div>
							</div>
						)}
					</div>

					{/* Notifications */}
					<div className='relative'>
						<button
							onClick={() => setShowNotifications(!showNotifications)}
							className='p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors relative'>
							<Bell className='w-5 h-5 text-[#1a1a1a]' />
							<span className='absolute top-1 right-1 w-2 h-2 bg-[#dc2626] rounded-full'></span>
						</button>
						{showNotifications && (
							<div className='absolute right-0 mt-2 w-80 bg-white rounded-lg border border-[#e0e0e0] shadow-lg'>
								<div className='p-3 border-b border-[#e0e0e0]'>
									<h3 className='font-semibold text-[#1a1a1a]'>Notifications (5)</h3>
								</div>
								<div className='max-h-80 overflow-y-auto'>
									<div className='p-3 border-b border-[#e5e5e5] hover:bg-[#f5f5f5] cursor-pointer'>
										<p className='text-sm font-medium text-[#1a1a1a]'>System Update</p>
										<p className='text-xs text-[#666666]'>Dashboard updated to v2.1.0</p>
										<p className='text-xs text-[#999999] mt-1'>2 hours ago</p>
									</div>
									<div className='p-3 border-b border-[#e5e5e5] hover:bg-[#f5f5f5] cursor-pointer'>
										<p className='text-sm font-medium text-[#1a1a1a]'>New User Registration</p>
										<p className='text-xs text-[#666666]'>5 new users joined today</p>
										<p className='text-xs text-[#999999] mt-1'>4 hours ago</p>
									</div>
									<div className='p-3 border-b border-[#e5e5e5] hover:bg-[#f5f5f5] cursor-pointer'>
										<p className='text-sm font-medium text-[#1a1a1a]'>New Order</p>
										<p className='text-xs text-[#666666]'>Order #12345 received</p>
										<p className='text-xs text-[#999999] mt-1'>6 hours ago</p>
									</div>
								</div>
								<div className='p-3 border-t border-[#e0e0e0] text-center'>
									<a href='#' className='text-xs text-[#2e3820] hover:underline'>View all notifications</a>
								</div>
							</div>
						)}
					</div>

					{/* User Menu */}
					<div className='relative'>
						<button
							onClick={() => setShowUserMenu(!showUserMenu)}
							className='p-2 hover:bg-[#f5f5f5] rounded-lg transition-colors'>
							<div className='w-8 h-8 rounded-full bg-[#2e3820] flex items-center justify-center text-white'>
								<span className='text-xs font-semibold'>AP</span>
							</div>
						</button>
						{showUserMenu && (
							<div className='absolute right-0 mt-2 w-56 bg-white rounded-lg border border-[#e0e0e0] shadow-lg'>
								<div className='p-4 border-b border-[#e0e0e0]'>
									<p className='font-semibold text-[#1a1a1a]'>Alexander Pierce</p>
									<p className='text-xs text-[#666666]'>admin@example.com</p>
								</div>
								<div className='py-2'>
									<button className='w-full px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors'>
										<User className='w-4 h-4' />
										Profile
									</button>
									<button className='w-full px-4 py-2 text-left text-sm text-[#1a1a1a] hover:bg-[#f5f5f5] flex items-center gap-2 transition-colors'>
										<Settings className='w-4 h-4' />
										Settings
									</button>
								</div>
								<div className='border-t border-[#e0e0e0] py-2'>
									<button className='w-full px-4 py-2 text-left text-sm text-[#dc2626] hover:bg-[#fee2e2] flex items-center gap-2 transition-colors'>
										<LogOut className='w-4 h-4' />
										Sign out
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
