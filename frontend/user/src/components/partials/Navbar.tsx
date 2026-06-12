import React, { useEffect, useRef, useState } from "react";
import {
	BookOpen,
	Bookmark,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Code2,
	Crown,
	Home,
	LogIn,
	LogOut,
	Menu,
	Monitor,
	SlidersHorizontal,
	Trophy,
	UserPlus,
	UserRound,
	X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
	logout,
	type AuthUser,
} from "../../services/auth.service";
import { buildProfileUrl } from "@/lib/utils";
import NotificationBell from "@/components/partials/NotificationBell";

type NavbarProps = {
	user: AuthUser | null;
	onAuthSuccess: () => Promise<void>;
	avatarTs?: number;
};

type NavItem = {
	label: string;
	href: string;
	dropdown?: boolean;
	highlight?: boolean;
};

const BASE_NAV_ITEMS: NavItem[] = [
	{ label: "Cộng đồng", href: "/cong-dong", dropdown: true },
	{ label: "Tài nguyên", href: "#resources" },
	{ label: "Sự kiện", href: "/su-kien" },
	{ label: "Khóa học", href: "#courses" },
	{ label: "Liên hệ", href: "/lien-he" },
];

const APPLY_NAV_ITEM: NavItem = { label: "Ứng tuyển", href: "/ung-tuyen", highlight: true };

const COMMUNITY_DROPDOWN = [
	{ id: "home", label: "Trang chủ", to: "/cong-dong", icon: Home },
	{ id: "leaderboard", label: "Bảng xếp hạng", to: "/cong-dong/bang-xep-hang", icon: Trophy },
	{ id: "showcase", label: "Showcase dự án", to: "/cong-dong", icon: Monitor },
	{ id: "challenge", label: "Thử thách tháng", to: "/cong-dong", icon: Crown },
	{ id: "code", label: "#30DaysOfCode", to: "/cong-dong", icon: Code2 },
	{ id: "blog", label: "Blog", to: "/blog", icon: BookOpen },
];

