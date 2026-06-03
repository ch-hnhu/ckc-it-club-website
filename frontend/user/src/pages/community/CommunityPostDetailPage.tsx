import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	Archive,
	Bookmark,
	Flag,
	Hash,
	Check,
	Heart,
	Menu,
	LockKeyhole,
	MessageCircle,
	MoreHorizontal,
	Pencil,
	Pin,
	Send,
	Share2,
	Trash2,
} from "lucide-react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { postService } from "@/services/post.service";
import { userService } from "@/services/user.service";
import type { PostDetail, PostComment } from "@/types/post.types";
import type { CommunityLayoutContext } from "./CommunityLayout";
import {
	buildAvatar,
	formatRelativeTime,
	getHandle,
	isVideoMediaUrl,
	buildProfileUrl,
} from "@/lib/utils";
import { renderMarkdownContent } from "@/lib/markdown";
import DeletePostConfirm from "@/components/community/DeletePostConfirm";
import PrivacyPostModal from "@/components/community/PrivacyPostModal";
import ReportPostModal from "@/components/community/ReportPostModal";

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
				<div
					key={i}
					className='h-3 rounded bg-gray-200'
					style={{ width: `${100 - i * 3}%` }}
				/>
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
	postId: number;
	user: AuthUser | null;
	onReplyAdded?: (parentId: number, reply: PostComment) => void;
	isHighlighted?: boolean;
	highlightedCommentId?: number | null;
}

