import React, { useState } from "react";
import { Eye, Heart, MessageCircle, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Blog } from "@/types/blog.types";
import { buildAvatar, formatRelativeTime } from "@/lib/utils";
import { blogService } from "@/services/blog.service";

interface BlogCardProps {
	blog: Blog;
	featured?: boolean;
	showPinnedBadge?: boolean;
	linkTo?: string;
	canPin?: boolean;
	onPinToggled?: (blogId: number, isPinned: boolean) => void;
}

const TAG_BG = [
	"bg-[var(--color-pastel-green)]",
	"bg-[var(--color-pastel-blue)]",
	"bg-[var(--color-pastel-pink)]",
	"bg-[var(--color-pastel-yellow)]",
	"bg-[var(--color-pastel-purple)]",
];

const Placeholder: React.FC<{ title: string; tall?: boolean }> = ({ title, tall }) => (
	<div
		className={`flex w-full items-center justify-center bg-[var(--color-pastel-green)] ${
			tall ? "aspect-[21/9]" : "aspect-[16/9]"
		}`}>
		<span className='font-heading text-5xl font-extrabold text-[var(--color-text-primary)] opacity-20'>
			{title.charAt(0).toUpperCase()}
		</span>
	</div>
);

export const BlogCard: React.FC<BlogCardProps> = ({
	blog,
	featured = false,
	showPinnedBadge = false,
	linkTo,
	canPin = false,
	onPinToggled,
}) => {
	const [isPinned, setIsPinned] = useState(blog.is_pinned ?? false);
	const [pinLoading, setPinLoading] = useState(false);

	const handleTogglePin = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (pinLoading) return;
		const next = !isPinned;
		setIsPinned(next);
		setPinLoading(true);
		try {
			await blogService.pinBlog(blog.id, next);
			toast.success(next ? "Đã ghim blog lên trang cá nhân." : "Đã bỏ ghim blog.");
			onPinToggled?.(blog.id, next);
		} catch (err: unknown) {
			setIsPinned(!next);
			const msg =
				(err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
				"Không thể thực hiện. Vui lòng thử lại.";
			toast.error(msg);
		} finally {
			setPinLoading(false);
		}
	};

	const authorName = blog.user?.full_name ?? "CKC IT CLUB";
	const authorAvatar = buildAvatar(blog.user?.full_name, blog.user?.avatar);
	const detailUrl = linkTo ?? `/blog/${blog.slug}`;
	const date = blog.published_at ?? blog.created_at;

	if (featured) {
		return (
			<Link to={detailUrl} className='group neo-card relative block overflow-hidden bg-white'>
				{showPinnedBadge && isPinned && (
					<span
						className='absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-primary text-black shadow-[2px_2px_0_#111]'
						aria-label='Blog đã ghim'
						title='Blog đã ghim'>
						<Pin className='h-4 w-4' />
					</span>
				)}
				{canPin && (
					<button
						onClick={handleTogglePin}
						disabled={pinLoading}
						className={`absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0_#111] transition disabled:opacity-60 ${
							isPinned
								? "bg-primary text-black"
								: "bg-white text-gray-500 hover:bg-gray-100"
						}`}
						aria-label={isPinned ? "Bỏ ghim blog" : "Ghim blog"}
						title={isPinned ? "Bỏ ghim" : "Ghim lên trang cá nhân"}>
						<Pin className='h-4 w-4' />
					</button>
				)}
				<div className='aspect-[21/9] overflow-hidden bg-gray-100'>
					{blog.featured_image ? (
						<img
							src={blog.featured_image}
							alt={blog.title}
							className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
						/>
					) : (
						<Placeholder title={blog.title} tall />
					)}
				</div>
				<div className='p-6 md:p-8'>
					{blog.tags.length > 0 && (
						<div className='mb-3 flex flex-wrap gap-2'>
							{blog.tags.slice(0, 3).map((tag, i) => (
								<span
									key={tag.id}
									className={`inline-block neo-tag uppercase text-[10px] bg-white ${TAG_BG[i % TAG_BG.length]}`}>
									{tag.name}
								</span>
							))}
						</div>
					)}
					<h2 className='font-heading text-2xl font-extrabold leading-tight text-black group-hover:text-[var(--color-text-primary)] md:text-3xl'>
						{blog.title}
					</h2>
					{blog.excerpt && (
						<p className='mt-3 line-clamp-2 text-base leading-7 text-gray-600'>
							{blog.excerpt}
						</p>
					)}
					<div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
						<div className='flex items-center gap-3'>
							<img
								src={authorAvatar}
								alt={authorName}
								className='h-9 w-9 rounded-full border-2 border-black object-cover'
							/>
							<div>
								<p className='font-heading text-sm font-extrabold text-black'>
									{authorName}
								</p>
								<p className='text-xs text-gray-500'>{formatRelativeTime(date)}</p>
							</div>
						</div>
						<div className='flex items-center gap-4 text-sm text-gray-500'>
							<span className='flex items-center gap-1.5'>
								<Heart className='h-4 w-4' />
								{blog.reactions_count}
							</span>
							<span className='flex items-center gap-1.5'>
								<MessageCircle className='h-4 w-4' />
								{blog.comments_count}
							</span>
							<span className='flex items-center gap-1.5'>
								<Eye className='h-4 w-4' />
								{blog.view_count}
							</span>
						</div>
					</div>
				</div>
			</Link>
		);
	}

	return (
		<Link
			to={detailUrl}
			className='group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-black bg-white'>
			{showPinnedBadge && isPinned && !canPin && (
				<span
					className='absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-primary text-black shadow-[2px_2px_0_#111]'
					aria-label='Blog đã ghim'
					title='Blog đã ghim'>
					<Pin className='h-4 w-4' />
				</span>
			)}
			{canPin && (
				<button
					onClick={handleTogglePin}
					disabled={pinLoading}
					className={`absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0_#111] transition disabled:opacity-60 ${
						isPinned
							? "bg-primary text-black"
							: "bg-white text-gray-500 hover:bg-gray-100"
					}`}
					aria-label={isPinned ? "Bỏ ghim blog" : "Ghim blog"}
					title={isPinned ? "Bỏ ghim" : "Ghim lên trang cá nhân"}>
					<Pin className='h-4 w-4' />
				</button>
			)}
			<div className='aspect-[16/9] overflow-hidden bg-gray-100'>
				{blog.featured_image ? (
					<img
						src={blog.featured_image}
						alt={blog.title}
						className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
					/>
				) : (
					<Placeholder title={blog.title} />
				)}
			</div>
			<div className='flex flex-1 flex-col p-5'>
				{blog.tags.length > 0 && (
					<div className='mb-3 flex flex-wrap gap-1.5'>
						{blog.tags.slice(0, 2).map((tag) => (
							<span
								key={tag.id}
								className={`inline-block neo-tag uppercase text-[10px] bg-green-50`}>
								{tag.name}
							</span>
						))}
					</div>
				)}
				<h3 className='line-clamp-2 font-heading text-lg font-extrabold leading-snug text-black group-hover:text-[var(--color-text-primary)] group-hover:underline'>
					{blog.title}
				</h3>
				{blog.excerpt && (
					<p className='mt-2 line-clamp-3 text-sm leading-6 text-gray-600'>
						{blog.excerpt}
					</p>
				)}
				<div className='min-h-5 flex-1' />
				<div className='flex items-center justify-between border-t-2 border-black pt-3'>
					<div className='flex min-w-0 items-center gap-2'>
						<img
							src={authorAvatar}
							alt={authorName}
							className='h-7 w-7 shrink-0 rounded-full border-2 border-black object-cover'
						/>
						<span className='truncate text-xs font-bold text-black'>{authorName}</span>
					</div>
					<div className='flex shrink-0 items-center gap-3 text-xs text-gray-500'>
						<span className='flex items-center gap-1'>
							<Heart className='h-3.5 w-3.5' />
							{blog.reactions_count}
						</span>
						<span className='flex items-center gap-1'>
							<MessageCircle className='h-3.5 w-3.5' />
							{blog.comments_count}
						</span>
						<span className='flex items-center gap-1'>
							<Eye className='h-3.5 w-3.5' />
							{blog.view_count}
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default BlogCard;
