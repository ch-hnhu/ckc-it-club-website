import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	Archive,
	Bookmark,
	Flag,
	Heart,
	LockKeyhole,
	MessageCircle,
	MoreHorizontal,
	Pencil,
	Pin,
	Share2,
	Trash2,
	Zap,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Post } from "@/types/post.types";
import type { AuthUser } from "@/services/auth.service";
import { postService } from "@/services/post.service";
import { buildAvatar, buildProfileUrl, formatRelativeTime, getHandle, isVideoMediaUrl } from "@/lib/utils";
import { renderMarkdownContent, renderMarkdownPreview } from "@/lib/markdown";

interface PostCardProps {
	post: Post;
	user: AuthUser | null;
}

const PostCard: React.FC<PostCardProps> = ({ post, user }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const authorName = post.user?.full_name ?? "Ẩn danh";
	const authorHandle = post.user ? getHandle(post.user.username, post.user.email) : "@ẩn danh";
	const authorAvatar = buildAvatar(post.user?.full_name, post.user?.avatar);
	const authorProfileUrl = post.user ? buildProfileUrl(post.user.username, post.user.email) : null;
	const detailUrl = `/cong-dong/bai-viet/${post.id}`;
	const sourceContent = post.content ?? post.excerpt;
	const preview = sourceContent ? renderMarkdownPreview(sourceContent, 260) : null;
	const hasExpandableContent = Boolean(preview?.didTruncate && post.content);
	const isOwnPost = Boolean(user?.id && post.user?.id && Number(user.id) === post.user.id);

	const [liked, setLiked] = useState(post.my_reaction === "heart");
	const [heartCount, setHeartCount] = useState(post.reactions_count);
	const [loading, setLoading] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [saved, setSaved] = useState(false);
	const [showPostMenu, setShowPostMenu] = useState(false);

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
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showPostMenu]);

	const renderedDisplayContent =
		isExpanded && post.content ? renderMarkdownContent(post.content) : (preview?.html ?? "");

	const handleLike = async () => {
		if (!user) {
			navigate("/login", { state: { from: location.pathname + location.search } });
			return;
		}
		if (loading) return;

		// Optimistic update
		const wasLiked = liked;
		setLiked(!wasLiked);
		setHeartCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
		setLoading(true);

		try {
			const res = await postService.toggleReaction(post.id, "heart");
			setLiked(res.data.my_reaction === "heart");
			setHeartCount(res.data.reactions_count);
		} catch {
			setLiked(wasLiked);
			setHeartCount((c) => (wasLiked ? c + 1 : Math.max(0, c - 1)));
		} finally {
			setLoading(false);
		}
	};

	const closePostMenu = () => setShowPostMenu(false);

	const requireAuthenticatedUser = () => {
		if (user) return true;
		closePostMenu();
		navigate("/login", { state: { from: location.pathname + location.search } });
		return false;
	};

	const handleToggleSaved = () => {
		if (!requireAuthenticatedUser()) return;
		const nextSaved = !saved;
		setSaved(nextSaved);
		toast.success(nextSaved ? "Đã lưu bài viết." : "Đã bỏ lưu bài viết.");
	};

	const handleUnavailablePostAction = (message: string) => {
		closePostMenu();
		toast.info(message);
	};

	return (
		<article className='rounded-2xl border-2 border-black bg-white p-4'>
			<div className='mb-3 flex items-start justify-between gap-3'>
				<div className='flex min-w-0 items-center gap-3'>
					<Link
						to={authorProfileUrl ?? "#"}
						className='relative shrink-0'
						onClick={(e) => !authorProfileUrl && e.preventDefault()}>
						<img
							src={authorAvatar}
							alt={authorName}
							className='h-10 w-10 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover transition hover:opacity-80'
						/>
						{post.is_pinned && (
							<span className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)] text-black'>
								<Zap className='h-3 w-3 fill-current' />
							</span>
						)}
					</Link>
					<div className='min-w-0'>
						<div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
							<Link
								to={authorProfileUrl ?? "#"}
								onClick={(e) => !authorProfileUrl && e.preventDefault()}
								className='font-heading text-sm font-extrabold text-black hover:underline'>
								{authorName}
							</Link>
							<span className='text-sm font-medium text-gray-500'>
								{authorHandle}
							</span>
							<span className='text-sm text-gray-400'>
								· {formatRelativeTime(post.created_at)}
							</span>
						</div>
						{post.channel && (
							<p className='text-xs font-bold text-lime-700'># {post.channel.name}</p>
						)}
					</div>
				</div>

				<div className='relative shrink-0'>
					<button
						ref={menuBtnRef}
						onClick={() => setShowPostMenu((current) => !current)}
						className={`shrink-0 rounded-lg border-2 p-1.5 transition ${
							showPostMenu
								? "border-black bg-gray-100"
								: "border-transparent hover:border-black hover:bg-gray-100"
						}`}
						aria-label='Tùy chọn bài viết'>
						<MoreHorizontal className='h-5 w-5 text-gray-500' />
					</button>
					{showPostMenu && (
						<div
							ref={menuDropdownRef}
							className='absolute right-0 top-full z-20 mt-1 min-w-[12rem] rounded-xl border-2 border-black bg-white p-2 shadow-[4px_4px_0_#111]'>
							{isOwnPost ? (
								<>
									<button
										onClick={() =>
											handleUnavailablePostAction(
												post.is_pinned
													? "Chức năng bỏ ghim khỏi trang cá nhân đang được phát triển."
													: "Chức năng ghim lên trang cá nhân đang được phát triển.",
											)
										}
										className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
										<Pin className='h-4 w-4' />
										{post.is_pinned ? "Bỏ ghim" : "Ghim"}
									</button>
									<button
										onClick={() =>
											handleUnavailablePostAction(
												"Chức năng chỉnh sửa bài viết đang được phát triển.",
											)
										}
										className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
										<Pencil className='h-4 w-4' />
										Chỉnh sửa
									</button>
									<button
										onClick={() =>
											handleUnavailablePostAction(
												"Chức năng đổi quyền riêng tư đang được phát triển.",
											)
										}
										className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
										<LockKeyhole className='h-4 w-4' />
										Quyền riêng tư
									</button>
									<button
										onClick={() =>
											handleUnavailablePostAction(
												"Chức năng lưu trữ bài viết đang được phát triển.",
											)
										}
										className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
										<Archive className='h-4 w-4' />
										Lưu trữ
									</button>
									<button
										onClick={() =>
											handleUnavailablePostAction(
												"Chức năng xóa bài viết đang được phát triển.",
											)
										}
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
										className='flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-black transition hover:bg-gray-100'>
										<Bookmark
											className={`h-4 w-4 ${saved ? "fill-current" : ""}`}
										/>
										{saved ? "Bỏ lưu" : "Lưu"}
									</button>
									<button
										onClick={() => {
											if (!requireAuthenticatedUser()) return;
											handleUnavailablePostAction(
												"Chức năng báo cáo đang được phát triển.",
											);
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

			<Link to={detailUrl}>
				<h2 className='mb-3 font-heading text-lg font-extrabold leading-tight text-black hover:underline md:text-xl'>
					{post.title}
				</h2>
			</Link>

			{sourceContent && renderedDisplayContent && (
				<div
					className={`so-editor-outer community-markdown ${
						isExpanded ? "community-markdown-feed-full" : "community-markdown-excerpt"
					}`}>
					<div
						className='s-prose'
						dangerouslySetInnerHTML={{ __html: renderedDisplayContent }}
					/>
					{hasExpandableContent && (
						<button
							type='button'
							onClick={() => setIsExpanded((current) => !current)}
							className='mt-1 inline-flex text-sm font-extrabold text-lime-700 transition hover:text-black'>
							{isExpanded ? "Thu gọn" : "Xem thêm"}
						</button>
					)}
				</div>
			)}

			{post.featured_image &&
				(isVideoMediaUrl(post.featured_image) ? (
					<div className='mt-4 overflow-hidden rounded-[10px] border-2 border-black bg-white'>
						<video
							src={post.featured_image}
							className='aspect-[16/9] w-full bg-black object-cover'
							controls
							preload='metadata'
						/>
					</div>
				) : (
					<Link to={detailUrl}>
						<div className='mt-4 overflow-hidden rounded-[10px] border-2 border-black bg-white'>
							<img
								src={post.featured_image}
								alt={post.title}
								className='aspect-[16/9] w-full object-cover'
							/>
						</div>
					</Link>
				))}

			{post.tags.length > 0 && (
				<div className='mt-4 flex flex-wrap gap-2'>
					{post.tags.map((tag) => (
						<span
							key={tag}
							className='rounded-lg border-2 border-black bg-[var(--color-pastel-blue)] px-2.5 py-1 text-xs font-bold text-black'>
							#{tag}
						</span>
					))}
				</div>
			)}

			<div className='mt-4 flex flex-wrap items-center gap-2 border-t-2 border-black pt-3 text-black'>
				<button
					onClick={handleLike}
					disabled={loading}
					className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'
					style={{ background: liked ? "var(--color-pastel-pink)" : "#fff" }}>
					<Heart className={`h-4 w-4 ${liked ? "fill-current text-red-500" : ""}`} />
					{heartCount}
				</button>

				<Link
					to={detailUrl}
					className='inline-flex h-9 items-center gap-2 rounded-lg border-2 border-black bg-white px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					<MessageCircle className='h-4 w-4' />
					{post.comments_count}
				</Link>

				<button
					onClick={handleToggleSaved}
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

export default PostCard;
