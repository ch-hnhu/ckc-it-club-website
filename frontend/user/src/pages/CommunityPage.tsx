import React, { useEffect, useState } from "react";
import {
	Bookmark,
	Code2,
	Crown,
	Flame,
	Hash,
	Heart,
	Home,
	List,
	MessageCircle,
	Monitor,
	PenSquare,
	Search,
	Share2,
	Sparkles,
	Trophy,
	X,
	Zap,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";

type MainLayoutOutletContext = {
	user: AuthUser | null;
};

const PRIMARY_NAV = [
	{ id: "home", label: "Trang chủ", icon: Home },
	{ id: "leaderboard", label: "Bảng xếp hạng", icon: Trophy },
	{ id: "showcase", label: "Showcase dự án", icon: Monitor },
	{ id: "challenge", label: "Thử thách tháng", icon: Crown },
	{ id: "code", label: "#30DaysOfCode", icon: Code2 },
];

const CHANNELS = [
	{ id: "general", label: "Chung", count: 128 },
	{ id: "discussion", label: "Thảo luận", count: 42 },
	{ id: "qa", label: "Hỏi đáp", count: 35 },
	{ id: "project", label: "Dự án", count: 18 },
	{ id: "resources", label: "Tài nguyên", count: 23 },
	{ id: "events", label: "Sự kiện", count: 10 },
	{ id: "career", label: "Cơ hội nghề nghiệp", count: 12 },
	{ id: "bugs", label: "Báo lỗi", count: 7 },
];

const SORT_OPTIONS = [
	{ id: "top", label: "Top bài viết", icon: Flame },
	{ id: "newest", label: "Mới nhất", icon: Sparkles },
];

const CHANNEL_SORT_OPTIONS = [
	{ id: "top", label: "Top Posts" },
	{ id: "newest", label: "Newest" },
];

const NEWS_ITEMS = [
	{
		title: "Workshop Git & GitHub cho sinh viên mới",
		meta: "25/05 | Sự kiện",
		image: "https://api.dicebear.com/9.x/thumbs/svg?seed=workshop",
	},
	{
		title: "CKC Hackathon 2026 mở cổng đăng ký",
		meta: "22/05 | Tin tức",
		image: "https://api.dicebear.com/9.x/thumbs/svg?seed=hackathon",
	},
	{
		title: "Tổng hợp tài liệu React và Laravel",
		meta: "18/05 | Tài nguyên",
		image: "https://api.dicebear.com/9.x/identicon/svg?seed=resources",
	},
];

const TOP_CONTRIBUTORS = [
	{
		id: 1,
		name: "Minh Trí",
		avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=mt",
		points: 1420,
	},
	{
		id: 2,
		name: "Hồng Nhung",
		avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=hn",
		points: 1175,
	},
	{
		id: 3,
		name: "Quốc Bảo",
		avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=qb",
		points: 940,
	},
];

const MOCK_POSTS = [
	{
		id: 1,
		channel: "project",
		channelLabel: "Dự án",
		author: {
			name: "Trần Minh Khôi",
			handle: "@khoidev",
			avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=khoi",
			role: "Ban kỹ thuật",
		},
		title: "Ra mắt chatbot AI hỗ trợ sinh viên CKC",
		excerpt:
			"Nhóm mình vừa hoàn thành bản beta chatbot AI tích hợp vào website câu lạc bộ. Bot hỗ trợ hỏi đáp lịch học, tài liệu nhập môn và gợi ý lộ trình học theo từng ngành.",
		image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
		tags: ["AI", "python", "chatbot"],
		reactions: 48,
		comments: 23,
		createdAt: "5 giờ",
		pinned: true,
	},
	{
		id: 2,
		channel: "qa",
		channelLabel: "Hỏi đáp",
		author: {
			name: "Nguyễn Hoài Nam",
			handle: "@namnguyen",
			avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=nam",
			role: "Thành viên",
		},
		title: "Deploy Laravel lên VPS Ubuntu bị lỗi 502",
		excerpt:
			"Mình đã cài nginx và PHP 8.2 nhưng project vẫn trả về 502 Bad Gateway. Mọi người có checklist nào để kiểm tra service, socket PHP-FPM và permission không?",
		tags: ["laravel", "devops", "nginx"],
		reactions: 12,
		comments: 8,
		createdAt: "20 giờ",
		pinned: false,
	},
	{
		id: 3,
		channel: "resources",
		channelLabel: "Tài nguyên",
		author: {
			name: "Lê Thị Phương",
			handle: "@phuonglearns",
			avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=phuong",
			role: "Ban nội dung",
		},
		title: "Roadmap học lập trình từ cơ bản đến nâng cao",
		excerpt:
			"Mình tổng hợp lại các nguồn học miễn phí cho Frontend, Backend, Mobile, Data Science và DevOps. Mỗi phần có bài tập nhỏ để tự kiểm tra sau khi học.",
		image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
		tags: ["roadmap", "beginners", "resources"],
		reactions: 95,
		comments: 31,
		createdAt: "1 ngày",
		pinned: false,
	},
];

interface PostCardProps {
	post: (typeof MOCK_POSTS)[0];
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);
	const [heartCount, setHeartCount] = useState(post.reactions);

	const handleLike = () => {
		setLiked((current) => {
			setHeartCount((count) => (current ? count - 1 : count + 1));
			return !current;
		});
	};

	return (
		<article className='border-2 border-black rounded-2xl bg-white p-4'>
			<div className='mb-3 flex items-center gap-3'>
				<div className='relative'>
					<img
						src={post.author.avatar}
						alt={post.author.name}
						className='h-10 w-10 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
					/>
					{post.pinned && (
						<span className='absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)] text-black'>
							<Zap className='h-3 w-3 fill-current' />
						</span>
					)}
				</div>
				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
						<p className='font-heading text-sm font-extrabold text-black'>
							{post.author.name}
						</p>
						<span className='text-sm font-medium text-gray-500'>
							{post.author.handle}
						</span>
						<span className='text-sm text-gray-400'>· {post.createdAt}</span>
					</div>
					<p className='text-xs font-bold text-lime-700'># {post.channelLabel}</p>
				</div>
			</div>

			<h2 className='mb-3 font-heading text-lg font-extrabold leading-tight text-black md:text-xl'>
				{post.title}
			</h2>
			<p className='max-w-3xl text-sm leading-6 text-gray-700'>{post.excerpt}</p>

			{post.image && (
				<div className='mt-4 overflow-hidden rounded-[10px] border-2 border-black bg-[var(--color-pastel-yellow)]'>
					<img
						src={post.image}
						alt={post.title}
						className='aspect-[16/9] w-full object-cover'
					/>
				</div>
			)}

			<div className='mt-4 flex flex-wrap gap-2'>
				{post.tags.map((tag) => (
					<button
						key={tag}
						className='rounded-lg border-2 border-black bg-[var(--color-pastel-blue)] px-2.5 py-1 text-xs font-bold text-black transition hover:bg-[var(--color-primary)]'>
						#{tag}
					</button>
				))}
			</div>

			<div className='mt-4 flex flex-wrap items-center gap-2 border-t-2 border-black pt-3 text-black'>
				<button
					onClick={handleLike}
					className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
					style={{ background: liked ? "var(--color-pastel-pink)" : "#fff" }}>
					<Heart className={`h-4 w-4 ${liked ? "fill-current text-red-500" : ""}`} />
					{heartCount}
				</button>
				<button className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					<MessageCircle className='h-4 w-4' />
					{post.comments}
				</button>
				<button
					onClick={() => setSaved((current) => !current)}
					className='inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
					style={{ background: saved ? "var(--color-primary)" : "#fff" }}
					aria-label='Lưu bài viết'>
					<Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
				</button>
				<button
					className='inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
					aria-label='Chia sẻ bài viết'>
					<Share2 className='h-4 w-4' />
				</button>
			</div>
		</article>
	);
};

