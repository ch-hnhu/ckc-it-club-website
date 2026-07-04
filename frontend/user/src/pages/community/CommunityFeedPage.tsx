import React, { useEffect, useState } from "react";
import { Flame, Hash, Menu, PenSquare, Search, Sparkles } from "lucide-react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { buildProfileUrl } from "@/lib/utils";
import type { CommunityLayoutContext } from "./CommunityLayout";
import { postService } from "@/services/post.service";
import type { Post } from "@/types/post.types";
import PostCard from "@/components/community/PostCard";
import { AvatarImage } from "@/components/ui/AvatarImage";

// ─── Static sidebar data ──────────────────────────────────────────────────────

const COMMUNITY_LOGO = "https://www.codedex.io/images/community/bouncer.gif";

const SORT_OPTIONS = [
	{ id: "top", label: "Top bài viết", icon: Flame },
	{ id: "newest", label: "Mới nhất", icon: Sparkles },
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

// ─── ChannelIcon ─────────────────────────────────────────────────────────────

interface ChannelIconProps {
	image: string | null;
	title: string;
	size: "sm" | "lg";
}

const ChannelIcon: React.FC<ChannelIconProps> = ({ image, title, size }) => {
	const [failed, setFailed] = useState(false);
	const dimCls = size === "sm" ? "h-6 w-6" : "h-18 w-18";
	const iconCls = size === "sm" ? "h-3 w-3" : "h-8 w-8";

	if (!image || failed) {
		return (
			<div
				className={`flex ${dimCls} shrink-0 items-center justify-center rounded-full border-2 border-black bg-[var(--color-pastel-green)]`}>
				<Hash className={`${iconCls} text-black`} />
			</div>
		);
	}

	return (
		<img
			src={image}
			alt={title}
			className={`${dimCls} shrink-0 rounded-full border-2 border-black object-cover bg-white`}
			onError={() => setFailed(true)}
		/>
	);
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const PostSkeleton: React.FC = () => (
	<div className='animate-pulse rounded-2xl border-2 border-black bg-white p-4'>
		<div className='mb-3 flex items-center gap-3'>
			<div className='h-10 w-10 rounded-full bg-gray-200' />
			<div className='space-y-2'>
				<div className='h-3 w-32 rounded bg-gray-200' />
				<div className='h-3 w-20 rounded bg-gray-200' />
			</div>
		</div>
		<div className='mb-3 h-5 w-3/4 rounded bg-gray-200' />
		<div className='space-y-2'>
			<div className='h-3 w-full rounded bg-gray-200' />
			<div className='h-3 w-5/6 rounded bg-gray-200' />
		</div>
		<div className='mt-4 aspect-[16/9] w-full rounded-xl bg-gray-200' />
		<div className='mt-4 flex gap-2 border-t-2 border-gray-200 pt-3'>
			<div className='h-9 w-16 rounded-lg bg-gray-200' />
			<div className='h-9 w-16 rounded-lg bg-gray-200' />
		</div>
	</div>
);

// ─── CommunityFeedPage ────────────────────────────────────────────────────────

const CommunityFeedPage: React.FC = () => {
	const { user, channels, setIsSidebarOpen } = useOutletContext<CommunityLayoutContext>();
	const { channelSlug } = useParams<{ channelSlug: string }>();

	const pageMode: "home" | "channel" = channelSlug ? "channel" : "home";
	const activeChannel = channelSlug ?? "";
	// home hoặc "chung" đều load toàn bộ bài viết (không filter channel)
	const isAllChannel = pageMode === "home" || activeChannel === "chung";

	const [activeSort, setActiveSort] = useState("top");
	const [posts, setPosts] = useState<Post[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		setActiveSort("top");
	}, [channelSlug]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		postService
			.getPosts({
				channel: isAllChannel ? undefined : activeChannel,
				sort: activeSort === "top" ? "reactions_count" : "created_at",
				order: "desc",
				per_page: 20,
			})
			.then((res) => {
				if (!cancelled) setPosts(res.data);
			})
			.catch(() => {
				if (!cancelled) setError("Không thể tải bài viết. Vui lòng thử lại.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [activeChannel, activeSort, retryCount]);

	const currentChannel = channels.find((ch) => ch.slug === activeChannel);

	const pageInfo = {
		image:
			pageMode === "home"
				? COMMUNITY_LOGO
				: isAllChannel
					? COMMUNITY_LOGO
					: (currentChannel?.image ?? null),
		title:
			pageMode === "home"
				? "Cộng đồng CKC IT CLUB"
				: isAllChannel
					? "Kênh chung"
					: (currentChannel?.label ?? activeChannel),
		description:
			pageMode === "home"
				? "Nơi chia sẻ kiến thức và phát triển cùng nhau 🌱✦"
				: isAllChannel
					? "Tất cả bài viết từ mọi kênh trong cộng đồng 🌱✦"
					: (currentChannel?.description ?? "Bài viết và thảo luận trong kênh này."),
	};

	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(
			userDisplayName,
		)}&background=A3E635&color=111111&bold=true`;

	return (
		<div className='community-content'>
			<main className='community-feed min-w-0 px-4 pb-5 md:px-4 md:pt-5'>
				{/* Mobile header */}
				<div className='sticky top-16 z-30 -mx-3 mb-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 lg:hidden'>
					<button
						onClick={() => setIsSidebarOpen(true)}
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
						aria-label='Mở menu cộng đồng'>
						<Menu className='h-5 w-5' />
					</button>
					<ChannelIcon image={pageInfo.image} title={pageInfo.title} size='sm' />
					<h1 className='min-w-0 truncate font-heading text-sm font-bold text-black'>
						{pageInfo.title}
					</h1>
				</div>

				{/* Desktop page header */}
				<div className='my-4 hidden items-center gap-4 pb-5 lg:flex'>
					<ChannelIcon image={pageInfo.image} title={pageInfo.title} size='lg' />
					<div>
						<h1 className='font-heading text-xl font-extrabold leading-tight text-black md:text-2xl lg:text-3xl'>
							{pageInfo.title}
						</h1>
						<p className='mt-2 text-sm font-medium text-gray-500'>
							{pageInfo.description}
						</p>
					</div>
				</div>

				{/* Create post prompt */}
				{user && (
					<div className='mb-6 flex items-center gap-3 rounded-xl border-2 border-black bg-white px-5 py-4'>
						<Link
							to={buildProfileUrl(user.username, user.email ?? "")}
							className='relative'>
							<AvatarImage
								fallbackName={userDisplayName}
								src={userAvatar}
								alt={userDisplayName}
								className='h-11 w-11 shrink-0 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
							/>
						</Link>
						<Link
							to='/cong-dong/dang-bai'
							className='flex h-11 min-w-0 flex-1 cursor-pointer items-center rounded-[10px] border-2 border-black bg-gray-50 px-4 text-left font-body text-sm font-medium text-gray-500 transition'>
							Chia sẻ điều gì đó...
						</Link>
						<Link
							to='/cong-dong/dang-bai'
							className='inline-flex h-11 shrink-0 select-none items-center justify-center gap-2 rounded-[10px] border-2 border-black bg-[var(--color-primary)] px-4 py-0 font-heading text-sm font-extrabold text-dark shadow-[3px_3px_0_#000000] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<PenSquare strokeWidth={3} className='h-4 w-4 text-dark' />
							Đăng bài
						</Link>
					</div>
				)}

				{/* Sort tabs */}
				<div className='mb-5 border-b border-gray-200'>
					<div className='flex'>
						{SORT_OPTIONS.map((option) => {
							const Icon = option.icon;
							const isActive = activeSort === option.id;
							return (
								<button
									key={option.id}
									onClick={() => setActiveSort(option.id)}
									className='relative flex shrink-0 items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-extrabold transition hover:text-black md:text-base'
									style={{
										fontFamily: "var(--font-heading)",
										color: isActive ? "#111" : "#6b7280",
									}}>
									<Icon className='h-4 w-4' />
									{option.label}
									{isActive && (
										<span className='absolute -bottom-[3px] left-0 right-0 h-[3px] rounded-t-sm bg-[var(--color-primary)]' />
									)}
								</button>
							);
						})}
					</div>
				</div>

				{/* Posts */}
				<div className='space-y-5'>
					{loading ? (
						Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
					) : error ? (
						<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
							<p className='font-heading text-xl font-extrabold text-black'>
								Có lỗi xảy ra
							</p>
							<p className='mt-2 text-sm text-gray-600'>{error}</p>
							<button
								onClick={() => setRetryCount((count) => count + 1)}
								className='mt-4 rounded-lg border-2 border-black bg-[var(--color-primary)] px-4 py-2 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								Thử lại
							</button>
						</div>
					) : posts.length > 0 ? (
						posts.map((post) => (
								<PostCard
									key={post.id}
									post={post}
									user={user}
									onPostDeleted={(id) =>
										setPosts((prev) => prev.filter((p) => p.id !== id))
									}
								/>
							))
					) : (
						<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
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

			{/* Right rail */}
			<aside className='community-right-rail'>
				<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5'>
					<section className='neo-card neo-card-static bg-white p-4'>
						<div className='mb-4 flex items-center justify-between'>
							<h2 className='font-heading text-base font-extrabold text-black'>
								Tin mới
							</h2>
							<button className='cursor-pointer text-xs font-bold text-lime-700 hover:text-black'>
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
							<button className='cursor-pointer text-xs font-bold text-lime-700 hover:text-black'>
								Xem tất cả
							</button>
						</div>
						<div className='space-y-3'>
							{TOP_CONTRIBUTORS.map((member, index) => (
								<Link
									key={member.id}
									to={`/@${member.id}`}
									className='flex items-center gap-3'>
									<span className='w-5 text-sm font-extrabold text-gray-600'>
										#{index + 1}
									</span>
									<AvatarImage
										fallbackName={member.name}
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
								</Link>
							))}
						</div>
					</section>

					<p className='mt-5 text-sm text-center text-gray-500'>
						© 2026 CKC IT CLUB · Điều khoản · Bảo mật
					</p>
				</div>
			</aside>
		</div>
	);
};

export default CommunityFeedPage;
