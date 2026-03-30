import React, { useEffect, useState } from "react";
import { Menu, X, Code2, LogIn, UserPlus } from "lucide-react";
import {
	getGoogleAuthUrl,
	logout,
	setAccessToken,
	clearAccessToken,
	listenOAuthAuthMessage,
	type AuthUser,
} from "../../services/auth.service";

type NavbarProps = {
	user: AuthUser | null;
	onAuthSuccess: () => Promise<void>;
};

const NAV_ITEMS = [
	{ label: "Blog", href: "#blog" },
	{ label: "Tài nguyên", href: "#resources" },
	{ label: "Leaderboard", href: "#leaderboard" },
	{ label: "Event", href: "#events" },
	{ label: "Course", href: "#courses" },
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
			const width = 520,
				height = 640;
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
		<header
			className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-sm border-b-2 border-black shadow-[0_2px_0_0_#111]`}>
			<div className='neo-container'>
				<div className='flex items-center gap-4 lg:gap-8 h-16 px-6'>
					{/* Logo */}
					<a href='/' className='flex items-center gap-2.5 group no-underline'>
						<div
							className='w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105'
							style={{
								background: "var(--color-primary)",
								border: "2px solid #111",
								boxShadow: "2px 2px 0px #111",
							}}>
							<Code2 className='w-5 h-5 text-black' />
						</div>
						<span
							className='text-xl font-extrabold tracking-tight text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							CKC IT CLUB
						</span>
					</a>

					{/* Desktop Nav */}
					<nav className='hidden lg:flex items-center gap-1'>
						{NAV_ITEMS.map((item) => (
							<a
								key={item.label}
								href={item.href}
								className='relative px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:text-black hover:bg-gray-100 transition-all duration-200 group'
								style={{ fontFamily: "var(--font-body)" }}>
								{item.label}
								<span
									className='absolute bottom-0.5 left-4 right-4 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200'
									style={{ background: "var(--color-primary)" }}
								/>
							</a>
						))}
					</nav>

					{/* Desktop CTA */}
					<div className='hidden lg:flex items-center gap-3 ml-auto'>
						{user ? (
							<div className='flex items-center gap-3'>
								<div className='flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-black text-sm font-medium'>
									{user.picture && (
										<img
											src={user.picture}
											alt={user.name || "user"}
											className='w-6 h-6 rounded-full'
										/>
									)}
									<span className='max-w-[120px] truncate'>
										{user.name || user.email}
									</span>
								</div>
								<button
									onClick={handleLogout}
									disabled={loading}
									className='neo-btn neo-btn-secondary text-sm px-4 py-2 disabled:opacity-50'>
									Đăng xuất
								</button>
							</div>
						) : (
							<>
								<button
									onClick={handleLogin}
									disabled={loading}
									className='neo-btn neo-btn-secondary text-sm px-4 py-2 disabled:opacity-50'>
									<LogIn className='w-4 h-4' />
									Đăng nhập
								</button>
								<button
									onClick={handleLogin}
									disabled={loading}
									className='neo-btn neo-btn-primary text-sm px-4 py-2 disabled:opacity-50'>
									<UserPlus className='w-4 h-4' />
									{loading ? "Đang xử lý..." : "Tham gia ngay"}
								</button>
							</>
						)}
					</div>

					{/* Mobile menu toggle */}
					<button
						className='lg:hidden p-2 rounded-lg border-2 border-black ml-auto'
						onClick={() => setIsMobileOpen(!isMobileOpen)}
						aria-label='Toggle menu'>
						{isMobileOpen ? <X className='w-5 h-5' /> : <Menu className='w-5 h-5' />}
					</button>
				</div>

				{/* Mobile Menu */}
				{isMobileOpen && (
					<div className='lg:hidden border-t-2 border-black bg-white px-6 pb-6'>
						<nav className='flex flex-col gap-1 pt-4'>
							{NAV_ITEMS.map((item) => (
								<a
									key={item.label}
									href={item.href}
									onClick={() => setIsMobileOpen(false)}
									className='px-4 py-3 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors'>
									{item.label}
								</a>
							))}
						</nav>
						<div className='flex flex-col gap-3 pt-4 border-t border-gray-100 mt-4'>
							<button
								onClick={handleLogin}
								className='neo-btn neo-btn-secondary w-full justify-center'>
								<LogIn className='w-4 h-4' /> Đăng nhập
							</button>
							<button
								onClick={handleLogin}
								className='neo-btn neo-btn-primary w-full justify-center'>
								<UserPlus className='w-4 h-4' /> Tham gia ngay
							</button>
						</div>
					</div>
				)}
			</div>
		</header>
	);
};

export default Navbar;