const CommunityPage: React.FC = () => {
	const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();
	const user = outletContext?.user ?? null;
	const [activeChannel, setActiveChannel] = useState("all");
	const [activeSort, setActiveSort] = useState("top");
	const [pageMode, setPageMode] = useState<"home" | "channel">("home");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const activePrimaryNav = pageMode === "home" ? "home" : "";
	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(
			userDisplayName,
		)}&background=A3E635&color=111111&bold=true`;

	const currentChannel = CHANNELS.find((channel) => channel.id === activeChannel);

	useEffect(() => {
		if (!isSidebarOpen) return;

		const originalBodyOverflow = document.body.style.overflow;
		const originalHtmlOverflow = document.documentElement.style.overflow;
		document.body.style.overflow = "hidden";
		document.documentElement.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = originalBodyOverflow;
			document.documentElement.style.overflow = originalHtmlOverflow;
		};
	}, [isSidebarOpen]);

	const filteredPosts = MOCK_POSTS.filter((post) => {
		return pageMode === "home" || activeChannel === "all" || post.channel === activeChannel;
	});

	const handlePrimaryNavClick = () => {
		setPageMode("home");
		setActiveChannel("all");
		setActiveSort("top");
		setIsSidebarOpen(false);
	};

	const handleChannelClick = (channelId: string) => {
		setPageMode("channel");
		setActiveChannel(channelId);
		setActiveSort("top");
		setIsSidebarOpen(false);
	};

	const renderSidebarContent = (isMobile = false) => (
		<div className={isMobile ? "px-4 py-4" : "px-3 py-4"}>
			<nav className={isMobile ? "space-y-2" : "space-y-2"}>
				{PRIMARY_NAV.map((item) => {
					const Icon = item.icon;
					const isActive = activePrimaryNav === item.id;
					return (
						<button
							key={item.id}
							onClick={handlePrimaryNavClick}
							className={`group relative flex w-full items-center text-left font-bold ${
								isMobile
									? "gap-3 rounded-xl px-3 py-3 text-base"
									: "gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px]"
								} ${
									isActive
										? "bg-primary-100 border-2 border-[var(--color-primary-dark)] text-[var(--color-text-primary)]"
										: "border-2 border-transparent bg-white text-gray-700 hover:bg-gray-100"
								}`}>
							<Icon
								className={`transition-colors duration-200 ${
									isMobile ? "h-5 w-5" : "h-4 w-4"
								} ${isActive ? "text-[var(--color-text-primary)]" : "text-gray-700"}`}
							/>
							{item.label}
						</button>
					);
				})}
			</nav>

			<div
				className={`font-bold uppercase tracking-[0.2em] text-gray-500 ${
					isMobile ? "mt-6 px-1 text-xs" : "mt-7 px-3 text-[11px]"
				}`}>
				Kênh
			</div>
			<nav className={isMobile ? "mt-3 space-y-2" : "mt-3 space-y-2"}>
				{CHANNELS.map((channel) => {
					const isActive = pageMode === "channel" && activeChannel === channel.id;
					return (
						<button
							key={channel.id}
							onClick={() => handleChannelClick(channel.id)}
							className={`group relative flex w-full items-center justify-between text-left font-bold ${
								isMobile
									? "rounded-xl px-3 py-2.5 text-base"
									: "rounded-lg px-2.5 py-2 text-[13px]"
								} ${
									isActive
										? "bg-primary-100 border-2 border-[var(--color-primary-dark)] text-[var(--color-text-primary)]"
										: "border-2 border-transparent bg-white text-black hover:bg-gray-100"
								}`}>
							<span
								className={
									isMobile ? "flex items-center gap-3" : "flex items-center gap-3"
								}>
								<Hash
									className={`transition-colors duration-200 ${
										isMobile ? "h-5 w-5" : "h-3.5 w-3.5"
									} ${
										isActive
											? "text-[var(--color-text-primary)]"
											: "text-gray-500"
									}`}
								/>
								{channel.label}
							</span>
							<span
								className={`transition-colors duration-200 ${
									isMobile ? "text-sm" : "text-xs"
								} ${
									isActive ? "text-[var(--color-text-primary)]" : "text-gray-500"
								}`}>
								{channel.count}
							</span>
						</button>
					);
				})}
			</nav>
		</div>
	);

	return (
		<div className='min-h-screen bg-[var(--color-surface)] pt-16 text-black'>
			<div className='community-shell'>
				<aside className='hidden border-r-2 border-black bg-white md:block'>
					<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto'>
						{renderSidebarContent()}
					</div>
				</aside>

				<div className='community-content'>
					<main className='community-feed min-w-0 px-4 pb-5 md:px-4 md:pt-5'>
						{/* Mobile community header — inside feed for pixel-perfect alignment */}
						<div className='sticky top-16 z-30 -mx-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 md:hidden mb-3'>
							<button
								onClick={() => setIsSidebarOpen(true)}
								className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
								aria-label='Mở menu cộng đồng'>
								<List className='h-5 w-5' />
							</button>
							<img
								src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/it_club_ckc.jpg'
								alt='CKC IT CLUB'
								className='h-6 w-6 shrink-0 rounded-full border-2 border-black object-cover'
							/>
							<h1 className='min-w-0 truncate font-heading text-sm font-bold text-black'>
								Cộng đồng CKC IT CLUB
							</h1>
						</div>
						{/* Community header – home mode */}
						{pageMode === "home" && (
							<div className='my-4 hidden items-center gap-4 pb-5 lg:flex'>
								<img
									src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/it_club_ckc.jpg'
									alt='CKC IT CLUB'
									className='h-18 w-18 shrink-0 rounded-full border-2 border-black object-cover'
								/>
								<div>
									<h1 className='font-heading text-xl font-extrabold leading-tight text-black md:text-2xl lg:text-3xl'>
										Cộng đồng CKC IT CLUB
									</h1>
									<p className='mt-2 text-sm font-medium text-gray-500'>
										Nơi chia sẻ kiến thức và phát triển cùng nhau 🌱✦
									</p>
								</div>
							</div>
						)}

						{/* Channel header */}
						{pageMode === "channel" && (
							<section className='neo-card neo-card-static mb-5 bg-[var(--color-pastel-green)] p-4'>
								<div className='flex items-center gap-3'>
									<div className='flex h-11 w-11 items-center justify-center rounded-[10px] border-2 border-black bg-white shadow-[3px_3px_0_#111]'>
										<Hash className='h-5 w-5 text-black' />
									</div>
									<div>
										<h1 className='font-heading text-xl font-extrabold text-black'>
											#{currentChannel?.label ?? "Kênh"}
										</h1>
										<p className='text-sm font-semibold text-gray-700'>
											Bài viết và thảo luận trong kênh này.
										</p>
									</div>
								</div>
							</section>
						)}

						{user && (
							<div className='mb-6 flex items-center gap-3 rounded-xl border-2 border-black bg-white px-5 py-4'>
								<Link to='/profile' className='relative'>
									<img
										src={userAvatar}
										alt={userDisplayName}
										className='h-11 w-11 shrink-0 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
									/>
								</Link>
								<Link
									to='/community/create'
									className='flex h-11 min-w-0 flex-1 items-center rounded-[10px] border-2 border-black bg-gray-50 px-4 text-left font-body text-sm font-medium text-gray-500 transition cursor-pointer'>
									Chia sẻ điều gì đó...
								</Link>
								<Link
									to='/community/create'
									className='inline-flex h-11 shrink-0 select-none items-center justify-center gap-2 rounded-[10px] border-2 border-black bg-[var(--color-primary)] px-4 py-0 font-heading text-sm font-extrabold text-dark shadow-[3px_3px_0_#000000] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
									<PenSquare strokeWidth={3} className='h-4 w-4 text-dark' />
									Đăng bài
								</Link>
							</div>
						)}

						{pageMode === "home" ? (
							<div className='mb-5 border-b border-gray-200'>
								<div className='flex'>
									{SORT_OPTIONS.map((option) => {
										const Icon = option.icon;
										const isActive = activeSort === option.id;
										return (
											<button
												key={option.id}
												onClick={() => setActiveSort(option.id)}
												className='relative flex shrink-0 items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-extrabold text-black transition hover:text-black md:text-base'
												style={{
													fontFamily: "var(--font-heading)",
													color: isActive ? "#111" : "#6b7280",
												}}>
												<Icon className='h-4 w-4' />
												{option.label}
												{isActive && (
													<span className='absolute right-0 -bottom-[3px] left-0 h-[3px] rounded-t-sm bg-[var(--color-primary)]' />
												)}
											</button>
										);
									})}
								</div>
							</div>
						) : (
							<div className='mb-5 rounded-[10px] border-2 border-black bg-white px-4 pt-3 shadow-[3px_3px_0_#111] md:px-5'>
								<div className='flex border-b-[3px] border-gray-300'>
									{CHANNEL_SORT_OPTIONS.map((option) => {
										const isActive = activeSort === option.id;
										return (
											<button
												key={option.id}
												onClick={() => setActiveSort(option.id)}
												className='relative shrink-0 px-4 pb-3 font-heading text-sm font-extrabold transition hover:text-black md:px-5 md:text-lg'
												style={{ color: isActive ? "#111" : "#6b7280" }}>
												{option.label}
												{isActive && (
													<span className='absolute right-0 -bottom-[3px] left-0 h-[3px] bg-[var(--color-primary)]' />
												)}
											</button>
										);
									})}
								</div>
							</div>
						)}

						<div className='space-y-5'>
							{filteredPosts.length > 0 ? (
								filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
							) : (
								<div className='neo-card neo-card-static bg-white px-6 py-16 text-center'>
									<Search className='mx-auto h-10 w-10 text-gray-500' />
									<p className='mt-4 font-heading text-xl font-extrabold text-black'>
										Không tìm thấy bài viết
									</p>
									<p className='mt-2 text-sm text-gray-600'>
										Thử từ khóa khác hoặc đổi kênh ở thanh bên.
									</p>
								</div>
							)}
						</div>
					</main>

					<aside className='community-right-rail'>
						<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5'>
							<section className='neo-card neo-card-static bg-white p-4'>
								<div className='mb-4 flex items-center justify-between'>
									<h2 className='font-heading text-base font-extrabold text-black'>
										Tin mới
									</h2>
									<button className='text-xs font-bold text-lime-700 hover:text-black cursor-pointer'>
										Xem tất cả
									</button>
								</div>
								<div className='space-y-4'>
									{NEWS_ITEMS.map((item) => (
										<button
											key={item.title}
											className='flex w-full gap-3 rounded-lg p-2 text-left transition hover:bg-[var(--color-primary-100)]'>
											<img
												src={item.image}
												alt=''
												className='h-11 w-11 rounded-lg border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
											/>
											<span className='min-w-0'>
												<span className='block text-[13px] font-extrabold leading-snug text-black'>
													{item.title}
												</span>
												<span className='mt-1 block text-xs text-gray-600'>
													{item.meta}
												</span>
											</span>
										</button>
									))}
								</div>
							</section>

							<section className='neo-card neo-card-static mt-5 bg-white p-4'>
								<div className='mb-4 flex items-center justify-between'>
									<h2 className='font-heading text-base font-extrabold text-black'>
										Hoạt động sôi nổi
									</h2>
									<button className='text-xs font-bold text-lime-700 hover:text-black cursor-pointer cursor-pointer'>
										Xem tất cả
									</button>
								</div>
								<div className='space-y-3'>
									{TOP_CONTRIBUTORS.map((member, index) => (
										<Link
											key={member.id}
											to={`/profile/${member.id}`}
											className='flex items-center gap-3'>
											<div
												key={member.id}
												className='flex items-center gap-3'>
												<span className='w-5 text-sm font-extrabold text-gray-600'>
													#{index + 1}
												</span>
												<img
													src={member.avatar}
													alt={member.name}
													className='h-9 w-9 rounded-full border-2 border-black bg-white'
												/>
												<div className='min-w-0'>
													<p className='truncate text-sm font-bold text-black'>
														{member.name}
													</p>
													<p className='text-xs text-gray-700'>
														{member.points} điểm
													</p>
												</div>
											</div>
										</Link>
									))}
								</div>
							</section>

							<p className='mt-5 text-sm text-gray-500'>
								© 2026 CKC IT CLUB · Điều khoản · Bảo mật
							</p>
						</div>
					</aside>
				</div>
			</div>

			{isSidebarOpen && (
				<div className='fixed inset-x-0 bottom-0 top-16 z-50 md:hidden'>
					<button
						className='absolute inset-0 h-full w-full bg-black/55'
						onClick={() => setIsSidebarOpen(false)}
						aria-label='Đóng menu cộng đồng'
					/>
					<aside className='no-scrollbar relative h-full w-[min(70vw,20rem)] overflow-y-auto border-r-2 border-black bg-white shadow-[6px_0_0_#111]'>
						<div className='sticky top-0 z-10 flex h-14 items-center justify-between border-b-2 border-black bg-white px-4'>
							<h2 className='font-heading text-lg font-extrabold text-black'>
								Cộng đồng
							</h2>
							<button
								onClick={() => setIsSidebarOpen(false)}
								className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-black transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-100'
								aria-label='Đóng menu cộng đồng'>
								<X className='h-4 w-4' />
							</button>
						</div>
						{renderSidebarContent(true)}
					</aside>
				</div>
			)}
		</div>
	);
};

export default CommunityPage;
