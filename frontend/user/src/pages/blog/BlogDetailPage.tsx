import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	Archive,
	Bookmark,
	Check,
	Clock,
	Eye,
	Heart,
	Loader2,
	LockKeyhole,
	MessageCircle,
	MoreHorizontal,
	Pencil,
	Pin,
	Send,
	Share2,
	Trash2,
	User,
	UserCheck,
	UserPlus,
} from "lucide-react";
import PrivacyBlogModal from "@/components/community/PrivacyBlogModal";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { AuthUser } from "@/services/auth.service";
import { blogService } from "@/services/blog.service";
import { userService } from "@/services/user.service";
import type { Blog, BlogDetail, BlogComment } from "@/types/blog.types";
import {
	buildAvatar,
	buildProfileUrl,
	formatRelativeTime,
	getHandle,
	readingTime,
} from "@/lib/utils";
import { renderMarkdownContent } from "@/lib/markdown";

// ─── Skeletons ────────────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
	<div className='animate-pulse space-y-5'>
		<div className='flex gap-2'>
			<div className='h-6 w-20 rounded-lg bg-gray-200' />
			<div className='h-6 w-16 rounded-lg bg-gray-200' />
		</div>
		<div className='h-9 w-3/4 rounded-lg bg-gray-200' />
		<div className='flex items-center gap-3'>
			<div className='h-12 w-12 rounded-full bg-gray-200' />
			<div className='space-y-2'>
				<div className='h-3.5 w-36 rounded bg-gray-200' />
				<div className='h-3 w-24 rounded bg-gray-200' />
			</div>
		</div>
		<div className='space-y-2'>
			{Array.from({ length: 8 }).map((_, i) => (
				<div
					key={i}
					className='h-3.5 rounded bg-gray-200'
					style={{ width: `${98 - i * 2}%` }}
				/>
			))}
		</div>
	</div>
);

const CoverSkeleton: React.FC = () => (
	<div className='mb-6 h-64 w-full animate-pulse rounded-2xl bg-gray-200 md:h-80' />
);

interface BlogCoverProps {
	loading: boolean;
	title?: string;
	imageUrl?: string | null;
}

const BlogCover: React.FC<BlogCoverProps> = ({ loading, title, imageUrl }) => {
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageFailed, setImageFailed] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		setImageLoaded(false);
		setImageFailed(false);
	}, [imageUrl]);

	// Ảnh từ cache: onLoad fire trước khi React attach handler → dùng useLayoutEffect
	// để check img.complete ngay sau khi DOM cập nhật, trước khi browser paint
	useLayoutEffect(() => {
		const el = imgRef.current;
		if (el && el.complete && el.naturalWidth > 0) {
			setImageLoaded(true);
		}
	}, [imageUrl]);

	if (loading) return <CoverSkeleton />;

	if (!imageUrl || imageFailed) {
		return (
			<div className='mb-8 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-pastel-blue)] px-6 text-center'>
				<span className='font-heading text-5xl font-extrabold uppercase leading-none text-black/20 md:text-7xl'>
					{title?.trim().charAt(0) || "B"}
				</span>
			</div>
		);
	}

	return (
		<div className='relative mb-8 w-full overflow-hidden rounded-2xl bg-gray-100'>
			{!imageLoaded && <div className='h-64 w-full animate-pulse bg-gray-200 md:h-80' />}
			<img
				ref={imgRef}
				src={imageUrl}
				alt={title || "Ảnh bìa blog"}
				className={`block max-h-[75vh] w-full object-contain transition-opacity duration-300 ${
					imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
				}`}
				onLoad={() => setImageLoaded(true)}
				onError={() => setImageFailed(true)}
			/>
		</div>
	);
};

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

const BlogSuggestionSkeleton: React.FC = () => (
	<div className='animate-pulse'>
		<div className='aspect-[16/9] rounded-xl bg-gray-200' />
		<div className='mt-4 h-3 w-36 rounded bg-gray-200' />
		<div className='mt-4 h-5 w-full rounded bg-gray-200' />
		<div className='mt-2 h-5 w-4/5 rounded bg-gray-200' />
		<div className='mt-5 flex gap-2'>
			<div className='h-7 w-24 rounded-full bg-gray-200' />
			<div className='h-7 w-28 rounded-full bg-gray-200' />
		</div>
	</div>
);

const formatBlogDate = (date: string): string =>
	new Date(date).toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});