const Navbar: React.FC<NavbarProps> = ({ user, onAuthSuccess, avatarTs }) => {
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [mobileMenuView, setMobileMenuView] = useState<"nav" | "account" | "community">("nav");
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isCommunityOpen, setIsCommunityOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const profileMenuRef = useRef<HTMLDivElement>(null);
	const communityDropdownRef = useRef<HTMLDivElement>(null);
	const location = useLocation();

	const isClubMember = user?.roles?.includes("club-member") ?? false;
	const shouldShowApplyButton = Boolean(user && !isClubMember && user.is_school_student);
	const desktopNavItems = BASE_NAV_ITEMS;
	const mobileNavItems = shouldShowApplyButton
		? [...BASE_NAV_ITEMS, APPLY_NAV_ITEM]
		: BASE_NAV_ITEMS;
	const isCommunityPage =
		location.pathname.startsWith("/cong-dong") || location.pathname.startsWith("/community");
	const navbarContainerClass = isCommunityPage ? "mx-0 max-w-none" : "";
	const navbarPaddingX = isCommunityPage ? "px-4 md:px-5 lg:px-6" : "px-6";
	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
		userDisplayName,
	)}&background=A3E635&color=111111&bold=true`;
	const userAvatar = user?.picture
		? avatarTs
			? `${user.picture}${user.picture.includes("?") ? "&" : "?"}_t=${avatarTs}`
			: user.picture
		: userAvatarFallback;

	useEffect(() => {
		if (!isProfileOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
				setIsProfileOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsProfileOpen(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isProfileOpen]);

	useEffect(() => {
		if (!isCommunityOpen) return;
		const handlePointerDown = (e: PointerEvent) => {
			if (
				communityDropdownRef.current &&
				!communityDropdownRef.current.contains(e.target as Node)
			) {
				setIsCommunityOpen(false);
			}
		};
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsCommunityOpen(false);
		};
		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isCommunityOpen]);

	const handleLogout = async () => {
		try {
			setLoading(true);
			setIsProfileOpen(false);
			await logout();
			await onAuthSuccess();
		} catch (err) {
			console.error("Logout error:", err);
		} finally {
			setLoading(false);
		}
	};

	const isNavItemActive = (href: string) => {
		if (href === "/cong-dong") {
			return (
				location.pathname.startsWith("/cong-dong") ||
				location.pathname.startsWith("/community")
			);
		}

		return href.startsWith("/") ? location.pathname === href : location.hash === href;
	};

	const getNavItemClass = (isActive: boolean, isMobile = false) =>
		`group relative ${
			isMobile
				? "rounded-xl px-4 py-3 text-base font-bold hover:bg-gray-100"
				: "rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-100"
		} transition-all duration-200 ${
			isActive
				? isMobile
					? "border-2 border-[var(--color-primary-dark)] bg-[var(--color-primary-100)] text-[var(--color-text-primary)]" // mobile: highlight background như sidebar
					: "text-[var(--color-text-primary)]" // desktop: chỉ đổi màu chữ + underline indicator
				: "text-gray-700"
		}`;

	// Desktop: underline indicator. Mobile: ẩn (background đã thể hiện active state)
	const getNavIndicatorClass = (isActive: boolean, isMobile = false) =>
		`absolute right-4 bottom-0.5 left-4 h-0.5 rounded-full transition-transform duration-200 ${
			isMobile
				? "hidden"
				: `group-hover:scale-x-100 ${isActive ? "scale-x-100" : "scale-x-0"}`
		}`;

	const closeMobileMenu = () => {
		setIsMobileOpen(false);
		setMobileMenuView("nav");
	};

	const closeProfileMenu = (isMobile = false) => {
		setIsProfileOpen(false);
		if (isMobile) closeMobileMenu();
	};

	/** Shared class strings for profile menu items */
	const profileMenuItemClass =
		"flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-bold text-gray-700 transition-colors hover:bg-gray-100 active:bg-[var(--color-primary-100)]";
	const profileMenuDangerItemClass = `${profileMenuItemClass} hover:bg-[var(--color-pastel-pink)] focus-visible:bg-[var(--color-pastel-pink)] active:bg-[var(--color-pastel-pink)] disabled:cursor-not-allowed disabled:opacity-60`;

	const renderProfileMenu = (isMobile = false) => {
		const handleMenuLogout = () => {
			if (isMobile) closeMobileMenu();
			void handleLogout();
		};

		return (
			<div
				className={`${
					isMobile ? "w-56 max-w-full" : "absolute top-[calc(100%+0.625rem)] right-0 w-56"
				} space-y-1 rounded-[var(--neo-radius)] border-2 border-black bg-white p-2 shadow-[var(--neo-shadow)]`}
				role='menu'
				aria-label='User menu'>
				<Link
					to={user ? buildProfileUrl(user.username, user.email ?? "") : "/"}
					onClick={() => closeProfileMenu(isMobile)}
					className={profileMenuItemClass}
					role='menuitem'>
					<UserRound className='h-5 w-5 shrink-0 text-gray-600' />
					<span>Trang cá nhân</span>
				</Link>
				<Link
					to={
						user
							? buildProfileUrl(user.username, user.email ?? "") + "?tab=bookmarks"
							: "/"
					}
					onClick={() => closeProfileMenu(isMobile)}
					className={profileMenuItemClass}
					role='menuitem'>
					<Bookmark className='h-5 w-5 shrink-0 text-gray-600' />
					<span>Đã lưu</span>
				</Link>
				<Link
					to='/diem-cua-toi'
					onClick={() => closeProfileMenu(isMobile)}
					className={profileMenuItemClass}
					role='menuitem'>
					<Trophy className='h-5 w-5 shrink-0 text-gray-600' />
					<span>Điểm của tôi</span>
				</Link>
				<Link
					to='/tai-khoan?tabIndex=0'
					onClick={() => closeProfileMenu(isMobile)}
					className={profileMenuItemClass}
					role='menuitem'>
					<SlidersHorizontal className='h-5 w-5 shrink-0 text-gray-600' />
					<span>Tài khoản</span>
				</Link>
				<button
					type='button'
					onClick={handleMenuLogout}
					disabled={loading}
					className={profileMenuDangerItemClass}
					role='menuitem'>
					<LogOut className='h-5 w-5 shrink-0 text-gray-600' />
					<span>Đăng xuất</span>
				</button>
			</div>
		);
	};

	return (
		<header className='fixed top-0 left-0 z-50 w-full border-b-2 border-black bg-white shadow-[0_2px_0_0_#111] backdrop-blur-sm transition-all duration-300'>
			<div className={`neo-container ${navbarContainerClass}`}>
				<div className={`flex h-16 items-center justify-between gap-4 ${navbarPaddingX}`}>
					<div className='flex min-w-0 items-center gap-4 lg:gap-8'>
						<Link to='/' className='group flex items-center gap-2.5 no-underline'>
							<div
								className='flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105'
								style={{
									background: "var(--color-primary)",
									border: "2px solid #111",
								}}>
								<img
									src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/it_club_ckc.jpg'
									className='h-full w-full rounded-full object-cover'
								/>
							</div>
							<span
								className='text-xl font-extrabold tracking-tight text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								CKC IT CLUB
							</span>
						</Link>

						<nav className='hidden min-w-0 items-center gap-1 xl:flex'>
							{desktopNavItems.map((item) => {
								const isActive = isNavItemActive(item.href);
								const className = getNavItemClass(isActive);

								if (item.dropdown) {
									return (
										<div
											key={item.label}
											ref={communityDropdownRef}
											className='relative'>
											<button
												type='button'
												onClick={() => setIsCommunityOpen((p) => !p)}
												className={`${className} flex items-center gap-1`}
												style={{ fontFamily: "var(--font-body)" }}
												aria-haspopup='true'
												aria-expanded={isCommunityOpen}>
												{item.label}
												<ChevronDown
													className={`h-3.5 w-3.5 transition-transform duration-200 ${isCommunityOpen ? "rotate-180" : ""}`}
												/>
												<span
													className={getNavIndicatorClass(isActive)}
													style={{ background: "var(--color-primary)" }}
												/>
											</button>

											{isCommunityOpen && (
												<div className='absolute top-[calc(100%+10px)] left-0 z-50 flex w-56 flex-col gap-1.5 overflow-hidden rounded-[var(--neo-radius)] border-2 border-black bg-white p-2 shadow-[4px_4px_0_#111]'>
													{COMMUNITY_DROPDOWN.map((sub) => {
														const subActive =
															(sub.id === "blog" &&
																location.pathname.startsWith(
																	"/blog",
																)) ||
															(sub.id === "home" &&
																location.pathname === "/cong-dong");
														const SubIcon = sub.icon;
														return (
															<Link
																key={sub.id}
																to={sub.to}
																onClick={() =>
																	setIsCommunityOpen(false)
																}
																className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
																	subActive
																		? "border-2 border-[var(--color-primary-dark)] bg-[var(--color-primary-100)] text-[var(--color-text-primary)]"
																		: "border-2 border-transparent text-gray-700 hover:bg-gray-100"
																}`}
																style={{
																	fontFamily: "var(--font-body)",
																}}>
																<SubIcon className='h-4 w-4 shrink-0' />
																{sub.label}
															</Link>
														);
													})}
												</div>
											)}
										</div>
									);
								}

								if (item.highlight) {
									return (
										<Link
											key={item.label}
											to={item.href}
											className='neo-btn neo-btn-primary px-4 py-2 text-sm'
											style={{ fontFamily: "var(--font-body)" }}>
											{item.label}
										</Link>
									);
								}

								return item.href.startsWith("/") ? (
									<Link
										key={item.label}
										to={item.href}
										className={className}
										style={{ fontFamily: "var(--font-body)" }}>
										{item.label}
										<span
											className={getNavIndicatorClass(isActive)}
											style={{ background: "var(--color-primary)" }}
										/>
									</Link>
								) : (
									<a
										key={item.label}
										href={item.href}
										className={className}
										style={{ fontFamily: "var(--font-body)" }}>
										{item.label}
										<span
											className={getNavIndicatorClass(isActive)}
											style={{ background: "var(--color-primary)" }}
										/>
									</a>
								);
							})}
						</nav>
					</div>

					<div className='hidden shrink-0 items-center gap-3 xl:flex'>
						{user ? (
							<>
								<NotificationBell user={user} />
								<div ref={profileMenuRef} className='relative'>
									<button
										type='button'
										onClick={() => setIsProfileOpen((current) => !current)}
										className='flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-700 bg-[var(--color-pastel-blue)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 cursor-pointer'
										aria-label={`Mở menu tài khoản của ${userDisplayName}`}
										aria-haspopup='menu'
										aria-expanded={isProfileOpen}>
										<img
											src={userAvatar}
											alt={userDisplayName}
											className='h-full w-full rounded-full object-cover'
										/>
									</button>
									{isProfileOpen && renderProfileMenu()}
								</div>
								{shouldShowApplyButton && (
									<Link
										to={APPLY_NAV_ITEM.href}
										className='neo-btn neo-btn-primary px-4 py-2 text-sm'
										style={{ fontFamily: "var(--font-body)" }}>
										{APPLY_NAV_ITEM.label}
									</Link>
								)}
							</>
						) : (
							<>
								<Link
									to='/login'
									state={{ from: location.pathname + location.search }}
									className='neo-btn neo-btn-secondary px-4 py-2 text-sm'>
									<LogIn className='h-4 w-4' />
									Đăng nhập
								</Link>
								<Link
									to={APPLY_NAV_ITEM.href}
									className='neo-btn neo-btn-primary px-4 py-2 text-sm'>
									<UserPlus className='h-4 w-4' />
									Tham gia ngay
								</Link>
							</>
						)}
					</div>

					<button
						className='shrink-0 rounded-lg border-2 border-black p-2 xl:hidden'
						onClick={() => (isMobileOpen ? closeMobileMenu() : setIsMobileOpen(true))}
						aria-label='Mở menu điều hướng'>
						{isMobileOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
					</button>
				</div>

				{isMobileOpen && (
					<div
						className={`border-t-2 border-black bg-white ${navbarPaddingX} pb-6 xl:hidden`}>
						{/* ── View: Main navigation ── */}
						{mobileMenuView === "nav" && (
							<>
								<nav className='flex flex-col gap-3 py-5'>
									{mobileNavItems.map((item) => {
										const isActive = isNavItemActive(item.href);
										const className = getNavItemClass(isActive, true);

										if (item.dropdown) {
											return (
												<button
													key={item.label}
													type='button'
													onClick={() => setMobileMenuView("community")}
													className={`${className} flex w-full items-center justify-between`}
													style={{ fontFamily: "var(--font-body)" }}>
													{item.label}
													<ChevronRight className='h-4 w-4 shrink-0 text-gray-500' />
												</button>
											);
										}

										if (item.highlight) {
											return (
												<Link
													key={item.label}
													to={item.href}
													onClick={closeMobileMenu}
													className='neo-btn neo-btn-primary w-full justify-center py-3 text-base'
													style={{ fontFamily: "var(--font-body)" }}>
													{item.label}
												</Link>
											);
										}

										return item.href.startsWith("/") ? (
											<Link
												key={item.label}
												to={item.href}
												onClick={closeMobileMenu}
												className={className}
												style={{ fontFamily: "var(--font-body)" }}>
												{item.label}
												<span
													className={getNavIndicatorClass(isActive, true)}
													style={{ background: "var(--color-primary)" }}
												/>
											</Link>
										) : (
											<a
												key={item.label}
												href={item.href}
												onClick={closeMobileMenu}
												className={className}
												style={{ fontFamily: "var(--font-body)" }}>
												{item.label}
												<span
													className={getNavIndicatorClass(isActive, true)}
													style={{ background: "var(--color-primary)" }}
												/>
											</a>
										);
									})}
								</nav>

								<div className='border-t border-gray-100 pt-4'>
									{user ? (
										/* User row → click để mở account submenu */
										<button
											type='button'
											onClick={() => setMobileMenuView("account")}
											className='flex w-full items-center gap-3 rounded-[var(--neo-radius-sm)] border-2 border-black bg-[var(--color-pastel-blue)] p-3 text-left transition hover:bg-gray-100'>
											<img
												src={userAvatar}
												alt={userDisplayName}
												className='h-11 w-11 rounded-full border-2 border-black bg-white object-cover'
											/>
											<span className='min-w-0 flex-1 truncate text-sm font-extrabold text-black'>
												{userDisplayName}
											</span>
											<ChevronRight className='h-4 w-4 shrink-0 text-gray-500' />
										</button>
									) : (
										<div className='flex flex-col gap-3'>
											<Link
												to='/login'
												state={{
													from: location.pathname + location.search,
												}}
												onClick={closeMobileMenu}
												className='neo-btn neo-btn-secondary w-full justify-center'>
												<LogIn className='h-4 w-4' /> Đăng nhập
											</Link>
											<Link
												to={APPLY_NAV_ITEM.href}
												onClick={closeMobileMenu}
												className='neo-btn neo-btn-primary w-full justify-center'>
												<UserPlus className='h-4 w-4' /> Tham gia ngay
											</Link>
										</div>
									)}
								</div>
							</>
						)}

						{/* ── View: Community submenu ── */}
						{mobileMenuView === "community" && (
							<>
								<button
									type='button'
									onClick={() => setMobileMenuView("nav")}
									className='flex items-center gap-1.5 pt-4 pb-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:opacity-75'>
									<ChevronLeft className='h-4 w-4' />
									Quay lại menu
								</button>
								<div className='mb-3 border-t border-gray-100' />
								<nav className='flex flex-col gap-1.5'>
									{COMMUNITY_DROPDOWN.map((sub) => {
										const subActive =
											(sub.id === "blog" &&
												location.pathname.startsWith("/blog")) ||
											(sub.id === "home" &&
												location.pathname === "/cong-dong");
										const SubIcon = sub.icon;
										return (
											<Link
												key={sub.id}
												to={sub.to}
												onClick={closeMobileMenu}
												className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-bold transition-colors ${
													subActive
														? "border-2 border-[var(--color-primary-dark)] bg-[var(--color-primary-100)] text-[var(--color-text-primary)]"
														: "border-2 border-transparent text-gray-700 hover:bg-gray-100"
												}`}
												style={{ fontFamily: "var(--font-body)" }}>
												<SubIcon className='h-5 w-5 shrink-0' />
												{sub.label}
											</Link>
										);
									})}
								</nav>
							</>
						)}

						{/* ── View: Account submenu ── */}
						{mobileMenuView === "account" && (
							<>
								{/* Nút quay lại */}
								<button
									type='button'
									onClick={() => setMobileMenuView("nav")}
									className='flex items-center gap-1.5 pt-4 pb-3 text-sm font-bold text-[var(--color-text-primary)] transition hover:opacity-75'>
									<ChevronLeft className='h-4 w-4' />
									Quay lại menu
								</button>
								<div className='mb-3 border-t border-gray-100' />

								{/* User info card */}
								<div className='mb-3 flex items-center gap-3 rounded-[var(--neo-radius-sm)] border-2 border-black bg-[var(--color-pastel-blue)] p-3'>
									<img
										src={userAvatar}
										alt={userDisplayName}
										className='h-11 w-11 rounded-full border-2 border-black bg-white object-cover'
									/>
									<span className='min-w-0 flex-1 truncate text-sm font-extrabold text-black'>
										{userDisplayName}
									</span>
								</div>

								{/* Account options */}
								<nav className='flex flex-col gap-0.5'>
									<Link
										to={
											user
												? buildProfileUrl(user.username, user.email ?? "")
												: "/"
										}
										onClick={closeMobileMenu}
										className={profileMenuItemClass}>
										<UserRound className='h-5 w-5 shrink-0 text-gray-600' />
										<span>Trang cá nhân</span>
									</Link>
									<Link
										to={
											user
												? buildProfileUrl(user.username, user.email ?? "") +
													"?tab=bookmarks"
												: "/"
										}
										onClick={closeMobileMenu}
										className={profileMenuItemClass}>
										<Bookmark className='h-5 w-5 shrink-0 text-gray-600' />
										<span>Đã lưu</span>
									</Link>
									<Link
										to='/diem-cua-toi'
										onClick={closeMobileMenu}
										className={profileMenuItemClass}
										role='menuitem'>
										<Trophy className='h-5 w-5 shrink-0 text-gray-600' />
										<span>Điểm của tôi</span>
									</Link>
									<Link
										to='/tai-khoan?tabIndex=0'
										onClick={closeMobileMenu}
										className={profileMenuItemClass}
										role='menuitem'>
										<SlidersHorizontal className='h-5 w-5 shrink-0 text-gray-600' />
										<span>Tài khoản</span>
									</Link>
									<button
										type='button'
										onClick={() => {
											closeMobileMenu();
											void handleLogout();
										}}
										disabled={loading}
										className={profileMenuDangerItemClass}>
										<LogOut className='h-5 w-5 shrink-0 text-gray-600' />
										<span>Đăng xuất</span>
									</button>
								</nav>
							</>
						)}
					</div>
				)}
			</div>
		</header>
	);
};

export default Navbar;
