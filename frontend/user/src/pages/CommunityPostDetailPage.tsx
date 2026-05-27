import React, { useEffect, useRef, useState } from "react";
import {
	ArrowLeft,
	Bookmark,
	Code2,
	Crown,
	Hash,
	Heart,
	Home,
	List,
	MessageCircle,
	Monitor,
	MoreHorizontal,
	Send,
	Share2,
	Trophy,
	X,
	Zap,
} from "lucide-react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { postService } from "@/services/post.service";
import { channelService } from "@/services/channel.service";
import type { PostDetail, PostComment } from "@/types/post.types";
import type { Channel } from "@/types/channel.types";

type MainLayoutOutletContext = { user: AuthUser | null };

// ---------------------------------------------------------------------------
// Helpers (shared with CommunityPage)
// ---------------------------------------------------------------------------

function formatRelativeTime(isoString: string): string {
	const diffMs = Date.now() - new Date(isoString).getTime();
	const mins = Math.floor(diffMs / 60_000);
	const hours = Math.floor(diffMs / 3_600_000);
	const days = Math.floor(diffMs / 86_400_000);
	if (mins < 1) return "vừa xong";
	if (mins < 60) return `${mins} phút`;
	if (hours < 24) return `${hours} giờ`;
	if (days < 30) return `${days} ngày`;
	return new Date(isoString).toLocaleDateString("vi-VN");
}

function getHandle(username: string | null, email: string): string {
	if (username) return `@${username}`;
	return `@${email.split("@")[0]}`;
}