const BlogSuggestionCard: React.FC<{ blog: Blog }> = ({ blog }) => {
	const date = blog.published_at ?? blog.created_at;
	const authorName = blog.user?.full_name ?? "CKC IT CLUB";

	return (
		<Link to={`/blog/${blog.slug}`} className='group block'>
			<div className='aspect-[16/9] overflow-hidden rounded-xl bg-[var(--color-pastel-green)]'>
				{blog.featured_image ? (
					<img
						src={blog.featured_image}
						alt={blog.title}
						className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
					/>
				) : (
					<div className='flex h-full w-full items-center justify-center'>
						<span className='font-heading text-4xl font-extrabold uppercase text-black/20'>
							{blog.title.charAt(0)}
						</span>
					</div>
				)}
			</div>
			<p className='mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500'>
				{formatBlogDate(date)} · {authorName}
			</p>
			<h3 className='mt-3 line-clamp-2 font-heading text-base font-extrabold leading-snug text-black group-hover:text-[var(--color-text-primary)] group-hover:underline'>
				{blog.title}
			</h3>
			{blog.tags.length > 0 && (
				<div className='mt-5 flex flex-wrap gap-2'>
					{blog.tags.slice(0, 2).map((tag) => (
						<span
							key={tag.id}
							className='rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-600'>
							{tag.name}
						</span>
					))}
				</div>
			)}
		</Link>
	);
};

interface BlogSuggestionSectionProps {
	title: string;
	blogs: Blog[];
	loading: boolean;
}

const BlogSuggestionSection: React.FC<BlogSuggestionSectionProps> = ({ title, blogs, loading }) => {
	if (!loading && blogs.length === 0) return null;

	return (
		<section className='mt-10 border-t-2 border-gray-200 pt-8'>
			<h2 className='font-heading text-2xl font-extrabold leading-tight text-black'>
				{title}
			</h2>
			<div className='mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
				{loading
					? Array.from({ length: 3 }).map((_, i) => <BlogSuggestionSkeleton key={i} />)
					: blogs.map((item) => <BlogSuggestionCard key={item.id} blog={item} />)}
			</div>
		</section>
	);
};

// ─── Role label map ───────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
	admin: "Quản trị viên",
	president: "Chủ nhiệm CLB",
	"vice-president": "Phó chủ nhiệm CLB",
	"academic-head": "Trưởng ban Học thuật",
	"communications-head": "Trưởng ban Truyền thông",
	"volunteer-head": "Trưởng ban Tình nguyện",
	"club-member": "Thành viên CKC IT Club",
	user: "Thành viên",
};

const getRoleLabel = (role?: string | null) =>
	role ? (ROLE_LABELS[role] ?? "Thành viên CKC IT Club") : "Thành viên CKC IT Club";

// ─── AuthorBioCard ────────────────────────────────────────────────────────────

interface AuthorBioCardProps {
	author: NonNullable<BlogDetail["user"]>;
	isOwnProfile: boolean;
	followed: boolean;
	followLoading: boolean;
	onFollow: () => void;
}

