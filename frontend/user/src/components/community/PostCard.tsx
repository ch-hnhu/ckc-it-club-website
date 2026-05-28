import React, { useState } from "react";
import { Bookmark, Heart, MessageCircle, Share2, Zap } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Post } from "@/types/post.types";
import type { AuthUser } from "@/services/auth.service";
import { postService } from "@/services/post.service";
import { buildAvatar, formatRelativeTime, getHandle } from "@/lib/utils";

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
	const detailUrl = `/cong-dong/bai-viet/${post.id}`;

	const [liked, setLiked] = useState(post.my_reaction === "heart");
	const [heartCount, setHeartCount] = useState(post.reactions_count);
	const [loading, setLoading] = useState(false);

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

	return (
		<article className='rounded-2xl border-2 border-black bg-white p-4'>
			<div className='mb-3 flex items-center gap-3'>
				<div className='relative'>
					<img
						src={authorAvatar}
						alt={authorName}
						className='h-10 w-10 rounded-full border-2 border-black bg-[var(--color-pastel-blue)] object-cover'
					/>
					{post.is_pinned && (
						<span className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)] text-black'>
							<Zap className='h-3 w-3 fill-current' />
						</span>
					)}
				</div>
				<div className='min-w-0'>
					<div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
						<p className='font-heading text-sm font-extrabold text-black'>{authorName}</p>
						<span className='text-sm font-medium text-gray-500'>{authorHandle}</span>
						<span className='text-sm text-gray-400'>
							· {formatRelativeTime(post.created_at)}
						</span>
					</div>
					{post.channel && (
						<p className='text-xs font-bold text-lime-700'># {post.channel.name}</p>
					)}
				</div>
			</div>

			<Link to={detailUrl}>
				<h2 className='mb-3 font-heading text-lg font-extrabold leading-tight text-black hover:underline md:text-xl'>
					{post.title}
				</h2>
			</Link>

			{post.excerpt && (
				<p className='max-w-3xl text-sm leading-6 text-gray-700'>{post.excerpt}</p>
			)}

			{post.featured_image && (
				<Link to={detailUrl}>
					<div className='mt-4 overflow-hidden rounded-[10px] border-2 border-black bg-[var(--color-pastel-yellow)]'>
						<img
							src={post.featured_image}
							alt={post.title}
							className='aspect-[16/9] w-full object-cover'
						/>
					</div>
				</Link>
			)}

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
					className='inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
					aria-label='Lưu bài viết'>
					<Bookmark className='h-4 w-4' />
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