function buildAvatar(name: string | null | undefined, avatar: string | null | undefined): string {
	if (avatar) return avatar;
	const n = name || "CKC";
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=A3E635&color=111111&bold=true`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
const DetailSkeleton: React.FC = () => (
	<div className='animate-pulse space-y-5'>
		<div className='h-8 w-2/3 rounded bg-gray-200' />
		<div className='flex items-center gap-3'>
			<div className='h-12 w-12 rounded-full bg-gray-200' />
			<div className='space-y-2'>
				<div className='h-3 w-36 rounded bg-gray-200' />
				<div className='h-3 w-24 rounded bg-gray-200' />
			</div>
		</div>
		<div className='space-y-2'>
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className='h-3 rounded bg-gray-200' style={{ width: `${100 - i * 3}%` }} />
			))}
		</div>
		<div className='aspect-[16/9] w-full rounded-xl bg-gray-200' />
	</div>
);

const CommentSkeleton: React.FC = () => (
	<div className='flex animate-pulse gap-3'>
		<div className='h-9 w-9 shrink-0 rounded-full bg-gray-200' />
		<div className='flex-1 space-y-2 rounded-xl border-2 border-gray-200 bg-white p-3'>
			<div className='h-3 w-28 rounded bg-gray-200' />
			<div className='h-3 w-full rounded bg-gray-200' />
			<div className='h-3 w-4/5 rounded bg-gray-200' />
		</div>
	</div>
);

// ---------------------------------------------------------------------------
// Single Comment (recursive for replies)
// ---------------------------------------------------------------------------
interface CommentItemProps {
	comment: PostComment;
	depth?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, depth = 0 }) => {
	const [liked, setLiked] = useState(false);
	const [likeCount, setLikeCount] = useState(comment.reactions_count);
	const [showReplies, setShowReplies] = useState(true);

	const u = comment.user;
	const avatar = buildAvatar(u?.full_name, u?.avatar);
	const name = u?.full_name ?? "Thành viên CKC";
	const handle = u ? getHandle(u.username, u.email) : "@ckc";
	const time = comment.created_at ? formatRelativeTime(comment.created_at) : "";
	const hasReplies = comment.replies && comment.replies.length > 0;

	return (
		<div className={depth > 0 ? "ml-11 mt-3" : ""}>
			<div className='flex gap-3'>
				{/* Avatar */}
				<div className='shrink-0'>
					<img
						src={avatar}
						alt={name}
						className='h-9 w-9 rounded-full border-2 border-black object-cover'
					/>
				</div>

				{/* Bubble */}
				<div className='min-w-0 flex-1'>
					<div className='rounded-[10px] border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0_#111]'>
						<div className='mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5'>
							<span className='font-heading text-sm font-extrabold text-black'>
								{name}
							</span>
							<span className='text-xs text-gray-500'>{handle}</span>
							<span className='text-xs text-gray-400'>· {time}</span>
						</div>
						<p className='text-sm leading-6 text-gray-800'>{comment.content}</p>
					</div>

					{/* Action row */}
					<div className='mt-1.5 flex items-center gap-3 px-1'>
						<button
							onClick={() => {
								setLiked((p) => {
									setLikeCount((c) => (p ? c - 1 : c + 1));
									return !p;
								});
							}}
							className='flex items-center gap-1 text-xs font-bold text-gray-500 transition hover:text-red-500'>
							<Heart
								className={`h-3.5 w-3.5 ${liked ? "fill-current text-red-500" : ""}`}
							/>
							{likeCount > 0 && <span>{likeCount}</span>}
						</button>
						{depth === 0 && (
							<button className='text-xs font-bold text-gray-500 transition hover:text-black'>
								Trả lời
							</button>
						)}
					</div>

					{/* Toggle replies */}
					{depth === 0 && hasReplies && (
						<button
							onClick={() => setShowReplies((p) => !p)}
							className='mt-2 ml-1 flex items-center gap-1.5 text-xs font-bold text-lime-700 transition hover:text-black'>
							<MessageCircle className='h-3.5 w-3.5' />
							{showReplies
								? "Ẩn trả lời"
								: `${comment.replies.length} trả lời`}
						</button>
					)}
				</div>
			</div>

			{/* Nested replies */}
			{depth === 0 && hasReplies && showReplies && (
				<div className='mt-1 space-y-3'>
					{comment.replies.map((reply) => (
						<CommentItem key={reply.id} comment={reply} depth={1} />
					))}
				</div>
			)}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const PRIMARY_NAV = [
	{ id: "home", label: "Trang chủ", icon: Home },
	{ id: "leaderboard", label: "Bảng xếp hạng", icon: Trophy },
	{ id: "showcase", label: "Showcase dự án", icon: Monitor },
	{ id: "challenge", label: "Thử thách tháng", icon: Crown },
	{ id: "code", label: "#30DaysOfCode", icon: Code2 },
];

const CommunityPostDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();
	const user = outletContext?.user ?? null;

	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [channels, setChannels] = useState<Channel[]>([]);

	const [post, setPost] = useState<PostDetail | null>(null);
	const [postLoading, setPostLoading] = useState(true);
	const [postError, setPostError] = useState<string | null>(null);

	const [comments, setComments] = useState<PostComment[]>([]);
	const [commentsLoading, setCommentsLoading] = useState(true);

	const [liked, setLiked] = useState(false);
	const [likeCount, setLikeCount] = useState(0);
	const [saved, setSaved] = useState(false);

	const commentInputRef = useRef<HTMLTextAreaElement>(null);

	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=A3E635&color=111111&bold=true`;

	// -------------------------------------------------------------------------
	// Fetch channels for sidebar
	// -------------------------------------------------------------------------
	useEffect(() => {
		channelService
			.getChannels()
			.then((res) => setChannels(res.data))
			.catch(() => setChannels([]));
	}, []);

	// -------------------------------------------------------------------------
	// Fetch post
	// -------------------------------------------------------------------------
	useEffect(() => {
		if (!id) return;
		setPostLoading(true);
		setPostError(null);
		postService
			.getPost(Number(id))
			.then((res) => {
				setPost(res.data);
				setLikeCount(res.data.reactions_count);
			})
			.catch(() => setPostError("Không tìm thấy bài viết."))
			.finally(() => setPostLoading(false));
	}, [id]);

	// -------------------------------------------------------------------------
	// Fetch comments
	// -------------------------------------------------------------------------
	useEffect(() => {
		if (!id) return;
		setCommentsLoading(true);
		postService
			.getPostComments(Number(id))
			.then((res) => setComments(res.data))
			.catch(() => setComments([]))
			.finally(() => setCommentsLoading(false));
	}, [id]);

	// Body lock when mobile sidebar open
	useEffect(() => {
		if (!isSidebarOpen) return;
		const prevBody = document.body.style.overflow;
		const prevHtml = document.documentElement.style.overflow;
		document.body.style.overflow = "hidden";
		document.documentElement.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prevBody;
			document.documentElement.style.overflow = prevHtml;
		};
	}, [isSidebarOpen]);

	// -------------------------------------------------------------------------
	// Derived values
	// -------------------------------------------------------------------------
	const authorName = post?.user?.full_name ?? "Thành viên CKC";
	const authorHandle = post?.user
		? getHandle(post.user.username, post.user.email)
		: "@ckc";
	const authorAvatar = buildAvatar(post?.user?.full_name, post?.user?.avatar);
	const channelName = post?.channel?.name ?? "Chung";
	const channelSlug = post?.channel?.slug ?? "general";
	const createdAt = post?.created_at ? formatRelativeTime(post.created_at) : "";

	// -------------------------------------------------------------------------
	// Sidebar
	// -------------------------------------------------------------------------
	const renderSidebarContent = (isMobile = false) => (
		<div className={isMobile ? "px-4 py-4" : "px-3 py-4"}>
			<nav className='space-y-1'>
				{PRIMARY_NAV.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.id}
							to='/cong-dong'
							onClick={() => setIsSidebarOpen(false)}
							className={`flex w-full items-center gap-2.5 rounded-lg border-2 border-transparent bg-white px-2.5 py-2.5 text-left font-bold text-gray-700 transition hover:bg-gray-100 ${
								isMobile ? "gap-3 rounded-xl px-3 py-3 text-base" : "text-[13px]"
							}`}>
							<Icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
							{item.label}
						</Link>
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
				{channels.map((ch) => (
					<Link
						key={ch.id}
						to='/cong-dong'
						onClick={() => setIsSidebarOpen(false)}
						className={`flex w-full items-center justify-between rounded-lg border-2 border-transparent bg-white px-2.5 py-2 text-left font-bold text-black transition hover:bg-gray-100 ${
							isMobile ? "rounded-xl px-3 py-2.5 text-base" : "text-[13px]"
						} ${ch.slug === channelSlug ? "border-[var(--color-primary-dark)] bg-primary-100 text-[var(--color-text-primary)]" : ""}`}>
						<span className='flex items-center gap-3'>
							<Hash
								className={`${isMobile ? "h-5 w-5" : "h-3.5 w-3.5"} ${
									ch.slug === channelSlug
										? "text-[var(--color-text-primary)]"
										: "text-gray-500"
								}`}
							/>
							{ch.name}
						</span>
						{ch.posts_count > 0 && (
							<span className='text-xs tabular-nums text-gray-400'>
								{ch.posts_count}
							</span>
						)}
					</Link>
				))}
			</nav>
		</div>
	);

	// -------------------------------------------------------------------------
	// Render
	// -------------------------------------------------------------------------
	return (
		<div className='min-h-screen bg-[var(--color-surface)] pt-16 text-black'>
			<div className='community-shell'>
				{/* ── Left sidebar ── */}
				<aside className='hidden border-r-2 border-black bg-white md:block'>
					<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto'>
						{renderSidebarContent()}
					</div>
				</aside>

				{/* ── Main content (no right rail) ── */}
				<div className='community-content'>
					<main className='community-feed min-w-0 px-4 pb-12 md:px-4 md:pt-5'>
						{/* Mobile top bar */}
						<div className='sticky top-16 z-30 -mx-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 md:hidden mb-3'>
							<button
								onClick={() => setIsSidebarOpen(true)}
								className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
								aria-label='Mở menu cộng đồng'>
								<List className='h-5 w-5' />
							</button>
							<button
								onClick={() => navigate(-1)}
								className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
								aria-label='Quay lại'>
								<ArrowLeft className='h-5 w-5' />
							</button>
							<h1 className='min-w-0 truncate font-heading text-sm font-bold text-black'>
								Bài viết
							</h1>
						</div>

						{/* Desktop back button */}
						<div className='mb-5 hidden items-center gap-3 md:flex'>
							<button
								onClick={() => navigate(-1)}
								className='inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
								aria-label='Quay lại'>
								<ArrowLeft className='h-5 w-5' />
							</button>
							<h1 className='font-heading text-xl font-extrabold text-black'>
								Bài viết
							</h1>
						</div>

						{/* ── Post Error ── */}
						{postError && (
							<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
								<p className='font-heading text-xl font-extrabold text-black'>
									{postError}
								</p>
								<Link
									to='/cong-dong'
									className='mt-5 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
									Quay lại cộng đồng
								</Link>
							</div>
						)}

						{/* ── Post card ── */}
						{!postError && (
							<article className='rounded-2xl border-2 border-black bg-white p-5 md:p-7'>
								{postLoading ? (
									<DetailSkeleton />
								) : post ? (
									<>
										{/* Author row */}
										<div className='mb-5 flex items-start justify-between gap-3'>
											<div className='flex items-center gap-3'>
												<div className='relative shrink-0'>
													<img
														src={authorAvatar}
														alt={authorName}
														className='h-12 w-12 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
													/>
													{post.is_pinned && (
														<span className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)]'>
															<Zap className='h-3 w-3 fill-current' />
														</span>
													)}
												</div>
												<div>
													<div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
														<p className='font-heading text-base font-extrabold text-black'>
															{authorName}
														</p>
														<span className='text-sm text-gray-500'>
															{authorHandle}
														</span>
														<span className='text-sm text-gray-400'>
															· {createdAt}
														</span>
													</div>
													<Link
														to={`/cong-dong?channel=${channelSlug}`}
														className='mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-lime-700 transition hover:text-black'>
														<Hash className='h-3 w-3' />
														{channelName}
													</Link>
												</div>
											</div>
											<button
												className='shrink-0 rounded-lg border-2 border-transparent p-1.5 transition hover:border-black hover:bg-gray-100'
												aria-label='Tùy chọn'>
												<MoreHorizontal className='h-5 w-5 text-gray-500' />
											</button>
										</div>

										{/* Title */}
										<h1 className='mb-4 font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
											{post.title}
										</h1>

										{/* Full content */}
										{post.content && (
											<div
												className='prose prose-sm max-w-none text-gray-800 leading-7 [&_strong]:font-extrabold [&_a]:text-lime-700 [&_a:hover]:underline [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm [&_pre]:rounded-xl [&_pre]:border-2 [&_pre]:border-black [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:text-white [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:pl-4 [&_blockquote]:text-gray-600'
												dangerouslySetInnerHTML={{ __html: post.content }}
											/>
										)}

										{/* Media images */}
										{post.media_urls.length > 0 && (
											<div className='mt-5 space-y-3'>
												{post.media_urls.map((url, i) => (
													<div
														key={i}
														className='overflow-hidden rounded-[10px] border-2 border-black bg-[var(--color-pastel-yellow)]'>
														<img
															src={url}
															alt={`media-${i + 1}`}
															className='w-full object-cover'
														/>
													</div>
												))}
											</div>
										)}

										{/* Tags */}
										{post.tags.length > 0 && (
											<div className='mt-5 flex flex-wrap gap-2'>
												{post.tags.map((tag) => (
													<span
														key={tag}
														className='rounded-lg border-2 border-black bg-[var(--color-pastel-blue)] px-3 py-1 text-xs font-bold text-black'>
														#{tag}
													</span>
												))}
											</div>
										)}

										{/* Reaction bar */}
										<div className='mt-6 flex flex-wrap items-center gap-2 border-t-2 border-black pt-4'>
											<button
												onClick={() => {
													setLiked((p) => {
														setLikeCount((c) => (p ? c - 1 : c + 1));
														return !p;
													});
												}}
												className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
												style={{
													background: liked
														? "var(--color-pastel-pink)"
														: "#fff",
												}}>
												<Heart
													className={`h-4 w-4 ${liked ? "fill-current text-red-500" : ""}`}
												/>
												{likeCount}
											</button>

											<button
												onClick={() =>
													commentInputRef.current?.focus()
												}
												className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
												<MessageCircle className='h-4 w-4' />
												{post.comments_count}
											</button>

											<button
												onClick={() => setSaved((p) => !p)}
												className='inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
												style={{
													background: saved
														? "var(--color-primary)"
														: "#fff",
												}}
												aria-label='Lưu bài viết'>
												<Bookmark
													className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
												/>
											</button>

											<button
												className='inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
												aria-label='Chia sẻ'>
												<Share2 className='h-4 w-4' />
											</button>
										</div>
									</>
								) : null}
							</article>
						)}

						{/* ── Comments section ── */}
						{!postError && (
							<section id='comments' className='mt-6'>
								{/* Header */}
								<div className='mb-4 flex items-center gap-3'>
									<MessageCircle className='h-5 w-5 text-black' />
									<h2 className='font-heading text-lg font-extrabold text-black'>
										{commentsLoading
											? "Bình luận"
											: `${comments.length} bình luận`}
									</h2>
								</div>

								{/* Comment input */}
								{user ? (
									<div className='mb-6 flex gap-3'>
										<img
											src={userAvatar}
											alt={userDisplayName}
											className='h-10 w-10 shrink-0 rounded-full border-2 border-black object-cover'
										/>
										<div className='flex min-w-0 flex-1 flex-col gap-2'>
											<textarea
												ref={commentInputRef}
												rows={3}
												placeholder='Viết bình luận của bạn...'
												className='w-full resize-none rounded-[10px] border-2 border-black bg-white px-4 py-3 text-sm font-medium leading-6 text-black outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_3px_#A3E635]'
											/>
											<div className='flex justify-end'>
												<button className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-4 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
													<Send className='h-4 w-4' />
													Gửi
												</button>
											</div>
										</div>
									</div>
								) : (
									<div className='mb-6 rounded-[10px] border-2 border-dashed border-black bg-white px-5 py-4 text-center'>
										<p className='text-sm font-semibold text-gray-600'>
											<Link
												to='/login'
												className='font-extrabold text-lime-700 hover:underline'>
												Đăng nhập
											</Link>{" "}
											để tham gia bình luận
										</p>
									</div>
								)}

								{/* Comment list */}
								<div className='space-y-5'>
									{commentsLoading ? (
										<>
											<CommentSkeleton />
											<CommentSkeleton />
											<CommentSkeleton />
										</>
									) : comments.length === 0 ? (
										<div className='rounded-[10px] border-2 border-dashed border-black bg-white px-6 py-10 text-center'>
											<MessageCircle className='mx-auto h-8 w-8 text-gray-300' />
											<p className='mt-3 font-heading text-base font-extrabold text-black'>
												Chưa có bình luận nào
											</p>
											<p className='mt-1 text-sm text-gray-500'>
												Hãy là người đầu tiên chia sẻ ý kiến!
											</p>
										</div>
									) : (
										comments.map((comment) => (
											<CommentItem key={comment.id} comment={comment} />
										))
									)}
								</div>
							</section>
						)}
					</main>

					{/* Right rail — empty slot so grid stays consistent */}
					<aside className='community-right-rail hidden' aria-hidden='true' />
				</div>
			</div>

			{/* ── Mobile sidebar overlay ── */}
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
								className='inline-flex h-9 w-9 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
								aria-label='Đóng'>
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

export default CommunityPostDetailPage;