const AuthorBioCard: React.FC<AuthorBioCardProps> = ({
	author,
	isOwnProfile,
	followed,
	followLoading,
	onFollow,
}) => {
	const avatar = buildAvatar(author.full_name, author.avatar);
	const handle = getHandle(author.username, author.email);
	const profileUrl = buildProfileUrl(author.username, author.email);

	return (
		<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[3px_3px_0_#111] md:p-8'>
			<div className='flex flex-col gap-5 sm:flex-row sm:items-start'>
				<div className='shrink-0'>
					<Link to={profileUrl}>
						<img
							src={avatar}
							alt={author.full_name}
							className='h-20 w-20 rounded-full border-2 border-black object-cover shadow-[3px_3px_0_#111] transition hover:opacity-80'
						/>
					</Link>
				</div>
				<div className='min-w-0 flex-1'>
					<Link to={profileUrl} className='hover:underline'>
						<p className='font-heading text-xl font-extrabold leading-tight text-black'>
							{author.full_name}
						</p>
					</Link>
					<p className='mt-1 flex items-center gap-1.5 text-sm text-gray-500'>
						<User className='h-3.5 w-3.5 shrink-0' />
						{handle} · {getRoleLabel(author.role)}
					</p>
					<div className='mt-5 flex flex-wrap gap-3'>
						{!isOwnProfile && (
							<button
								onClick={onFollow}
								disabled={followLoading}
								className={`inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black px-5 font-heading text-sm font-extrabold shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-70 ${
									followed
										? "translate-x-[1px] translate-y-[1px] bg-white text-black shadow-none"
										: "bg-[var(--color-primary)] text-black"
								}`}>
								{followLoading ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : followed ? (
									<UserCheck className='h-4 w-4' strokeWidth={2.5} />
								) : (
									<UserPlus className='h-4 w-4' strokeWidth={2.5} />
								)}
								{followed ? "Đang theo dõi" : "Follow"}
							</button>
						)}
						<Link
							to={profileUrl}
							className='inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-white px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Xem hồ sơ
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface CommentItemProps {
	comment: BlogComment;
	depth?: number;
	blogId: number;
	user: AuthUser | null;
	onReplyAdded: (parentId: number, reply: BlogComment) => void;
	isHighlighted?: boolean;
	highlightedCommentId?: number | null;
}

const CommentItem: React.FC<CommentItemProps> = ({
	comment,
	depth = 0,
	blogId,
	user,
	onReplyAdded,
	isHighlighted = false,
	highlightedCommentId,
}) => {
	const navigate = useNavigate();
	const [liked, setLiked] = useState(comment.my_reaction === "heart");
	const [likeCount, setLikeCount] = useState(comment.reactions_count);
	const [reactionLoading, setReactionLoading] = useState(false);
	const [showReplies, setShowReplies] = useState(true);
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [replyText, setReplyText] = useState("");
	const [submittingReply, setSubmittingReply] = useState(false);
	const replyInputRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		if (showReplyForm) {
			const t = setTimeout(() => replyInputRef.current?.focus(), 30);
			return () => clearTimeout(t);
		}
	}, [showReplyForm]);

	const handleSubmitReply = async () => {
		if (!replyText.trim() || submittingReply) return;
		setSubmittingReply(true);
		try {
			const res = await blogService.createComment(blogId, replyText.trim(), comment.id);
			onReplyAdded(comment.id, { ...res.data, replies: [] });
			setReplyText("");
			setShowReplyForm(false);
			setShowReplies(true);
			toast.success("Đã trả lời bình luận!");
		} catch {
			toast.error("Không thể gửi trả lời. Vui lòng thử lại.");
		} finally {
			setSubmittingReply(false);
		}
	};

	const u = comment.user;
	const avatar = buildAvatar(u?.full_name, u?.avatar);
	const name = u?.full_name ?? "Thành viên CKC";
	const handle = u ? getHandle(u.username, u.email) : "@ckc";
	const time = comment.created_at ? formatRelativeTime(comment.created_at) : "";
	const hasReplies = comment.replies && comment.replies.length > 0;

	const currentUserDisplayName = user?.name || user?.email || "CKC member";
	const currentUserAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserDisplayName)}&background=A3E635&color=111111&bold=true`;

	return (
		<div
			id={`comment-${comment.id}`}
			className={`scroll-mt-24 ${depth > 0 ? "ml-11 mt-3" : ""}`}>
			<div
				className={`flex gap-3 rounded-xl transition-all duration-700 ${isHighlighted ? "bg-[var(--color-primary)]/15 p-1.5 ring-2 ring-[var(--color-primary)] ring-offset-2" : ""}`}>
				<div className='shrink-0'>
					<img
						src={avatar}
						alt={name}
						className='h-9 w-9 rounded-full border-2 border-black object-cover'
					/>
				</div>
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
					<div className='mt-1.5 flex items-center gap-3 px-1'>
						<button
							onClick={async () => {
								if (!user) {
									navigate("/login");
									return;
								}
								if (reactionLoading) return;
								const wasLiked = liked;
								setLiked(!wasLiked);
								setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
								setReactionLoading(true);
								try {
									const res = await blogService.toggleCommentReaction(comment.id, "heart");
									setLiked(res.data.my_reaction === "heart");
									setLikeCount(res.data.reactions_count);
								} catch {
									setLiked(wasLiked);
									setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
								} finally {
									setReactionLoading(false);
								}
							}}
							disabled={reactionLoading}
							className={`flex items-center gap-1 text-xs font-bold transition disabled:opacity-60 ${liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
							<Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
							{likeCount > 0 && <span>{likeCount}</span>}
						</button>
						{depth === 0 && (
							<button
								onClick={() => {
									if (!user) {
										navigate("/login");
										return;
									}
									setShowReplyForm((p) => !p);
								}}
								className={`text-xs font-bold transition ${showReplyForm ? "text-black" : "text-gray-500 hover:text-black"}`}>
								Trả lời
							</button>
						)}
					</div>

					{depth === 0 && showReplyForm && (
						<div className='mt-3 flex gap-2'>
							<img
								src={currentUserAvatar}
								alt={currentUserDisplayName}
								className='h-8 w-8 shrink-0 rounded-full border-2 border-black object-cover'
							/>
							<div className='flex min-w-0 flex-1 flex-col gap-2'>
								<textarea
									ref={replyInputRef}
									rows={2}
									value={replyText}
									onChange={(e) => setReplyText(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
											handleSubmitReply();
										if (e.key === "Escape") setShowReplyForm(false);
									}}
									placeholder={`Trả lời ${name}...`}
									className='w-full resize-none rounded-[10px] border-2 border-black bg-white px-3 py-2 text-sm font-medium leading-6 text-black outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_3px_#A3E635]'
								/>
								<div className='flex justify-end gap-2'>
									<button
										onClick={() => {
											setShowReplyForm(false);
											setReplyText("");
										}}
										className='inline-flex h-8 items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 text-xs font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
										Hủy
									</button>
									<button
										onClick={handleSubmitReply}
										disabled={!replyText.trim() || submittingReply}
										className='inline-flex h-8 items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary)] px-3 text-xs font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50'>
										<Send className='h-3.5 w-3.5' />
										{submittingReply ? "Đang gửi..." : "Gửi"}
									</button>
								</div>
							</div>
						</div>
					)}

					{depth === 0 && hasReplies && (
						<button
							onClick={() => setShowReplies((p) => !p)}
							className='ml-1 mt-2 flex items-center gap-1.5 text-xs font-bold text-lime-700 transition hover:text-black'>
							<MessageCircle className='h-3.5 w-3.5' />
							{showReplies ? "Ẩn trả lời" : `${comment.replies.length} trả lời`}
						</button>
					)}
				</div>
			</div>

			{depth === 0 && hasReplies && showReplies && (
				<div className='mt-1 space-y-3'>
					{comment.replies.map((reply) => (
						<CommentItem
							key={reply.id}
							comment={reply}
							depth={1}
							blogId={blogId}
							user={user}
							onReplyAdded={onReplyAdded}
							isHighlighted={highlightedCommentId === reply.id}
						/>
					))}
				</div>
			)}
		</div>
	);
};