const CommentItem: React.FC<CommentItemProps> = ({
	comment,
	depth = 0,
	postId,
	user,
	onReplyAdded,
	isHighlighted = false,
	highlightedCommentId,
}) => {
	const navigate = useNavigate();
	const location = useLocation();

	const [liked, setLiked] = useState(comment.my_reaction === "heart");
	const [likeCount, setLikeCount] = useState(comment.reactions_count);
	const [likeLoading, setLikeLoading] = useState(false);
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

	const handleReplyClick = () => {
		if (!user) {
			navigate("/login", { state: { from: location.pathname + location.search } });
			return;
		}
		setShowReplyForm((p) => !p);
	};

	const handleSubmitReply = async () => {
		if (!replyText.trim() || submittingReply) return;
		setSubmittingReply(true);
		try {
			const res = await postService.createComment(postId, replyText.trim(), comment.id);
			onReplyAdded?.(comment.id, { ...res.data, replies: [] });
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
	const profileUrl = u ? buildProfileUrl(u.username, u.email) : null;
	const time = comment.created_at ? formatRelativeTime(comment.created_at) : "";
	const hasReplies = comment.replies && comment.replies.length > 0;

	const currentUserDisplayName = user?.name || user?.email || "CKC member";
	const currentUserAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserDisplayName)}&background=A3E635&color=111111&bold=true`;

	if (comment.is_hidden) {
		return (
			<div
				id={`comment-${comment.id}`}
				className={`scroll-mt-24 ${depth > 0 ? "ml-11 mt-3" : ""}`}>
				<div className={`flex gap-3 rounded-xl transition-all duration-700 ${isHighlighted ? "bg-[var(--color-primary)]/15 p-1.5 ring-2 ring-[var(--color-primary)] ring-offset-2" : ""}`}>
					<div className='h-9 w-9 shrink-0 rounded-full border-2 border-dashed border-gray-300 bg-gray-100' />
					<div className='min-w-0 flex-1'>
						<div className='rounded-[10px] border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 shadow-[2px_2px_0_#d1d5db]'>
							<div className='mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5'>
								<span className='font-heading text-sm font-extrabold text-gray-300'>●●●</span>
								<span className='text-xs text-gray-300'>· {time}</span>
							</div>
							<p className='text-sm italic text-gray-400'>Bình luận này đã bị ẩn.</p>
						</div>

						{depth === 0 && hasReplies && (
							<button
								onClick={() => setShowReplies((p) => !p)}
								className='mt-2 ml-1 flex items-center gap-1.5 text-xs font-bold text-lime-700 transition hover:text-black'>
								<MessageCircle className='h-3.5 w-3.5' />
								{showReplies ? "Thu gọn" : `${comment.replies.length} trả lời`}
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
								postId={postId}
								user={user}
							/>
						))}
					</div>
				)}
			</div>
		);
	}

	return (
		<div
			id={`comment-${comment.id}`}
			className={`scroll-mt-24 ${depth > 0 ? "ml-11 mt-3" : ""}`}>
			<div className={`flex gap-3 rounded-xl transition-all duration-700 ${isHighlighted ? "bg-[var(--color-primary)]/15 p-1.5 ring-2 ring-[var(--color-primary)] ring-offset-2" : ""}`}>
				<div className='shrink-0'>
					<Link to={profileUrl ?? "#"}>
						<img
							src={avatar}
							alt={name}
							className='h-9 w-9 rounded-full border-2 border-black object-cover'
						/>
					</Link>
				</div>

				<div className='min-w-0 flex-1'>
					<div className='rounded-[10px] border-2 border-black bg-white px-4 py-3 shadow-[2px_2px_0_#111]'>
						<div className='mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5'>
							<Link
								to={profileUrl ?? "#"}
								className='font-heading text-sm font-extrabold text-black hover:underline'>
								{name}
							</Link>
							<span className='text-xs text-gray-500'>{handle}</span>
							<span className='text-xs text-gray-400'>· {time}</span>
						</div>
						<p className='text-sm leading-6 text-gray-800'>{comment.content}</p>
					</div>

					<div className='mt-1.5 flex items-center gap-3 px-1'>
						<button
							onClick={async () => {
								if (!user) {
									navigate("/login", { state: { from: location.pathname + location.search } });
									return;
								}
								if (likeLoading) return;
								const wasLiked = liked;
								setLiked(!wasLiked);
								setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
								setLikeLoading(true);
								try {
									const res = await postService.toggleCommentReaction(comment.id, "heart");
									setLiked(res.data.my_reaction === "heart");
									setLikeCount(res.data.reactions_count);
								} catch {
									setLiked(wasLiked);
									setLikeCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
								} finally {
									setLikeLoading(false);
								}
							}}
							disabled={likeLoading}
							className={`flex items-center gap-1 text-xs font-bold transition ${liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
							<Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
							{likeCount > 0 && <span>{likeCount}</span>}
						</button>
						{depth === 0 && (
							<button
								onClick={handleReplyClick}
								className={`text-xs font-bold transition ${
									showReplyForm ? "text-black" : "text-gray-500 hover:text-black"
								}`}>
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
							className='mt-2 ml-1 flex items-center gap-1.5 text-xs font-bold text-lime-700 transition hover:text-black'>
							<MessageCircle className='h-3.5 w-3.5' />
							{showReplies ? "Thu gọn" : `${comment.replies.length} trả lời`}
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
							postId={postId}
							user={user}
							isHighlighted={highlightedCommentId === reply.id}
						/>
					))}
				</div>
			)}
		</div>
	);
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const CommunityPostDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { user, setIsSidebarOpen } = useOutletContext<CommunityLayoutContext>();

	const [post, setPost] = useState<PostDetail | null>(null);
	const [postLoading, setPostLoading] = useState(true);
	const [postError, setPostError] = useState<string | null>(null);

	const [comments, setComments] = useState<PostComment[]>([]);
	const [commentsLoading, setCommentsLoading] = useState(true);

	const [liked, setLiked] = useState(false);
	const [heartCount, setHeartCount] = useState(0);
	const [reactionLoading, setReactionLoading] = useState(false);
	const [saved, setSaved] = useState(false);
	const [saveLoading, setSaveLoading] = useState(false);
	const [pinLoading, setPinLoading] = useState(false);
	const [archiveLoading, setArchiveLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [followed, setFollowed] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);
	const [authorStats, setAuthorStats] = useState<{
		posts_count: number;
		followers_count: number;
		following_count: number;
	} | null>(null);

	const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
	const [commentText, setCommentText] = useState("");
	const [submittingComment, setSubmittingComment] = useState(false);
	const [showPostMenu, setShowPostMenu] = useState(false);
	const [showPrivacyModal, setShowPrivacyModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);
	const [hasReported, setHasReported] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);

	const commentInputRef = useRef<HTMLTextAreaElement>(null);
	const menuBtnRef = useRef<HTMLButtonElement>(null);
	const menuDropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!showPostMenu) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (menuBtnRef.current?.contains(e.target as Node)) return;
			if (menuDropdownRef.current?.contains(e.target as Node)) return;
			setShowPostMenu(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showPostMenu]);

	const handleTogglePostMenu = () => {
		setShowPostMenu((p) => !p);
	};

	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=A3E635&color=111111&bold=true`;

	useEffect(() => {
		if (!id) return;
		setPostLoading(true);
		setPostError(null);
		postService
			.getPost(Number(id))
			.then((res) => {
				setPost(res.data);
				setLiked(res.data.my_reaction === "heart");
				setHeartCount(res.data.reactions_count);
				setSaved(res.data.my_bookmark ?? false);
				setHasReported(res.data.my_report ?? false);
			})
			.catch(() => setPostError("Không tìm thấy bài viết."))
			.finally(() => setPostLoading(false));
	}, [id]);

	useEffect(() => {
		if (!id) return;
		setCommentsLoading(true);
		postService
			.getPostComments(Number(id))
			.then((res) => setComments(res.data))
			.catch(() => setComments([]))
			.finally(() => setCommentsLoading(false));
	}, [id]);

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
		if (!post?.user) return;
		const handle = getHandle(post.user.username, post.user.email).replace(/^@/, "");
		userService
			.getProfile(handle)
			.then((res) => {
				const profile = res.data;
				setFollowed(profile.is_following ?? false);
				setAuthorStats({
					posts_count: profile.posts_count ?? 0,
					followers_count: profile.followers_count ?? 0,
					following_count: profile.following_count ?? 0,
				});
			})
			.catch(() => {});
	}, [post?.user?.id]);

	const handleToggleFollow = async () => {
		if (!user) {
			navigate("/login", { state: { from: location.pathname + location.search } });
			return;
		}
		if (followLoading || !post?.user) return;
		setFollowLoading(true);
		const wasFollowed = followed;
		setFollowed((f) => !f);
		setAuthorStats((prev) =>
			prev
				? { ...prev, followers_count: prev.followers_count + (wasFollowed ? -1 : 1) }
				: prev,
		);
		try {
			const handle = getHandle(post.user.username, post.user.email).replace(/^@/, "");
			const res = await userService.toggleFollow(handle);
			setFollowed(res.data.is_following);
			setAuthorStats((prev) =>
				prev ? { ...prev, followers_count: res.data.followers_count } : prev,
			);
		} catch {
			setFollowed(wasFollowed);
			setAuthorStats((prev) =>
				prev
					? { ...prev, followers_count: prev.followers_count + (wasFollowed ? 1 : -1) }
					: prev,
			);
			toast.error("Không thể thực hiện hành động. Vui lòng thử lại.");
		} finally {
			setFollowLoading(false);
		}
	};

	const authorName = post?.user?.full_name ?? "Thành viên CKC";
	const authorHandle = post?.user ? getHandle(post.user.username, post.user.email) : "@ckc";
	const authorAvatar = buildAvatar(post?.user?.full_name, post?.user?.avatar);
	const authorProfileUrl = post?.user
		? buildProfileUrl(post.user.username, post.user.email)
		: null;
	const channelName = post?.channel?.name ?? "Chung";
	const channelSlug = post?.channel?.slug ?? "general";
	const createdAt = post?.created_at ? formatRelativeTime(post.created_at) : "";
	const renderedPostContent = post?.content ? renderMarkdownContent(post.content) : "";
	const isOwnPost = Boolean(user?.id && post?.user?.id && Number(user.id) === post.user.id);
	const isArchived = post?.status === "archived";
	const currentVisibility = (post?.visibility ?? "public") as "public" | "members" | "private";

	const closePostMenu = () => setShowPostMenu(false);

	const requireAuthenticatedUser = () => {
		if (user) return true;
		closePostMenu();
		navigate("/login", { state: { from: location.pathname + location.search } });
		return false;
	};

	const handleToggleSaved = async () => {
		if (!requireAuthenticatedUser()) return;
		if (!post || saveLoading) return;

		const wasSaved = saved;
		setSaved(!wasSaved);
		setSaveLoading(true);

		try {
			const res = await postService.toggleBookmark(post.id);
			setSaved(res.data.bookmarked);
			toast.success(res.data.bookmarked ? "Đã lưu bài viết." : "Đã bỏ lưu bài viết.");
		} catch {
			setSaved(wasSaved);
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setSaveLoading(false);
		}
	};

	const handleTogglePin = async () => {
		if (!post || pinLoading) return;
		closePostMenu();
		const nextPinned = !post.is_pinned;
		setPost((prev) => (prev ? { ...prev, is_pinned: nextPinned } : prev));
		setPinLoading(true);

		try {
			await postService.updatePost(post.id, { isPinned: nextPinned });
			toast.success(
				nextPinned ? "Đã ghim bài viết lên trang cá nhân." : "Đã bỏ ghim bài viết.",
			);
		} catch {
			setPost((prev) => (prev ? { ...prev, is_pinned: !nextPinned } : prev));
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setPinLoading(false);
		}
	};

	const handleToggleArchive = async () => {
		if (!post || archiveLoading) return;
		closePostMenu();
		const nextStatus = isArchived ? "published" : "archived";
		const previousStatus = post.status;
		setPost((prev) => (prev ? { ...prev, status: nextStatus } : prev));
		setArchiveLoading(true);

		try {
			await postService.updatePost(post.id, { status: nextStatus });
			toast.success(
				nextStatus === "archived" ? "Đã lưu trữ bài viết." : "Đã khôi phục bài viết.",
			);
		} catch {
			setPost((prev) => (prev ? { ...prev, status: previousStatus } : prev));
			toast.error("Không thể thực hiện. Vui lòng thử lại.");
		} finally {
			setArchiveLoading(false);
		}
	};

	const handlePrivacySaved = (visibility: "public" | "members" | "private") => {
		setPost((prev) => (prev ? { ...prev, visibility } : prev));
	};

	const handleCopyPostLink = async () => {
		const url = `${window.location.origin}/cong-dong/bai-viet/${post?.id}`;
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url);
			} else {
				const ta = document.createElement("textarea");
				ta.value = url;
				ta.style.cssText = "position:fixed;top:-9999px;left:-9999px";
				document.body.appendChild(ta);
				ta.select();
				document.execCommand("copy");
				document.body.removeChild(ta);
			}
			setCopiedLink(true);
			toast.success("Đã sao chép liên kết bài viết.");
			setTimeout(() => setCopiedLink(false), 2000);
		} catch {
			toast.error("Không thể sao chép liên kết.");
		}
	};

	const handleDeletePost = async () => {
		if (!post || deleteLoading) return;
		setDeleteLoading(true);

		try {
			await postService.deletePost(post.id);
			toast.success("Đã xóa bài viết.");
			setShowDeleteConfirm(false);
			navigate("/cong-dong", { replace: true });
		} catch {
			toast.error("Không thể xóa. Vui lòng thử lại.");
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleSubmitComment = async () => {
		if (!commentText.trim() || submittingComment) return;
		setSubmittingComment(true);
		try {
			const res = await postService.createComment(Number(id), commentText.trim());
			const newComment: PostComment = { ...res.data, replies: [] };
			setComments((prev) => [...prev, newComment]);
			setCommentText("");
			setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev));
			toast.success("Đã đăng bình luận!");
		} catch {
			toast.error("Không thể gửi bình luận. Vui lòng thử lại.");
		} finally {
			setSubmittingComment(false);
		}
	};

	const handleReplyAdded = (parentId: number, reply: PostComment) => {
		setComments((prev) =>
			prev.map((c) =>
				c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c,
			),
		);
		setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev));
	};

	return (
		<div className='community-content'>
			<main className='community-feed min-w-0 px-4 pb-12 md:px-4 md:pt-5'>
				{/* Mobile top bar */}
				<div className='sticky top-16 z-30 -mx-3 mb-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 md:hidden'>
					<button
						onClick={() => setIsSidebarOpen(true)}
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
						aria-label='Mở menu cộng đồng'>
						<Menu className='h-5 w-5' />
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
					<h1 className='font-heading text-xl font-extrabold text-black'>Bài viết</h1>
				</div>

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

				{!postError && (
					<article className='rounded-2xl border-2 border-black bg-white p-5 md:p-7'>
						{postLoading ? (
							<DetailSkeleton />
						) : post ? (
							<>
								<div className='mb-5 flex items-start justify-between gap-3'>
									<div className='flex items-center gap-3'>
										<div className='relative shrink-0'>
											<Link to={authorProfileUrl ?? "#"}>
												<img
													src={authorAvatar}
													alt={authorName}
													className='h-12 w-12 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
												/>
											</Link>
										</div>
										<div>
											<div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
												<Link
													to={authorProfileUrl ?? "#"}
													className='font-heading text-base font-extrabold text-black hover:underline'>
													{authorName}
												</Link>
												<span className='text-sm text-gray-500'>
													{authorHandle}
												</span>
												<span className='text-sm text-gray-400'>
													· {createdAt}
												</span>
											</div>
											<Link
												to={`/cong-dong/${channelSlug}`}
												className='mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-lime-700 transition hover:text-black'>
												<Hash className='h-3 w-3' />
												{channelName}
											</Link>
										</div>
									</div>
									<div className='relative shrink-0'>
										<button
											ref={menuBtnRef}
											onClick={handleTogglePostMenu}
											className={`shrink-0 rounded-lg border-2 p-1.5 transition ${showPostMenu ? "border-black bg-gray-100" : "border-transparent hover:border-black hover:bg-gray-100"}`}
											aria-label='Tùy chọn'>
											<MoreHorizontal className='h-5 w-5 text-gray-500' />
										</button>
										{showPostMenu && (
											<div
												ref={menuDropdownRef}
												className='absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-xl border-2 border-black bg-white p-2 shadow-[4px_4px_0_#111]'>
												{isOwnPost ? (
													<>
														<button
															onClick={handleTogglePin}
															disabled={pinLoading}
															className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100 disabled:opacity-60'>
															<Pin className='h-4 w-4' />
															{post.is_pinned ? "Bỏ ghim" : "Ghim"}
														</button>
														<button
															onClick={() => {
																closePostMenu();
																navigate(
																	`/cong-dong/bai-viet/${post.id}/chinh-sua`,
																);
															}}
															className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
															<Pencil className='h-4 w-4' />
															Chỉnh sửa
														</button>
														<button
															onClick={() => {
																closePostMenu();
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
																? isArchived
																	? "Đang khôi phục..."
																	: "Đang lưu trữ..."
																: isArchived
																	? "Bỏ lưu trữ"
																	: "Lưu trữ"}
														</button>
														<button
															onClick={() => {
																closePostMenu();
																setShowDeleteConfirm(true);
															}}
															className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50'>
															<Trash2 className='h-4 w-4' />
															Xóa
														</button>
													</>
												) : (
													<>
														<button
															onClick={() => {
																closePostMenu();
																handleToggleSaved();
															}}
															disabled={saveLoading}
															className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100 disabled:opacity-60'>
															<Bookmark
																className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
															/>
															{saved ? "Bỏ lưu" : "Lưu"}
														</button>
														<button
															onClick={() => {
																if (!requireAuthenticatedUser())
																	return;
																closePostMenu();
																setShowReportModal(true);
															}}
															className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50'>
															<Flag className='h-4 w-4' />
															Báo cáo
														</button>
													</>
												)}
											</div>
										)}
									</div>
								</div>

								<h1 className='mb-4 font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
									{post.title}
								</h1>

								{post.content && (
									<div className='so-editor-outer community-markdown'>
										<div
											className='s-prose'
											dangerouslySetInnerHTML={{
												__html: renderedPostContent,
											}}
										/>
									</div>
								)}

								{post.media_urls.length > 0 && (
									<div className='mt-5 space-y-3'>
										{post.media_urls.map((url, i) => (
											<div
												key={i}
												className='overflow-hidden rounded-[10px] border-2 border-black bg-white'>
												{isVideoMediaUrl(url) ? (
													<video
														src={url}
														className='w-full bg-black object-cover'
														controls
														preload='metadata'
													/>
												) : (
													<img
														src={url}
														alt={`media-${i + 1}`}
														className='w-full object-cover'
													/>
												)}
											</div>
										))}
									</div>
								)}

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

								<div className='mt-5 flex flex-wrap items-center gap-2 border-t-2 border-black pt-4'>
									<button
										onClick={async () => {
											if (!user) {
												navigate("/login", {
													state: {
														from: location.pathname + location.search,
													},
												});
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
												const res = await postService.toggleReaction(
													post.id,
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
										className='inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'
										style={{
											background: liked ? "var(--color-pastel-pink)" : "#fff",
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
										{post.comments_count}
									</button>

									<button
										onClick={handleToggleSaved}
										disabled={saveLoading}
										className='inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'
										style={{
											background: saved ? "var(--color-primary)" : "#fff",
										}}
										aria-label='Lưu bài viết'>
										<Bookmark
											className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
										/>
									</button>

									<button
										onClick={handleCopyPostLink}
										className='inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
										aria-label='Sao chép liên kết bài viết'>
										{copiedLink ? (
											<Check className='h-4 w-4 text-lime-600' />
										) : (
											<Share2 className='h-4 w-4' />
										)}
									</button>
								</div>
							</>
						) : null}
					</article>
				)}

				{!postError && (
					<section id='comments' className='mt-6'>
						<div className='mb-4 flex items-center gap-3'>
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
										state={{ from: location.pathname + location.search }}
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
										postId={Number(id)}
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
			</main>

			<aside className='community-right-rail'>
				<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5'>
					{/* Author Profile Card */}
					{postLoading ? (
						<section className='neo-card neo-card-static animate-pulse bg-white p-5'>
							<div className='flex flex-col gap-3'>
								<div className='h-16 w-16 rounded-full bg-gray-200' />
								<div className='h-4 w-28 rounded bg-gray-200' />
								<div className='h-3 w-20 rounded bg-gray-200' />
							</div>
							<div className='mt-4 space-y-2'>
								<div className='h-10 w-full rounded-lg bg-gray-200' />
								<div className='h-10 w-full rounded-lg bg-gray-200' />
							</div>
						</section>
					) : post?.user ? (
						<section className='neo-card neo-card-static bg-white p-5'>
							{/* Avatar + Name row */}
							<div className='flex items-center gap-4'>
								<Link to={authorProfileUrl ?? "#"} className='shrink-0'>
									<img
										src={authorAvatar}
										alt={authorName}
										className='h-14 w-14 rounded-full border-2 border-black object-cover'
									/>
								</Link>
								<div className='min-w-0'>
									<Link
										to={authorProfileUrl ?? "#"}
										className='font-heading text-base font-extrabold leading-snug text-black hover:underline'>
										{authorName}
									</Link>
									<p className='text-sm text-gray-500'>{authorHandle}</p>
								</div>
							</div>

							{/* Bio / student code */}
							{post.user.student_code && (
								<p className='mt-3 text-sm text-gray-700'>
									{post.user.student_code}
								</p>
							)}

							{/* Stats */}
							<div className='mt-3 flex gap-4 border-t-2 border-gray-200 pt-3 text-sm'>
								<span className='whitespace-nowrap'>
									<strong className='font-extrabold text-black'>
										{authorStats?.posts_count ?? 0}
									</strong>{" "}
									<span className='text-gray-500'>Bài viết</span>
								</span>
								<span className='whitespace-nowrap'>
									<strong className='font-extrabold text-black'>
										{authorStats?.followers_count ?? 0}
									</strong>{" "}
									<span className='text-gray-500'>Theo dõi</span>
								</span>
								<span className='whitespace-nowrap'>
									<strong className='font-extrabold text-black'>
										{authorStats?.following_count ?? 0}
									</strong>{" "}
									<span className='text-gray-500'>Đang theo</span>
								</span>
							</div>

							{/* Actions */}
							<div className='mt-4 space-y-2'>
								{!isOwnPost && (
									<button
										onClick={handleToggleFollow}
										disabled={followLoading}
										className={`inline-flex h-10 w-full items-center justify-center rounded-lg border-2 border-black font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-60 ${followed ? "bg-white" : "bg-[var(--color-primary)]"}`}>
										{followed ? "Bỏ theo dõi" : "Theo dõi"}
									</button>
								)}
								<Link
									to={buildProfileUrl(post.user.username, post.user.email)}>
									<button className='inline-flex h-10 w-full items-center justify-center rounded-lg border-2 border-black bg-white font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
										Xem trang cá nhân
									</button>
								</Link>
							</div>
						</section>
					) : null}

					{/* Community Guidelines */}
					<button
						type='button'
						className='neo-card neo-card-static mt-5 flex w-full cursor-pointer items-center gap-3 bg-white p-3 text-left transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'
						aria-label='Review our Code of Conduct'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='40'
							height='41'
							viewBox='0 0 40 41'
							fill='none'
							className='h-10 w-10 shrink-0'
							aria-hidden='true'>
							<path
								d='M10 5.55176H33.3334V8.88509H36.6667V18.8851H33.3334V32.2184H30V35.5518H6.66671V32.2184H3.33337V28.8851V25.5518H6.66671V8.88509H10V5.55176Z'
								fill='#FEF08A'
							/>
							<path
								fillRule='evenodd'
								clipRule='evenodd'
								d='M10 5.55176H33.3334V8.88509H36.6667V18.8851H33.3334V32.2184H30V8.88509H10V5.55176ZM23.3334 28.8851V25.5518H10V8.88509H6.66671V25.5518H3.33337V28.8851V32.2184H6.66671V35.5518H30V32.2184L26.6667 32.2184V28.8851H23.3334ZM23.3334 28.8851V32.2184H6.66671V28.8851H23.3334Z'
								fill='#713F12'
							/>
							<rect
								x='13.3334'
								y='18.8853'
								width='13.3333'
								height='3.33333'
								fill='#020617'
							/>
							<rect
								x='13.3334'
								y='12.2183'
								width='13.3333'
								height='3.33333'
								fill='#020617'
							/>
							<rect
								x='6.66663'
								y='28.8853'
								width='16.6667'
								height='3.33333'
								fill='#EAB308'
							/>
						</svg>

						<span className='min-w-0 flex-1'>
							<span className='block truncate font-heading text-sm font-extrabold leading-5 text-slate-950'>
								Quy tắc cộng đồng
							</span>
							<span className='block truncate text-xs font-semibold leading-5 text-slate-500'>
								Hãy tôn trọng lẫn nhau!
							</span>
						</span>

						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='24'
							height='25'
							viewBox='0 0 24 25'
							fill='none'
							className='h-6 w-6 shrink-0 rotate-180'
							aria-hidden='true'>
							<path
								fillRule='evenodd'
								clipRule='evenodd'
								d='M16 5.55176L16 7.55176L14 7.55176L14 5.55176L16 5.55176ZM12 9.55176L12 7.55176L14 7.55176L14 9.55176L12 9.55176ZM10 11.5518L10 9.55176L12 9.55176L12 11.5518L10 11.5518ZM10 13.5518L8 13.5518L8 11.5518L10 11.5518L10 13.5518ZM12 15.5518L12 13.5518L10 13.5518L10 15.5518L12 15.5518ZM12 15.5518L14 15.5518L14 17.5518L12 17.5518L12 15.5518ZM16 19.5518L16 17.5518L14 17.5518L14 19.5518L16 19.5518Z'
								fill='#64748B'
							/>
						</svg>
					</button>

					<p className='mt-5 px-1 text-xs text-gray-400 text-center'>
						© 2026 CKC IT CLUB · Điều khoản · Bảo mật
					</p>
				</div>
			</aside>

			{post && showPrivacyModal && (
				<PrivacyPostModal
					postId={post.id}
					currentVisibility={currentVisibility}
					onClose={() => setShowPrivacyModal(false)}
					onSaved={handlePrivacySaved}
				/>
			)}

			{post && showDeleteConfirm && (
				<DeletePostConfirm
					postTitle={post.title}
					deleting={deleteLoading}
					onClose={() => setShowDeleteConfirm(false)}
					onConfirm={handleDeletePost}
				/>
			)}

			{post && showReportModal && (
				<ReportPostModal
					postId={post.id}
					onClose={() => setShowReportModal(false)}
					isAlreadyReported={hasReported}
					onSuccess={() => setHasReported(true)}
				/>
			)}
		</div>
	);
};

export default CommunityPostDetailPage;
