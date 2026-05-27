import React, { useCallback, useEffect, useState } from "react";
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
	RefreshCcw,
	Search,
	Share2,
	Sparkles,
	Trophy,
	X,
	Zap,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { postService } from "@/services/post.service";
import { channelService } from "@/services/channel.service";
import type { Post } from "@/types/post.types";
import type { Channel } from "@/types/channel.types";
import type { PaginatedResponse } from "@/types/api.types";

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format ISO timestamp to relative Vietnamese string */
function formatRelativeTime(isoString: string): string {
	const now = Date.now();
	const then = new Date(isoString).getTime();
	const diffMs = now - then;
	const diffMins = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffMins < 1) return "vừa xong";
	if (diffMins < 60) return `${diffMins} phút`;
	if (diffHours < 24) return `${diffHours} giờ`;
	if (diffDays < 30) return `${diffDays} ngày`;
	return new Date(isoString).toLocaleDateString("vi-VN");
}

/** Derive a @handle from username or email */
function getHandle(post: Post): string {
	const u = post.user;
	if (!u) return "@ckc";
	if (u.username) return `@${u.username}`;
	return `@${u.email.split("@")[0]}`;
}

/** Get or generate avatar URL */
function getAvatar(post: Post): string {
	const u = post.user;
	if (u?.avatar) return u.avatar;
	const name = u?.full_name || u?.email || "CKC";
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=A3E635&color=111111&bold=true`;
}

// ---------------------------------------------------------------------------
// PostCard
// ---------------------------------------------------------------------------

interface PostCardProps {
	post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
	const [liked, setLiked] = useState(false);
	const [saved, setSaved] = useState(false);
	const [heartCount, setHeartCount] = useState(post.reactions_count);

	const handleLike = () => {
		setLiked((current) => {
			setHeartCount((count) => (current ? count - 1 : count + 1));
			return !current;
		});
	};

	const channelLabel = post.channel?.name ?? "Chung";
	const authorName   = post.user?.full_name ?? "Thành viên CKC";
	const handle       = getHandle(post);
	const avatar       = getAvatar(post);
	const createdAt    = post.created_at ? formatRelativeTime(post.created_at) : "";

	return (
		<article className='border-2 border-black rounded-2xl bg-white p-4'>
			<div className='mb-3 flex items-center gap-3'>
				<div className='relative'>
					<img
						src={avatar}
						alt={authorName}
						className='h-10 w-10 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
					/>
					{post.is_pinned && (
						<span className='absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)] text-black'>
							<Zap className='h-3 w-3 fill-current' />
						</span>
					)}
				</div>
				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
						<p className='font-heading text-sm font-extrabold text-black'>{authorName}</p>
						<span className='text-sm font-medium text-gray-500'>{handle}</span>
						<span className='text-sm text-gray-400'>· {createdAt}</span>
					</div>
					<p className='text-xs font-bold text-lime-700'># {channelLabel}</p>
				</div>
			</div>

			<Link to={`/cong-dong/bai-viet/${post.id}`} className='block group'>
				<h2 className='mb-3 font-heading text-lg font-extrabold leading-tight text-black group-hover:underline md:text-xl'>
					{post.title}
				</h2>
				<p className='max-w-3xl text-sm leading-6 text-gray-700'>{post.excerpt}</p>

				{post.featured_image && (
					<div className='mt-4 overflow-hidden rounded-[10px] border-2 border-black bg-[var(--color-pastel-yellow)]'>
						<img
							src={post.featured_image}
							alt={post.title}
							className='aspect-[16/9] w-full object-cover'
						/>
					</div>
				)}
			</Link>

			{post.tags.length > 0 && (
				<div className='mt-4 flex flex-wrap gap-2'>
					{post.tags.map((tag) => (
						<button
							key={tag}
							className='rounded-lg border-2 border-black bg-[var(--color-pastel-blue)] px-2.5 py-1 text-xs font-bold text-black transition hover:bg-[var(--color-primary)]'>
							#{tag}
						</button>
					))}
				</div>
			)}

			<div className='mt-4 flex flex-wrap items-center gap-2 border-t-2 border-black pt-3 text-black'>
				<button
					onClick={handleLike}
					className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
					style={{ background: liked ? "var(--color-pastel-pink)" : "#fff" }}>
					<Heart className={`h-4 w-4 ${liked ? "fill-current text-red-500" : ""}`} />
					{heartCount}
				</button>
				<Link
					to={`/cong-dong/bai-viet/${post.id}#comments`}
					className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					<MessageCircle className='h-4 w-4' />
					{post.comments_count}
				</Link>
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

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
const PostSkeleton: React.FC = () => (
	<div className='animate-pulse border-2 border-black rounded-2xl bg-white p-4 space-y-3'>
		<div className='flex items-center gap-3'>
			<div className='h-10 w-10 rounded-full bg-gray-200' />
			<div className='flex-1 space-y-2'>
				<div className='h-3 w-32 rounded bg-gray-200' />
				<div className='h-3 w-20 rounded bg-gray-200' />
			</div>
		</div>
		<div className='h-5 w-3/4 rounded bg-gray-200' />
		<div className='space-y-1.5'>
			<div className='h-3 w-full rounded bg-gray-200' />
			<div className='h-3 w-5/6 rounded bg-gray-200' />
		</div>
		<div className='aspect-[16/9] w-full rounded-[10px] bg-gray-200' />
	</div>
);

// ---------------------------------------------------------------------------
// CommunityPage
// ---------------------------------------------------------------------------

const CommunityPage: React.FC = () => {
	const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();
	const user = outletContext?.user ?? null;

	const [activeChannel, setActiveChannel] = useState("all");
	const [activeSort, setActiveSort] = useState("top");
	const [pageMode, setPageMode] = useState<"home" | "channel">("home");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// Channels state
	const [channels, setChannels] = useState<Channel[]>([]);
	const [channelsLoading, setChannelsLoading] = useState(true);

	// Posts API state
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [paginationMeta, setPaginationMeta] = useState<PaginatedResponse<Post>["meta"] | null>(null);

	const activePrimaryNav = pageMode === "home" ? "home" : "";
	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(
			userDisplayName,
		)}&background=A3E635&color=111111&bold=true`;

	const currentChannel = channels.find((ch) => ch.slug === activeChannel);

	// Map UI sort → API params
	const sortParams =
		activeSort === "top"
			? { sort: "reactions_count" as const, order: "desc" as const }
			: { sort: "created_at" as const, order: "desc" as const };

	// Fetch channels once on mount
	useEffect(() => {
		setChannelsLoading(true);
		channelService
			.getChannels()
			.then((res) => setChannels(res.data))
			.catch(() => setChannels([]))
			.finally(() => setChannelsLoading(false));
	}, []);

	// Fetch posts whenever filters change
	const fetchPosts = useCallback(
		async (page = 1) => {
			setLoading(true);
			setError(null);
			try {
				const channelParam =
					pageMode === "channel" && activeChannel !== "all" ? activeChannel : undefined;
				const response = await postService.getPosts({
					page,
					per_page: 15,
					channel: channelParam,
					...sortParams,
				});
				if (page === 1) {
					setPosts(response.data);
				} else {
					setPosts((prev) => [...prev, ...response.data]);
				}
				setPaginationMeta(response.meta);
			} catch {
				setError("Không thể tải bài viết. Vui lòng thử lại.");
			} finally {
				setLoading(false);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[activeChannel, activeSort, pageMode],
	);

	useEffect(() => {
		fetchPosts(1);
	}, [fetchPosts]);

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

	const handlePrimaryNavClick = () => {
		setPageMode("home");
		setActiveChannel("all");
		setActiveSort("top");
		setIsSidebarOpen(false);
	};

	const handleChannelClick = (slug: string) => {
		setPageMode("channel");
		setActiveChannel(slug);
		setActiveSort("top");
		setIsSidebarOpen(false);
	};

	const hasMore =
		paginationMeta != null &&
		paginationMeta.current_page < paginationMeta.last_page;

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
			<nav className='mt-3 space-y-1'>
				{channelsLoading
					? Array.from({ length: 5 }).map((_, i) => (
							<div
								key={i}
								className='flex animate-pulse items-center justify-between rounded-lg px-2.5 py-2'>
								<div className='flex items-center gap-3'>
									<div className='h-3.5 w-3.5 rounded bg-gray-200' />
									<div
										className='h-3 rounded bg-gray-200'
										style={{ width: `${55 + i * 12}px` }}
									/>
								</div>
								<div className='h-3 w-4 rounded bg-gray-200' />
							</div>
						))
					: channels.map((channel) => {
							const isActive =
								pageMode === "channel" && activeChannel === channel.slug;
							return (
								<button
									key={channel.id}
									onClick={() => handleChannelClick(channel.slug)}
									className={`group relative flex w-full items-center justify-between text-left font-bold ${
										isMobile
											? "rounded-xl px-3 py-2.5 text-base"
											: "rounded-lg px-2.5 py-2 text-[13px]"
									} ${
										isActive
											? "border-2 border-[var(--color-primary-dark)] bg-primary-100 text-[var(--color-text-primary)]"
											: "border-2 border-transparent bg-white text-black hover:bg-gray-100"
									}`}>
									<span className='flex items-center gap-3'>
										<Hash
											className={`transition-colors duration-200 ${
												isMobile ? "h-5 w-5" : "h-3.5 w-3.5"
											} ${
												isActive
													? "text-[var(--color-text-primary)]"
													: "text-gray-500"
											}`}
										/>
										{channel.name}
									</span>
									{channel.posts_count > 0 && (
										<span
											className={`text-xs tabular-nums transition-colors duration-200 ${
												isActive
													? "text-[var(--color-text-primary)]"
													: "text-gray-400"
											}`}>
											{channel.posts_count}
										</span>
									)}
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
						{/* Mobile community header */}
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
											#{currentChannel?.name ?? "Kênh"}
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

						{/* Sort tabs */}
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

						{/* Posts list */}
						<div className='space-y-5'>
							{loading ? (
								<>
									<PostSkeleton />
									<PostSkeleton />
									<PostSkeleton />
								</>
							) : error ? (
								<div className='neo-card neo-card-static bg-white px-6 py-16 text-center'>
									<RefreshCcw className='mx-auto h-10 w-10 text-gray-400' />
									<p className='mt-4 font-heading text-xl font-extrabold text-black'>
										Không thể tải bài viết
									</p>
									<p className='mt-2 text-sm text-gray-600'>{error}</p>
									<button
										onClick={() => fetchPosts(1)}
										className='mt-5 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
										<RefreshCcw className='h-4 w-4' />
										Thử lại
									</button>
								</div>
							) : posts.length > 0 ? (
								<>
									{posts.map((post) => (
										<PostCard key={post.id} post={post} />
									))}

									{hasMore && (
										<button
											onClick={() =>
												fetchPosts((paginationMeta?.current_page ?? 1) + 1)
											}
											className='w-full rounded-xl border-2 border-black bg-white py-3 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											Xem thêm bài viết
										</button>
									)}
								</>
							) : (
								<div className='neo-card neo-card-static bg-white px-6 py-16 text-center'>
									<Search className='mx-auto h-10 w-10 text-gray-500' />
									<p className='mt-4 font-heading text-xl font-extrabold text-black'>
										Chưa có bài viết nào
									</p>
									<p className='mt-2 text-sm text-gray-600'>
										Hãy là người đầu tiên chia sẻ trong cộng đồng này!
									</p>
									{user && (
										<Link
											to='/community/create'
											className='mt-5 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											<PenSquare className='h-4 w-4' />
											Đăng bài ngay
										</Link>
									)}
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
									<button className='text-xs font-bold text-lime-700 hover:text-black cursor-pointer'>
										Xem tất cả
									</button>
								</div>
								<div className='space-y-3'>
									{TOP_CONTRIBUTORS.map((member, index) => (
										<Link
											key={member.id}
											to={`/profile/${member.id}`}
											className='flex items-center gap-3'>
											<div className='flex items-center gap-3'>
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