// ─── BlogDetailPage ───────────────────────────────────────────────────────────

const BlogDetailPage: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [blog, setBlog] = useState<BlogDetail | null>(null);
	const [blogLoading, setBlogLoading] = useState(true);
	const [blogError, setBlogError] = useState<string | null>(null);

	const [comments, setComments] = useState<BlogComment[]>([]);
	const [commentsLoading, setCommentsLoading] = useState(true);

	const [liked, setLiked] = useState(false);
	const [heartCount, setHeartCount] = useState(0);
	const [reactionLoading, setReactionLoading] = useState(false);
	const [saved, setSaved] = useState(false);
	const [saveLoading, setSaveLoading] = useState(false);

	const [followed, setFollowed] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);
	const copyResetRef = useRef<number | null>(null);

	const [showBlogMenu, setShowBlogMenu] = useState(false);
	const [pinLoading, setPinLoading] = useState(false);
	const [archiveLoading, setArchiveLoading] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showPrivacyModal, setShowPrivacyModal] = useState(false);
	const menuBtnRef = useRef<HTMLButtonElement>(null);
	const menuDropdownRef = useRef<HTMLDivElement>(null);

	const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
	const [commentText, setCommentText] = useState("");
	const [submittingComment, setSubmittingComment] = useState(false);
	const commentInputRef = useRef<HTMLTextAreaElement>(null);
	const [suggestedBlogs, setSuggestedBlogs] = useState<Blog[]>([]);
	const [suggestedBlogsLoading, setSuggestedBlogsLoading] = useState(false);
	const viewRecordedRef = useRef(false);

	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=A3E635&color=111111&bold=true`;

	useEffect(() => {
		if (!slug) return;
		setBlogLoading(true);
		setBlogError(null);
		viewRecordedRef.current = false;
		blogService
			.getBlog(slug)
			.then((res) => {
				setBlog(res.data);
				setLiked(res.data.my_reaction === "heart");
				setHeartCount(res.data.reactions_count);
				setSaved(res.data.my_bookmark ?? false);
				setFollowed(res.data.user?.is_following ?? false);
			})
			.catch(() => setBlogError("Không tìm thấy bài viết."))
			.finally(() => setBlogLoading(false));
	}, [slug]);

	useEffect(() => {
		if (!slug || !blog?.slug || viewRecordedRef.current) return;
		viewRecordedRef.current = true;
		blogService.recordView(slug).then((res) => {
			setBlog((prev) => prev ? { ...prev, view_count: res.data.view_count } : prev);
		}).catch(() => {});
	}, [slug, blog?.slug]);

	useEffect(() => {
		if (!blog?.id) return;
		setCommentsLoading(true);
		blogService
			.getBlogComments(blog.id)
			.then((res) => setComments(res.data))
			.catch(() => setComments([]))
			.finally(() => setCommentsLoading(false));
	}, [blog?.id]);

	// Scroll + highlight a specific comment when navigating from a notification link (#comment-{id})
	useEffect(() => {
		if (commentsLoading || !location.hash) return;
		const match = location.hash.match(/^#comment-(\d+)$/);
		if (!match) return;
		const commentId = parseInt(match[1], 10);
		const el = document.getElementById(location.hash.slice(1));
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			setHighlightedCommentId(commentId);
			const timer = setTimeout(() => setHighlightedCommentId(null), 3000);
			return () => clearTimeout(timer);
		}
	}, [commentsLoading, location.hash]);

	useEffect(() => {
		if (!blog?.id) return;

		let cancelled = false;
		setSuggestedBlogsLoading(true);

		blogService
			.getBlogs({
				sort: "published_at",
				order: "desc",
				per_page: 18,
			})
			.then((res) => {
				if (!cancelled) {
					setSuggestedBlogs(res.data.filter((item) => item.id !== blog.id));
				}
			})
			.catch(() => {
				if (!cancelled) setSuggestedBlogs([]);
			})
			.finally(() => {
				if (!cancelled) setSuggestedBlogsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [blog?.id]);

	const authorName = blog?.user?.full_name ?? "CKC IT CLUB";
	const authorAvatar = buildAvatar(blog?.user?.full_name, blog?.user?.avatar);
	const publishedAt = blog?.published_at ?? blog?.created_at ?? "";
	const tagNames = new Set(blog?.tags.map((tag) => tag.name) ?? []);
	const moreByAuthor = suggestedBlogs
		.filter((item) => blog?.user?.id && item.user?.id === blog.user.id)
		.slice(0, 3);
	const relatedBlogs = suggestedBlogs
		.filter((item) => item.tags.some((tag) => tagNames.has(tag.name)))
		.filter((item) => !moreByAuthor.some((authorBlog) => authorBlog.id === item.id))
		.slice(0, 3);

	const handleSubmitComment = async () => {
		if (!commentText.trim() || submittingComment || !blog) return;
		setSubmittingComment(true);
		try {
			const res = await blogService.createComment(blog.id, commentText.trim());
			const newComment: BlogComment = { ...res.data, replies: [] };
			setComments((prev) => [...prev, newComment]);
			setCommentText("");
			setBlog((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev));
			toast.success("Đã đăng bình luận!");
		} catch {
			toast.error("Không thể gửi bình luận. Vui lòng thử lại.");
		} finally {
			setSubmittingComment(false);
		}
	};

	const handleReplyAdded = (parentId: number, reply: BlogComment) => {
		setComments((prev) =>
			prev.map((c) =>
				c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c,
			),
		);
		setBlog((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev));
	};

	const handleFollow = async () => {
		if (!user) {
			navigate("/login", { state: { from: window.location.pathname } });
			return;
		}
		const authorHandle = blog?.user?.username ?? blog?.user?.email?.split("@")[0];
		if (!authorHandle || followLoading) return;

		const wasFollowed = followed;
		setFollowed(!wasFollowed);
		setFollowLoading(true);
		try {
			const res = await userService.toggleFollow(authorHandle);
			setFollowed(res.data.is_following);
			const authorName = blog?.user?.full_name ?? "tác giả";
			if (res.data.is_following) {
				toast.success(`Đã theo dõi ${authorName}`);
			} else {
				toast.success(`Đã bỏ theo dõi ${authorName}`);
			}
		} catch {
			setFollowed(wasFollowed);
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setFollowLoading(false);
		}
	};

	const isOwnProfile = Boolean(user?.id && blog?.user?.id && Number(user.id) === blog.user.id);
	const isArchived = blog?.status === "archived";
	const currentVisibility = (blog?.visibility ?? "public") as "public" | "members" | "private";

	const handlePrivacySaved = (visibility: "public" | "members" | "private") => {
		setBlog((prev) => (prev ? { ...prev, visibility } : prev));
	};

	useEffect(() => {
		if (!showBlogMenu) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (menuBtnRef.current?.contains(e.target as Node)) return;
			if (menuDropdownRef.current?.contains(e.target as Node)) return;
			setShowBlogMenu(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showBlogMenu]);

	const closeBlogMenu = () => setShowBlogMenu(false);

	const handleTogglePin = async () => {
		if (!blog || pinLoading) return;
		closeBlogMenu();
		const nextPinned = !blog.is_pinned;
		setBlog((prev) => (prev ? { ...prev, is_pinned: nextPinned } : prev));
		setPinLoading(true);
		try {
			const res = await blogService.pinBlog(blog.id, nextPinned);
			setBlog((prev) => (prev ? { ...prev, is_pinned: res.data.is_pinned } : prev));
			toast.success(res.data.is_pinned ? "Đã ghim bài viết lên trang cá nhân." : "Đã bỏ ghim bài viết.");
		} catch {
			setBlog((prev) => (prev ? { ...prev, is_pinned: !nextPinned } : prev));
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setPinLoading(false);
		}
	};

	const handleToggleArchive = async () => {
		if (!blog || archiveLoading) return;
		closeBlogMenu();
		const nextStatus = isArchived ? "published" : "archived";
		const previousStatus = blog.status;
		setBlog((prev) => (prev ? { ...prev, status: nextStatus } : prev));
		setArchiveLoading(true);
		try {
			await blogService.archiveBlog(blog.id, nextStatus);
			toast.success(nextStatus === "archived" ? "Đã lưu trữ bài viết." : "Đã khôi phục bài viết.");
		} catch {
			setBlog((prev) => (prev ? { ...prev, status: previousStatus } : prev));
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setArchiveLoading(false);
		}
	};

	const handleDeleteBlog = async () => {
		if (!blog) return;
		try {
			await blogService.deleteBlog(blog.id);
			toast.success("Đã xóa bài viết.");
			navigate("/blog");
		} catch {
			toast.error("Không thể xóa. Vui lòng thử lại.");
		}
	};

	const handleToggleSaved = async () => {
		if (!user) {
			navigate("/login", { state: { from: window.location.pathname } });
			return;
		}
		if (!blog || saveLoading) return;

		const wasSaved = saved;
		setSaved(!wasSaved);
		setSaveLoading(true);
		try {
			const res = await blogService.toggleBookmark(blog.id);
			setSaved(res.data.bookmarked);
			toast.success(res.data.bookmarked ? "Đã lưu bài viết." : "Đã bỏ lưu bài viết.");
		} catch {
			setSaved(wasSaved);
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setSaveLoading(false);
		}
	};

	// Cleanup copy timeout on unmount
	useEffect(() => {
		return () => {
			if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
		};
	}, []);

	const handleCopyLink = async () => {
		const url = `${window.location.origin}/blog/${blog?.slug ?? ""}`;
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url);
			} else {
				const el = document.createElement("textarea");
				el.value = url;
				el.style.position = "fixed";
				el.style.top = "-9999px";
				document.body.appendChild(el);
				el.select();
				document.execCommand("copy");
				document.body.removeChild(el);
			}
			setCopiedLink(true);
			toast.success("Đã sao chép liên kết bài viết.");
			if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
			copyResetRef.current = window.setTimeout(() => {
				setCopiedLink(false);
				copyResetRef.current = null;
			}, 2500);
		} catch {
			toast.error("Không thể sao chép. Vui lòng thử lại.");
		}
	};

	return (
		<div className='w-full min-h-screen pt-16'>
			<main className='mx-auto w-full max-w-5xl px-4 pb-16 md:px-6'>
				{/* Mobile top bar */}
				<div className='sticky top-16 z-30 -mx-4 mb-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 md:hidden'>
					<button
						onClick={() => navigate(-1)}
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
						aria-label='Quay lại'>
						<ArrowLeft className='h-5 w-5' />
					</button>
					<h1 className='min-w-0 truncate font-heading text-sm font-bold text-black'>
						Blog
					</h1>
				</div>

				{/* Breadcrumb */}
				<div className='mb-6 pt-6'>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link
										to='/blog'
										className='text-sm font-semibold text-gray-500 hover:text-black'>
										Blog
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<span className='text-gray-400'>/</span>
							</BreadcrumbSeparator>
							{blog?.tags?.length ? (
								blog.tags.map((tag) => (
									<BreadcrumbItem key={tag.id}>
										<span className='rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-600'>
											{tag.name}
										</span>
									</BreadcrumbItem>
								))
							) : (
								<BreadcrumbItem>
									<span className='rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-600'>
										Bài viết
									</span>
								</BreadcrumbItem>
							)}
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{blogError && (
					<div className='flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center py-12'>
						<div className='w-full max-w-sm rounded-2xl border-2 border-black bg-white px-8 py-12 text-center shadow-[4px_4px_0_#111]'>
							<p className='font-heading text-xl font-extrabold text-black'>
								{blogError}
							</p>
							<p className='mt-2 text-sm text-gray-500'>
								Bài viết bạn tìm không tồn tại hoặc đã bị xóa.
							</p>
							<Link
								to='/blog'
								className='mt-6 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								Quay lại Blog
							</Link>
						</div>
					</div>
				)}

				{!blogError && (
					<BlogCover
						loading={blogLoading}
						title={blog?.title}
						imageUrl={blog?.featured_image}
					/>
				)}

				{!blogError && (
					<article className='rounded-2xl bg-white'>
						{blogLoading ? (
							<div>
								<DetailSkeleton />
							</div>
						) : blog ? (
							<>
								<div>
									{/* Title */}
									<h1 className='font-heading text-3xl font-extrabold leading-tight text-black md:text-4xl lg:text-5xl'>
										{blog.title}
									</h1>

									{/* Author + meta */}
									<div className='mt-5 flex items-start justify-between gap-3'>
										<div className='flex items-center gap-3'>
											<img
												src={authorAvatar}
												alt={authorName}
												className='h-12 w-12 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
											/>
											<div>
												<p className='font-heading text-base font-extrabold text-black'>
													{authorName}
												</p>
												<div className='flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-500'>
													<span>
														{publishedAt
															? formatRelativeTime(publishedAt)
															: ""}
													</span>
													<span className='flex items-center gap-1'>
														<Clock className='h-3.5 w-3.5' />
														{readingTime(blog.content)} phút đọc
													</span>
													<span className='flex items-center gap-1'>
														<Eye className='h-3.5 w-3.5' />
														{blog.view_count} lượt xem
													</span>
												</div>
											</div>
										</div>

										{/* Three-dot menu */}
										{user && (
											<div className='relative shrink-0'>
												<button
													ref={menuBtnRef}
													onClick={() => setShowBlogMenu((p) => !p)}
													className={`shrink-0 rounded-lg border-2 p-1.5 transition ${showBlogMenu ? "border-black bg-gray-100" : "border-transparent hover:border-black hover:bg-gray-100"}`}
													aria-label='Tùy chọn'>
													<MoreHorizontal className='h-5 w-5 text-gray-500' />
												</button>
												{showBlogMenu && (
													<div
														ref={menuDropdownRef}
														className='absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-xl border-2 border-black bg-white p-2 shadow-[4px_4px_0_#111]'>
														{isOwnProfile ? (
															<>
																<button
																	onClick={handleTogglePin}
																	disabled={pinLoading}
																	className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100 disabled:opacity-60'>
																	<Pin className='h-4 w-4' />
																	{blog.is_pinned ? "Bỏ ghim" : "Ghim"}
																</button>
																<button
																	onClick={() => {
																		closeBlogMenu();
																		navigate(`/blog/${blog.slug}/chinh-sua`);
																	}}
																	className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
																	<Pencil className='h-4 w-4' />
																	Chỉnh sửa
																</button>
																<button
																	onClick={() => {
																		closeBlogMenu();
																		setShowPrivacyModal(true);
																	}}
																	className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
																	<LockKeyhole className='h-4 w-4' />
																	Quyền riêng tư
																</button>
																<button
																	onClick={handleToggleArchive}
																	disabled={archiveLoading}
																	className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100 disabled:opacity-60'>
																	<Archive className='h-4 w-4' />
																	{archiveLoading
																		? isArchived ? "Đang khôi phục..." : "Đang lưu trữ..."
																		: isArchived ? "Bỏ lưu trữ" : "Lưu trữ"}
																</button>
																<button
																	onClick={() => {
																		closeBlogMenu();
																		setShowDeleteConfirm(true);
																	}}
																	className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50'>
																	<Trash2 className='h-4 w-4' />
																	Xóa
																</button>
															</>
														) : (
															<button
																onClick={() => {
																	closeBlogMenu();
																	void handleToggleSaved();
																}}
																disabled={saveLoading}
																className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100 disabled:opacity-60'>
																<Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
																{saved ? "Bỏ lưu" : "Lưu"}
															</button>
														)}
													</div>
												)}
											</div>
										)}
									</div>

									{/* Content */}
									{blog.content && (
										<div className='so-editor-outer community-markdown mt-7'>
											<div
												className='s-prose'
												dangerouslySetInnerHTML={{
													__html: renderMarkdownContent(blog.content),
												}}
											/>
										</div>
									)}

									{/* Reactions + actions */}
									<div className='mt-7 flex flex-wrap items-center gap-2 border-t-2 border-black pt-5'>
										<button
											onClick={async () => {
												if (!user) {
													navigate("/login");
													return;
												}
												if (reactionLoading) return;
												const wasLiked = liked;
												setLiked(!wasLiked);
												setHeartCount((c) =>
													wasLiked ? Math.max(0, c - 1) : c + 1,
												);
												setReactionLoading(true);
												try {
													const res = await blogService.toggleReaction(
														blog.id,
														"heart",
													);
													setLiked(res.data.my_reaction === "heart");
													setHeartCount(res.data.reactions_count);
												} catch {
													setLiked(wasLiked);
													setHeartCount((c) =>
														wasLiked ? c + 1 : Math.max(0, c - 1),
													);
												} finally {
													setReactionLoading(false);
												}
											}}
											disabled={reactionLoading}
											className='inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'
											style={{
												background: liked
													? "var(--color-pastel-pink)"
													: "#fff",
											}}>
											<Heart
												className={`h-4 w-4 ${liked ? "fill-current text-red-500" : ""}`}
											/>
											{heartCount}
										</button>

										<button
											onClick={() => commentInputRef.current?.focus()}
											className='inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											<MessageCircle className='h-4 w-4' />
											{blog.comments_count}
										</button>

										<button
											onClick={handleToggleSaved}
											disabled={saveLoading}
											className='inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'
											style={{
												background: saved ? "var(--color-primary)" : "#fff",
											}}
											aria-label='Lưu bài viết'>
											<Bookmark
												className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
											/>
										</button>

										<button
											onClick={handleCopyLink}
											className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
												copiedLink
													? "bg-[var(--color-primary)] translate-x-[1px] translate-y-[1px] shadow-none"
													: "bg-white"
											}`}
											aria-label='Sao chép liên kết'>
											{copiedLink ? (
												<Check className='h-4 w-4 text-black' />
											) : (
												<Share2 className='h-4 w-4' />
											)}
										</button>
									</div>
								</div>
							</>
						) : null}
					</article>
				)}

				{/* Author bio */}
				{!blogError && blog?.user && (
					<div className='mt-6'>
						<AuthorBioCard
							author={blog.user}
							isOwnProfile={isOwnProfile}
							followed={followed}
							followLoading={followLoading}
							onFollow={handleFollow}
						/>
					</div>
				)}

				{/* Comments section */}
				{!blogError && (
					<section id='comments' className='mt-6'>
						<div className='mb-6 flex items-center gap-3'>
							<MessageCircle className='h-5 w-5 text-black' />
							<h2 className='font-heading text-lg font-extrabold text-black'>
								{commentsLoading ? "Bình luận" : `${comments.length} bình luận`}
							</h2>
						</div>

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
										value={commentText}
										onChange={(e) => setCommentText(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
												handleSubmitComment();
										}}
										placeholder='Viết bình luận của bạn... (Ctrl+Enter để gửi)'
										className='w-full resize-none rounded-[10px] border-2 border-black bg-white px-4 py-3 text-sm font-medium leading-6 text-black outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_3px_#A3E635]'
									/>
									<div className='flex justify-end'>
										<button
											onClick={handleSubmitComment}
											disabled={!commentText.trim() || submittingComment}
											className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-4 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50'>
											<Send className='h-4 w-4' />
											{submittingComment ? "Đang gửi..." : "Gửi"}
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
									<CommentItem
										key={comment.id}
										comment={comment}
										blogId={blog?.id ?? 0}
										user={user}
										onReplyAdded={handleReplyAdded}
										isHighlighted={highlightedCommentId === comment.id}
										highlightedCommentId={highlightedCommentId}
									/>
								))
							)}
						</div>
					</section>
				)}

				{!blogError && blog && (
					<>
						<BlogSuggestionSection
							title={`Bài viết khác của ${authorName}`}
							blogs={moreByAuthor}
							loading={suggestedBlogsLoading}
						/>
						<BlogSuggestionSection
							title='Bài viết liên quan'
							blogs={relatedBlogs}
							loading={suggestedBlogsLoading}
						/>
					</>
				)}
			</main>

			{/* Privacy modal */}
			{blog && showPrivacyModal && (
				<PrivacyBlogModal
					blogId={blog.id}
					currentVisibility={currentVisibility}
					onClose={() => setShowPrivacyModal(false)}
					onSaved={handlePrivacySaved}
				/>
			)}

			{/* Delete confirm modal */}
			{showDeleteConfirm && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
					<div
						className='w-full max-w-sm rounded-2xl border-2 border-black bg-white p-7'
						style={{ boxShadow: "6px 6px 0 #111" }}>
						<Trash2 className='mx-auto mb-4 h-10 w-10 text-red-500' />
						<h2
							className='mb-2 text-center font-heading text-xl font-extrabold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							Xóa bài viết?
						</h2>
						<p className='mb-7 text-center text-sm text-gray-600'>
							Bài viết sẽ bị xóa vĩnh viễn và không thể khôi phục.
						</p>
						<div className='flex gap-3'>
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className='flex-1 rounded-xl border-2 border-black py-2.5 text-sm font-bold text-black transition hover:bg-gray-100'>
								Hủy
							</button>
							<button
								onClick={() => void handleDeleteBlog()}
								className='flex-1 rounded-xl border-2 border-red-600 bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700'>
								Xóa
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default BlogDetailPage;
