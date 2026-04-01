import React, { useEffect, useState } from "react";
import { Code2, LogIn, Menu, UserPlus, X } from "lucide-react";
import {
	clearAccessToken,
	getGoogleAuthUrl,
	listenOAuthAuthMessage,
	logout,
	setAccessToken,
	type AuthUser,
} from "../../services/auth.service";

type NavbarProps = {
	user: AuthUser | null;
	onAuthSuccess: () => Promise<void>;
};

const NAV_ITEMS = [
	{ label: "Bài viết", href: "#blog" },
	{ label: "Tài nguyên", href: "#resources" },
	{ label: "Bảng xếp hạng", href: "#leaderboard" },
	{ label: "Sự kiện", href: "#events" },
	{ label: "Khóa học", href: "#courses" },
];

const Navbar: React.FC<NavbarProps> = ({ user, onAuthSuccess }) => {
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		return listenOAuthAuthMessage({
			onSuccess: async (payload) => {
				if (payload.token) {
					setAccessToken(payload.token);
				}

				await onAuthSuccess();
			},
			onError: (payload) => {
				console.error("Login error:", payload.message);
			},
		});
	}, [onAuthSuccess]);

	const handleLogin = async () => {
		try {
			setLoading(true);
			clearAccessToken();
			const url = await getGoogleAuthUrl();
			const width = 520;
			const height = 640;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;
			window.open(
				url,
				"google_oauth",
				`width=${width},height=${height},left=${left},top=${top}`,
			);
		} catch (err) {
			console.error("Login error:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		try {
			setLoading(true);
			await logout();
			await onAuthSuccess();
		} catch (err) {
			console.error("Logout error:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<header className='fixed top-0 left-0 z-50 w-full border-b-2 border-black bg-white/95 shadow-[0_2px_0_0_#111] backdrop-blur-sm transition-all duration-300'>
			<div className='neo-container'>
				<div className='flex h-16 items-center gap-4 px-6 lg:gap-8'>
					<a href='/' className='group flex items-center gap-2.5 no-underline'>
						<div
							className='flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105'
							style={{
								background: "var(--color-primary)",
								border: "2px solid #111",
								boxShadow: "2px 2px 0px #111",
							}}>
							<Code2 className='h-5 w-5 text-black' />
						</div>
						<span
							className='text-xl font-extrabold tracking-tight text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							CKC IT CLUB
						</span>
					</a>

					<nav className='hidden items-center gap-1 lg:flex'>
						{NAV_ITEMS.map((item) => (
							<a
								key={item.label}
								href={item.href}
								className='group relative rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-black'
								style={{ fontFamily: "var(--font-body)" }}>
								{item.label}
								<span
									className='absolute right-4 bottom-0.5 left-4 h-0.5 scale-x-0 rounded-full transition-transform duration-200 group-hover:scale-x-100'
									style={{ background: "var(--color-primary)" }}
								/>
							</a>
						))}
					</nav>

					<div className='ml-auto hidden items-center gap-3 lg:flex'>
						{user ? (
							<div className='flex items-center gap-3'>
								<div className='flex items-center gap-2 rounded-lg border-2 border-black px-3 py-1.5 text-sm font-medium'>
									{user.picture && (
										<img
											src={user.picture}
											alt={user.name || "user"}
											className='h-6 w-6 rounded-full'
										/>
									)}
									<span className='max-w-[120px] truncate'>{user.name || user.email}</span>
								</div>
								<button
									onClick={handleLogout}
									disabled={loading}
									className='neo-btn neo-btn-secondary px-4 py-2 text-sm disabled:opacity-50'>
									Đăng xuất
								</button>
							</div>
						) : (
							<>
								<button
									onClick={handleLogin}
									disabled={loading}
									className='neo-btn neo-btn-secondary px-4 py-2 text-sm disabled:opacity-50'>
									<LogIn className='h-4 w-4' />
									Đăng nhập
								</button>
								<button
									onClick={handleLogin}
									disabled={loading}
									className='neo-btn neo-btn-primary px-4 py-2 text-sm disabled:opacity-50'>
									<UserPlus className='h-4 w-4' />
									{loading ? "Đang xử lý..." : "Tham gia ngay"}
								</button>
							</>
						)}
					</div>

					<button
						className='ml-auto rounded-lg border-2 border-black p-2 lg:hidden'
						onClick={() => setIsMobileOpen(!isMobileOpen)}
						aria-label='Mở menu điều hướng'>
						{isMobileOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
					</button>
				</div>

				{isMobileOpen && (
					<div className='border-t-2 border-black bg-white px-6 pb-6 lg:hidden'>
						<nav className='flex flex-col gap-1 pt-4'>
							{NAV_ITEMS.map((item) => (
								<a
									key={item.label}
									href={item.href}
									onClick={() => setIsMobileOpen(false)}
									className='rounded-lg px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100'>
									{item.label}
								</a>
							))}
						</nav>
						<div className='mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4'>
							{user ? (
								<div className='flex flex-col gap-3'>
									<div className='flex items-center justify-center gap-2 rounded-lg border-2 border-black px-3 py-2 text-sm font-medium'>
										{user.picture && (
											<img
												src={user.picture}
												alt={user.name || "user"}
												className='h-6 w-6 rounded-full'
											/>
										)}
										<span className='truncate'>{user.name || user.email}</span>
									</div>
									<button
										onClick={handleLogout}
										disabled={loading}
										className='neo-btn neo-btn-secondary w-full justify-center disabled:opacity-50'>
										Đăng xuất
									</button>
								</div>
							) : (
								<>
									<button
										onClick={handleLogin}
										disabled={loading}
										className='neo-btn neo-btn-secondary w-full justify-center disabled:opacity-50'>
										<LogIn className='h-4 w-4' /> Đăng nhập
									</button>
									<button
										onClick={handleLogin}
										disabled={loading}
										className='neo-btn neo-btn-primary w-full justify-center disabled:opacity-50'>
										<UserPlus className='h-4 w-4' /> {loading ? "Đang xử lý..." : "Tham gia ngay"}
									</button>
								</>
							)}
						</div>
					</div>
				)}
			</div>
		</header>
	);
};

export default Navbar;
