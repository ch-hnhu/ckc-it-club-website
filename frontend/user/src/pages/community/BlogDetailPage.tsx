import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	ArrowLeft,
	Bookmark,
	Eye,
	Heart,
	MessageCircle,
	MoreHorizontal,
	Send,
	Share2,
} from "lucide-react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { blogService } from "@/services/blog.service";
import type { BlogDetail, BlogComment } from "@/types/blog.types";
import { buildAvatar, formatRelativeTime, getHandle } from "@/lib/utils";

// ─── Skeletons ────────────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
	<div className='animate-pulse space-y-5'>
		<div className='aspect-[21/9] w-full rounded-xl bg-gray-200' />
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

// ─── Tag colors ───────────────────────────────────────────────────────────────

const TAG_BG = [
	"bg-[var(--color-pastel-green)]",
	"bg-[var(--color-pastel-blue)]",
	"bg-[var(--color-pastel-pink)]",
	"bg-[var(--color-pastel-yellow)]",
	"bg-[var(--color-pastel-purple)]",
];

// ─── CommentItem ──────────────────────────────────────────────────────────────

interface CommentItemProps {
	comment: BlogComment;
	depth?: number;
	blogId: number;
	user: AuthUser | null;
	onReplyAdded: (parentId: number, reply: BlogComment) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
	comment,
	depth = 0,
	blogId,
	user,
	onReplyAdded,
}) => {
	const navigate = useNavigate();
	const [liked, setLiked] = useState(false);
	const [likeCount, setLikeCount] = useState(comment.reactions_count);
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
		<div className={depth > 0 ? "ml-11 mt-3" : ""}>
			<div className='flex gap-3'>
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
							onClick={() => {
								setLiked((p) => {
									setLikeCount((c) => (p ? c - 1 : c + 1));
									return !p;
								});
							}}
							className={`flex items-center gap-1 text-xs font-bold transition ${liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
							<span className='text-sm leading-none'>{liked ? "❤️" : "🤍"}</span>
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

	const [commentText, setCommentText] = useState("");
	const [submittingComment, setSubmittingComment] = useState(false);
	const commentInputRef = useRef<HTMLTextAreaElement>(null);

	const userDisplayName = user?.name || user?.email || "CKC member";
	const userAvatar =
		user?.picture ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=A3E635&color=111111&bold=true`;

	useEffect(() => {
		if (!slug) return;
		setBlogLoading(true);
		setBlogError(null);
		blogService
			.getBlog(slug)
			.then((res) => {
				setBlog(res.data);
				setLiked(res.data.my_reaction === "heart");
				setHeartCount(res.data.reactions_count);
			})
			.catch(() => setBlogError("Không tìm thấy bài viết."))
			.finally(() => setBlogLoading(false));
	}, [slug]);

	useEffect(() => {
		if (!blog?.id) return;
		setCommentsLoading(true);
		blogService
			.getBlogComments(blog.id)
			.then((res) => setComments(res.data))
			.catch(() => setComments([]))
			.finally(() => setCommentsLoading(false));
	}, [blog?.id]);

	const authorName = blog?.user?.full_name ?? "CKC IT CLUB";
	const authorAvatar = buildAvatar(blog?.user?.full_name, blog?.user?.avatar);
	const publishedAt = blog?.published_at ?? blog?.created_at ?? "";

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

	return (
		<div className='w-full min-h-screen pb-12'>
			<main className='mx-auto w-full max-w-3xl px-4 pt-4 pb-12 md:px-6'>
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

				{/* Desktop back */}
				<div className='mb-5 hidden items-center gap-3 md:flex'>
					<button
						onClick={() => navigate(-1)}
						className='inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
						aria-label='Quay lại'>
						<ArrowLeft className='h-5 w-5' />
					</button>
					<Link
						to='/blog'
						className='font-heading text-sm font-bold text-gray-500 hover:text-black'>
						← Blog
					</Link>
				</div>

				{blogError && (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
						<p className='font-heading text-xl font-extrabold text-black'>
							{blogError}
						</p>
						<Link
							to='/blog'
							className='mt-5 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Quay lại Blog
						</Link>
					</div>
				)}

				{!blogError && (
					<article className='overflow-hidden rounded-2xl border-2 border-black bg-white'>
						{blogLoading ? (
							<div className='p-5 md:p-7'>
								<DetailSkeleton />
							</div>
						) : blog ? (
							<>
								{/* Cover image */}
								{blog.featured_image && (
									<div className='aspect-[21/9] w-full overflow-hidden border-b-2 border-black'>
										<img
											src={blog.featured_image}
											alt={blog.title}
											className='h-full w-full object-cover'
										/>
									</div>
								)}

								<div className='p-5 md:p-8'>
									{/* Tags */}
									{blog.tags.length > 0 && (
										<div className='mb-4 flex flex-wrap gap-2'>
											{blog.tags.map((tag, i) => (
												<span
													key={tag.id}
													className={`neo-tag ${TAG_BG[i % TAG_BG.length]}`}>
													{tag.name}
												</span>
											))}
										</div>
									)}

									{/* Title */}
									<h1 className='font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl lg:text-4xl'>
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
														<Eye className='h-3.5 w-3.5' />
														{blog.view_count} lượt xem
													</span>
												</div>
											</div>
										</div>
										<button
											className='shrink-0 rounded-lg border-2 border-transparent p-1.5 transition hover:border-black hover:bg-gray-100'
											aria-label='Tùy chọn'>
											<MoreHorizontal className='h-5 w-5 text-gray-500' />
										</button>
									</div>

									{/* Content */}
									{blog.content && (
										<div
											className='prose prose-sm mt-7 max-w-none leading-7 text-gray-800 [&_a]:text-lime-700 [&_a:hover]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-primary)] [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-extrabold [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-extrabold [&_img]:rounded-xl [&_img]:border-2 [&_img]:border-black [&_pre]:rounded-xl [&_pre]:border-2 [&_pre]:border-black [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:text-white [&_strong]:font-extrabold'
											dangerouslySetInnerHTML={{ __html: blog.content }}
										/>
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
											className='inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'
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
											onClick={() => setSaved((p) => !p)}
											className='inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
											style={{
												background: saved ? "var(--color-primary)" : "#fff",
											}}
											aria-label='Lưu bài viết'>
											<Bookmark
												className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
											/>
										</button>

										<button
											className='inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
											aria-label='Chia sẻ'>
											<Share2 className='h-4 w-4' />
										</button>
									</div>
								</div>
							</>
						) : null}
					</article>
				)}

				{/* Comments section */}
				{!blogError && (
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
									/>
								))
							)}
						</div>
					</section>
				)}
			</main>
		</div>
	);
};

export default BlogDetailPage;
