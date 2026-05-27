import React, { useEffect, useState } from "react";
import {
	Bookmark,
	Flame,
	Hash,
	Heart,
	List,
	MessageCircle,
	PenSquare,
	Search,
	Share2,
	Sparkles,
	Zap,
} from "lucide-react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import type { CommunityLayoutContext } from "./CommunityLayout";
import { COMMUNITY_LOGO } from "./CommunityLayout";

// ─── Mock data ────────────────────────────────────────────────────────────────

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
	{ id: 1, name: "Minh Trí", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=mt", points: 1420 },
	{ id: 2, name: "Hồng Nhung", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=hn", points: 1175 },
	{ id: 3, name: "Quốc Bảo", avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=qb", points: 940 },
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

// ─── PostCard ─────────────────────────────────────────────────────────────────

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
		<article className='rounded-2xl border-2 border-black bg-white p-4'>
			<div className='mb-3 flex items-center gap-3'>
				<div className='relative'>
					<img
						src={post.author.avatar}
						alt={post.author.name}
						className='h-10 w-10 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
					/>
					{post.pinned && (
						<span className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)] text-black'>
							<Zap className='h-3 w-3 fill-current' />
						</span>
					)}
				</div>
				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
						<p className='font-heading text-sm font-extrabold text-black'>{post.author.name}</p>
						<span className='text-sm font-medium text-gray-500'>{post.author.handle}</span>
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
					<img src={post.image} alt={post.title} className='aspect-[16/9] w-full object-cover' />
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
					onClick={() => setSaved((v) => !v)}
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

// ─── CommunityFeedPage ────────────────────────────────────────────────────────

const CommunityFeedPage: React.FC = () => {
	const { user, channels, setIsSidebarOpen } = useOutletContext<CommunityLayoutContext>();
	const { channelSlug } = useParams<{ channelSlug: string }>();

	const pageMode: "home" | "channel" = channelSlug ? "channel" : "home";
	const activeChannel = channelSlug ?? "all";

	const [activeSort, setActiveSort] = useState("top");

	// Reset sort khi đổi channel
	useEffect(() => {
		setActiveSort("top");
	}, [channelSlug]);

	const currentChannel =
		activeChannel === "all"
			? channels[0]
			: channels.find((ch) => ch.slug === activeChannel);

	const pageInfo = {
		image: pageMode === "home" ? COMMUNITY_LOGO : (currentChannel?.image ?? null),
		title:
			pageMode === "home"
				? "Cộng đồng CKC IT CLUB"
				: (currentChannel?.label ?? activeChannel),
		description:
			pageMode === "home"
				? "Nơi chia sẻ kiến thức và phát triển cùng nhau 🌱✦"
				: (currentChannel?.description ?? "Bài viết và thảo luận trong kênh này."),
	};

	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(
			userDisplayName,
		)}&background=A3E635&color=111111&bold=true`;

	const filteredPosts = MOCK_POSTS.filter(
		(post) => pageMode === "home" || activeChannel === "all" || post.channel === activeChannel,
	);

	return (
		<div className='community-content'>
			<main className='community-feed min-w-0 px-4 pb-5 md:px-4 md:pt-5'>
				{/* Mobile header */}
				<div className='sticky top-16 z-30 -mx-3 mb-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 md:hidden'>
					<button
						onClick={() => setIsSidebarOpen(true)}
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
						aria-label='Mở menu cộng đồng'>
						<List className='h-5 w-5' />
					</button>
					{pageInfo.image ? (
						<img
							src={pageInfo.image}
							alt={pageInfo.title}
							className='h-6 w-6 shrink-0 rounded-full border-2 border-black object-cover'
						/>
					) : (
						<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[var(--color-pastel-green)]'>
							<Hash className='h-3 w-3 text-black' />
						</div>
					)}
					<h1 className='min-w-0 truncate font-heading text-sm font-bold text-black'>
						{pageInfo.title}
					</h1>
				</div>

				{/* Desktop page header */}
				<div className='my-4 hidden items-center gap-4 pb-5 lg:flex'>
					{pageInfo.image ? (
						<img
							src={pageInfo.image}
							alt={pageInfo.title}
							className='h-18 w-18 shrink-0 rounded-full border-2 border-black object-cover'
						/>
					) : (
						<div className='flex h-18 w-18 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[var(--color-pastel-green)]'>
							<Hash className='h-8 w-8 text-black' />
						</div>
					)}
					<div>
						<h1 className='font-heading text-xl font-extrabold leading-tight text-black md:text-2xl lg:text-3xl'>
							{pageInfo.title}
						</h1>
						<p className='mt-2 text-sm font-medium text-gray-500'>{pageInfo.description}</p>
					</div>
				</div>

				{/* Create post prompt */}
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
					{filteredPosts.length > 0 ? (
						filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
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
							<h2 className='font-heading text-base font-extrabold text-black'>Tin mới</h2>
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
										<span className='mt-1 block text-xs text-gray-600'>{item.meta}</span>
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
									to={`/profile/${member.id}`}
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
										<p className='truncate text-sm font-bold text-black'>{member.name}</p>
										<p className='text-xs text-gray-700'>{member.points} điểm</p>
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
	);
};

export default CommunityFeedPage;
