import React, { useState } from "react";
import {
	BookOpen,
	Bookmark,
	Bug,
	CalendarDays,
	ChevronRight,
	Code2,
	Crown,
	Flame,
	Hash,
	Heart,
	Home,
	ImageIcon,
	MessageCircle,
	Monitor,
	PenSquare,
	Search,
	Send,
	Share2,
	Sparkles,
	Trophy,
	Users,
	X,
	Zap,
} from "lucide-react";

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
	{ id: "following", label: "Đang theo dõi", icon: Users },
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
		<article className='neo-card neo-card-static bg-white p-4'>
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
	const [activeChannel, setActiveChannel] = useState("all");
	const [activeSort, setActiveSort] = useState("top");
	const [pageMode, setPageMode] = useState<"home" | "channel">("home");
	const [searchQuery, setSearchQuery] = useState("");
	const [showCreateModal, setShowCreateModal] = useState(false);
	const activePrimaryNav = pageMode === "home" ? "home" : "";

	const currentChannel = CHANNELS.find((channel) => channel.id === activeChannel);

	const filteredPosts = MOCK_POSTS.filter((post) => {
		const matchChannel = pageMode === "home" || activeChannel === "all" || post.channel === activeChannel;
		const normalizedQuery = searchQuery.trim().toLowerCase();
		const matchSearch =
			!normalizedQuery ||
			post.title.toLowerCase().includes(normalizedQuery) ||
			post.excerpt.toLowerCase().includes(normalizedQuery);
		return matchChannel && matchSearch;
	});

	return (
		<div className='min-h-screen bg-[var(--color-surface)] pt-16 text-black'>
			<div className='community-shell'>
				<aside className='hidden border-r-2 border-black bg-white lg:block'>
					<div className='sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-4 pr-1 pl-0'>
						<nav className='space-y-1.5'>
							{PRIMARY_NAV.map((item) => {
								const Icon = item.icon;
								const isActive = activePrimaryNav === item.id;
								return (
									<button
										key={item.id}
										onClick={() => {
											setPageMode("home");
											setActiveChannel("all");
											setActiveSort("top");
										}}
										className='flex w-full items-center gap-2.5 rounded-[10px] border-2 px-2.5 py-2.5 text-left text-[13px] font-bold transition hover:translate-x-[1px] hover:translate-y-[1px] hover:border-black hover:bg-[var(--color-pastel-blue)] hover:shadow-[2px_2px_0_#111]'
										style={{
											background: isActive ? "var(--color-primary)" : "#fff",
											borderColor: isActive ? "#111" : "transparent",
											boxShadow: isActive ? "3px 3px 0 #111" : "none",
											color: isActive ? "#111" : "#374151",
										}}>
										<Icon className='h-4 w-4' style={{ color: isActive ? "#111" : "#6b7280" }} />
										{item.label}
									</button>
								);
							})}
						</nav>

						<div className='mt-6 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500'>
							Kênh
						</div>
						<nav className='mt-2 space-y-1.5'>
							{CHANNELS.map((channel) => (
								<button
									key={channel.id}
									onClick={() => {
										setPageMode("channel");
										setActiveChannel(channel.id);
										setActiveSort("top");
									}}
									className='flex w-full items-center justify-between rounded-[10px] border-2 px-2.5 py-2 text-left text-[13px] font-bold transition'
									style={{
										background: pageMode === "channel" && activeChannel === channel.id ? "var(--color-primary)" : "#fff",
										borderColor: pageMode === "channel" && activeChannel === channel.id ? "#111" : "transparent",
										boxShadow: pageMode === "channel" && activeChannel === channel.id ? "3px 3px 0 #111" : "none",
										color: "#111",
									}}>
									<span className='flex items-center gap-3'>
										<Hash className='h-3.5 w-3.5 text-gray-500' />
										{channel.label}
									</span>
									<span className='text-xs text-gray-500'>{channel.count}</span>
								</button>
							))}
						</nav>
					</div>
				</aside>

				<div className='community-content'>
				<main className='community-feed min-w-0 px-4 py-5 md:px-5 lg:px-6'>
					{/* Community header – home mode */}
					{pageMode === "home" && (
						<div className='mb-5 flex items-center gap-4 border-b border-gray-200 pb-5'>
							<img
								src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/it_club_ckc.jpg'
								alt='CKC IT Club'
								className='h-14 w-14 shrink-0 rounded-full border-2 border-black object-cover'
								style={{ boxShadow: "var(--neo-shadow)" }}
							/>
							<div>
								<h1 className='font-heading text-xl font-extrabold leading-tight text-black md:text-2xl'>
									CKC IT Club Community
								</h1>
								<p className='mt-0.5 text-sm font-medium text-gray-500'>
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
									<h1 className='font-heading text-xl font-extrabold text-black'>#{currentChannel?.label ?? "Kênh"}</h1>
									<p className='text-sm font-semibold text-gray-700'>Bài viết và thảo luận trong kênh này.</p>
								</div>
							</div>
						</section>
					)}

					<div className='mb-4 flex flex-col gap-3 md:flex-row md:items-center'>
						<div className='flex min-h-10 flex-1 items-center gap-2 rounded-[10px] border-2 border-black bg-white px-3 shadow-[3px_3px_0_#111]'>
							<Search className='h-4 w-4 shrink-0 text-gray-500' />
							<input
								type='text'
								placeholder='Tìm bài viết, chủ đề, tài nguyên...'
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								className='w-full bg-transparent text-sm font-medium text-black outline-none placeholder:text-gray-500'
							/>
							{searchQuery && (
								<button onClick={() => setSearchQuery("")} aria-label='Xóa tìm kiếm'>
									<X className='h-4 w-4 text-gray-500 hover:text-black' />
								</button>
							)}
						</div>
						<button
							onClick={() => setShowCreateModal(true)}
							className='neo-btn neo-btn-primary inline-flex h-11 px-4 py-0 text-sm md:hidden'>
							<PenSquare className='h-4 w-4' />
							Đăng bài
						</button>
					</div>

					{pageMode === "home" ? (
						<div className='mb-5 border-b border-gray-200'>
							<div className='flex overflow-x-auto'>
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
											{isActive && <span className='absolute right-0 -bottom-[3px] left-0 h-[3px] bg-[var(--color-primary)]' />}
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
								<p className='mt-4 font-heading text-xl font-extrabold text-black'>Không tìm thấy bài viết</p>
								<p className='mt-2 text-sm text-gray-600'>Thử từ khóa khác hoặc đổi kênh ở thanh bên.</p>
							</div>
						)}
					</div>
				</main>

				<aside className='hidden border-l-2 border-black bg-white xl:block'>
					<div className='sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5'>
						<section className='neo-card neo-card-static bg-white p-4'>
							<div className='mb-4 flex items-center justify-between'>
								<h2 className='font-heading text-base font-extrabold text-black'>Tin mới</h2>
								<button className='text-xs font-bold text-lime-700 hover:text-black'>Xem tất cả</button>
							</div>
							<div className='space-y-4'>
								{NEWS_ITEMS.map((item) => (
									<button key={item.title} className='flex w-full gap-3 rounded-lg p-1 text-left transition hover:bg-[var(--color-pastel-yellow)]'>
										<img src={item.image} alt='' className='h-11 w-11 rounded-lg border-2 border-black bg-[var(--color-pastel-blue)] object-cover' />
										<span className='min-w-0'>
											<span className='block text-[13px] font-extrabold leading-snug text-black'>{item.title}</span>
											<span className='mt-1 block text-xs text-gray-600'>{item.meta}</span>
										</span>
									</button>
								))}
							</div>
						</section>

						<section className='neo-card neo-card-static mt-5 bg-[var(--color-pastel-yellow)] p-4'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-[var(--color-primary)] text-black shadow-[2px_2px_0_#111]'>
									<BookOpen className='h-5 w-5' />
								</div>
								<div>
									<h2 className='font-heading text-sm font-extrabold text-black'>Quy tắc cộng đồng</h2>
									<p className='text-sm text-gray-700'>Đọc code of conduct</p>
								</div>
								<ChevronRight className='ml-auto h-5 w-5 text-black' />
							</div>
						</section>

						<section className='neo-card neo-card-static mt-5 bg-[var(--color-pastel-blue)] p-4'>
							<h2 className='mb-3 font-heading text-base font-extrabold text-black'>Đóng góp nổi bật</h2>
							<div className='space-y-3'>
								{TOP_CONTRIBUTORS.map((member, index) => (
									<div key={member.id} className='flex items-center gap-3'>
										<span className='w-5 text-sm font-extrabold text-gray-600'>#{index + 1}</span>
										<img src={member.avatar} alt={member.name} className='h-9 w-9 rounded-full border-2 border-black bg-white' />
										<div className='min-w-0'>
											<p className='truncate text-sm font-bold text-black'>{member.name}</p>
											<p className='text-xs text-gray-700'>{member.points} điểm</p>
										</div>
									</div>
								))}
							</div>
						</section>

						<p className='mt-5 text-sm text-gray-500'>© 2026 CKC IT Club · Điều khoản · Bảo mật</p>
					</div>
				</aside>
				</div>
			</div>

			{showCreateModal && (
				<div
					className='fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm'
					onClick={() => setShowCreateModal(false)}>
					<div
						className='w-full max-w-xl rounded-[14px] border-2 border-black bg-white p-5 text-black shadow-[6px_6px_0_#111]'
						onClick={(event) => event.stopPropagation()}>
						<div className='mb-5 flex items-center justify-between'>
							<div>
								<span className='neo-tag bg-[var(--color-pastel-green)]'>Cộng đồng</span>
								<h2 className='mt-3 font-heading text-xl font-extrabold'>Tạo bài viết mới</h2>
							</div>
							<button
								onClick={() => setShowCreateModal(false)}
								className='rounded-lg border-2 border-black bg-white p-1.5 text-black transition hover:bg-[var(--color-pastel-pink)]'>
								<X className='h-4 w-4' />
							</button>
						</div>
						<div className='space-y-4'>
							<select className='h-11 w-full rounded-[10px] border-2 border-black bg-[var(--color-pastel-blue)] px-3 text-sm font-bold text-black shadow-[3px_3px_0_#111] outline-none focus:bg-white focus:ring-2 focus:ring-lime-300'>
								{CHANNELS.filter((channel) => channel.id !== "all").map((channel) => (
									<option key={channel.id} value={channel.id}>{channel.label}</option>
								))}
							</select>
							<input
								type='text'
								placeholder='Tiêu đề bài viết...'
								className='h-11 w-full rounded-[10px] border-2 border-black bg-[var(--color-pastel-yellow)] px-3 text-sm font-bold text-black shadow-[3px_3px_0_#111] outline-none placeholder:text-gray-600 focus:bg-white focus:ring-2 focus:ring-lime-300'
							/>
							<textarea
								rows={6}
								placeholder='Chia sẻ kiến thức, đặt câu hỏi hoặc thông báo sự kiện...'
								className='w-full resize-none rounded-[10px] border-2 border-black bg-[var(--color-pastel-green)] px-3 py-3 text-sm font-medium text-black shadow-[3px_3px_0_#111] outline-none placeholder:text-gray-600 focus:bg-white focus:ring-2 focus:ring-lime-300'
							/>
							<div className='flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4'>
								<div className='flex gap-2 text-black'>
									<button className='rounded-lg border-2 border-black bg-[var(--color-pastel-purple)] p-2 shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none' aria-label='Thêm hình ảnh'>
										<ImageIcon className='h-4 w-4' />
									</button>
									<button className='rounded-lg border-2 border-black bg-[var(--color-pastel-orange)] p-2 shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none' aria-label='Thêm lịch'>
										<CalendarDays className='h-4 w-4' />
									</button>
									<button className='rounded-lg border-2 border-black bg-[var(--color-pastel-pink)] p-2 shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none' aria-label='Báo lỗi'>
										<Bug className='h-4 w-4' />
									</button>
								</div>
								<button className='neo-btn neo-btn-primary h-10 px-4 py-0 text-sm'>
									<Send className='h-4 w-4' />
									Đăng bài
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default CommunityPage;
