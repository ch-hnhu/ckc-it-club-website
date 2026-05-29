import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, PenSquare, Search, X } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { blogService } from "@/services/blog.service";
import type { Blog, BlogTag } from "@/types/blog.types";
import BlogCard from "@/components/community/BlogCard";
import { buildAvatar } from "@/lib/utils";

// ─── Skeletons ────────────────────────────────────────────────────────────────

const FeaturedSkeleton: React.FC = () => (
	<div className='animate-pulse overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
		<div className='flex flex-col md:flex-row'>
			<div className='aspect-[4/3] bg-gray-200 md:aspect-auto md:min-h-[380px] md:w-[58%]' />
			<div className='flex flex-col justify-center p-8 md:flex-1 md:p-10'>
				<div className='mb-5 h-4 w-44 rounded bg-gray-200' />
				<div className='mb-3 h-9 w-full rounded-lg bg-gray-200' />
				<div className='mb-6 h-9 w-4/5 rounded-lg bg-gray-200' />
				<div className='space-y-2.5'>
					<div className='h-4 w-full rounded bg-gray-200' />
					<div className='h-4 w-5/6 rounded bg-gray-200' />
					<div className='h-4 w-4/5 rounded bg-gray-200' />
				</div>
				<div className='mt-8 h-11 w-36 rounded-lg bg-gray-200' />
			</div>
		</div>
	</div>
);

const CardSkeleton: React.FC = () => (
	<div className='animate-pulse overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
		<div className='aspect-[16/9] bg-gray-200' />
		<div className='p-5'>
			<div className='mb-3 h-5 w-16 rounded-lg bg-gray-200' />
			<div className='h-6 w-4/5 rounded-lg bg-gray-200' />
			<div className='mt-2 space-y-1.5'>
				<div className='h-3.5 w-full rounded bg-gray-200' />
				<div className='h-3.5 w-5/6 rounded bg-gray-200' />
			</div>
			<div className='mt-4 flex items-center gap-2 border-t-2 border-gray-200 pt-3'>
				<div className='h-7 w-7 rounded-full bg-gray-200' />
				<div className='h-3.5 w-24 rounded bg-gray-200' />
			</div>
		</div>
	</div>
);

// ─── Featured article ─────────────────────────────────────────────────────────

const TAG_BG = [
	"bg-[var(--color-pastel-green)]",
	"bg-[var(--color-pastel-blue)]",
	"bg-[var(--color-pastel-pink)]",
	"bg-[var(--color-pastel-yellow)]",
];

const FeaturedArticle: React.FC<{ blog: Blog }> = ({ blog }) => {
	const authorName = blog.user?.full_name ?? "CKC IT CLUB";
	const authorAvatar = buildAvatar(blog.user?.full_name, blog.user?.avatar);
	const date = blog.published_at ?? blog.created_at;
	const detailUrl = `/blog/${blog.slug}`;

	const formattedDate = new Date(date).toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

	return (
		<Link
			to={detailUrl}
			className='group block overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[5px_5px_0_#111] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none'>
			<div className='flex flex-col md:flex-row'>
				{/* Image — 58% width on desktop */}
				<div className='relative shrink-0 overflow-hidden md:w-[58%]'>
					{blog.featured_image ? (
						<img
							src={blog.featured_image}
							alt={blog.title}
							className='aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:aspect-auto md:h-full'
							style={{ minHeight: "380px" }}
						/>
					) : (
						<div
							className='flex aspect-[4/3] w-full items-center justify-center bg-[var(--color-pastel-green)] md:aspect-auto md:h-full'
							style={{ minHeight: "380px" }}>
							<span className='font-heading text-8xl font-extrabold text-[var(--color-text-primary)] opacity-20'>
								{blog.title.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
					{/* Tag badge over image */}
					{blog.tags.length > 0 && (
						<div className='absolute bottom-4 left-4'>
							<span
								className={`inline-block rounded border-2 border-black px-3 py-1 text-xs font-extrabold uppercase tracking-wider shadow-[2px_2px_0_#111] ${TAG_BG[0]}`}>
								{blog.tags[0].name}
							</span>
						</div>
					)}
				</div>

				{/* Text — 42% width on desktop */}
				<div className='flex flex-col justify-center p-7 md:flex-1 md:p-10 lg:p-12'>
					{/* Date · Author */}
					<div className='mb-4 flex items-center gap-2'>
						<span className='text-xs font-medium text-gray-400'>{formattedDate}</span>
						{blog.user && (
							<>
								<span className='text-gray-300'>·</span>
								<img
									src={authorAvatar}
									alt={authorName}
									className='h-5 w-5 rounded-full border border-gray-300 object-cover'
								/>
								<span className='text-xs font-semibold text-gray-600'>
									{authorName}
								</span>
							</>
						)}
					</div>

					{/* Title */}
					<h2 className='font-heading text-2xl font-extrabold leading-tight text-black group-hover:text-[var(--color-text-primary)] md:text-3xl lg:text-[2rem]'>
						{blog.title}
					</h2>

					{/* Excerpt */}
					{blog.excerpt && (
						<p className='mt-4 line-clamp-4 text-base leading-7 text-gray-600'>
							{blog.excerpt}
						</p>
					)}

					{/* CTA */}
					<div className='mt-7'>
						<span className='inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none'>
							Đọc ngay
							<ArrowRight className='h-4 w-4' />
						</span>
					</div>
				</div>
			</div>
		</Link>
	);
};

// ─── BlogFeedPage ─────────────────────────────────────────────────────────────

const BlogFeedPage: React.FC = () => {
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [activeTag, setActiveTag] = useState<string | null>(null);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleSearchChange = (value: string) => {
		setSearchInput(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setSearch(value.trim());
		}, 400);
	};

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		blogService
			.getBlogs({
				sort: "published_at",
				order: "desc",
				per_page: 13,
				...(search ? { search } : {}),
				...(activeTag ? { tag: activeTag } : {}),
			})
			.then((res) => {
				if (!cancelled) setBlogs(res.data);
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
	}, [search, activeTag]);

	const allTags = useMemo<BlogTag[]>(() => {
		const map = new Map<string, BlogTag>();
		blogs.forEach((b) => b.tags.forEach((t) => map.set(t.name, t)));
		return Array.from(map.values());
	}, [blogs]);

	const isFiltered = Boolean(search || activeTag);
	const featuredBlog = !isFiltered && blogs.length > 0 ? blogs[0] : null;
	const gridBlogs = featuredBlog ? blogs.slice(1) : blogs;

	return (
		<div className='w-full min-h-screen pb-12'>
			{/* ── Mobile header ── */}
			<div className='sticky top-16 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-[var(--color-surface)] px-4 md:hidden'>
				<h1 className='font-heading text-sm font-bold text-black'>✦ Blog</h1>
				{user && (
					<Link
						to='/cong-dong/dang-bai'
						className='inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary)] px-3 font-heading text-xs font-extrabold text-dark shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						<PenSquare className='h-3.5 w-3.5' strokeWidth={3} />
						Viết bài
					</Link>
				)}
			</div>

			{/* ── Hero banner ── */}
			<div className='relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden border-b-2 border-black bg-[#111] px-6 py-14 md:min-h-[300px] md:py-20'>
				<span className='pointer-events-none absolute top-4 left-8 select-none text-2xl text-[var(--color-primary)] opacity-60'>
					✦
				</span>
				<span className='pointer-events-none absolute top-7 right-14 select-none text-sm text-white opacity-20'>
					+
				</span>
				<span className='pointer-events-none absolute right-1/4 bottom-4 select-none text-base text-white opacity-15'>
					✦
				</span>
				<span className='pointer-events-none absolute top-1/2 right-6 -translate-y-1/2 select-none text-4xl text-[var(--color-primary)] opacity-20'>
					✦
				</span>
				<span className='pointer-events-none absolute bottom-5 left-1/3 select-none text-sm text-white opacity-15'>
					+
				</span>
				<span className='pointer-events-none absolute top-3 left-1/2 select-none text-xs text-[var(--color-primary)] opacity-30'>
					✦
				</span>

				<div className='relative text-center'>
					<div className='inline-block rounded-xl border-2 border-[var(--color-primary)] bg-[#1d1d0f] px-7 py-3.5 shadow-[4px_4px_0_var(--color-primary)]'>
						<h1
							className='font-heading text-2xl font-extrabold text-[var(--color-primary)] md:text-4xl'
							style={{ letterSpacing: "0.2em" }}>
							CKC IT BLOG
						</h1>
					</div>
					<p className='mt-4 text-sm font-medium text-gray-400 md:text-base'>
						Tin tức, hướng dẫn và chia sẻ từ cộng đồng CKC IT CLUB
					</p>
					{user && (
						<Link
							to='/cong-dong/dang-bai'
							className='mt-5 hidden items-center gap-2 rounded-lg border-2 border-[var(--color-primary)] bg-transparent px-5 py-2.5 font-heading text-sm font-extrabold text-[var(--color-primary)] shadow-[3px_3px_0_var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-black md:inline-flex'>
							<PenSquare className='h-4 w-4' strokeWidth={3} />
							Viết bài ngay
						</Link>
					)}
				</div>
			</div>

			{/* ── Filter row ── */}
			<div className='border-b-2 border-black bg-white px-4 py-4 md:px-8'>
				<div className='mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center'>
					{/* Search with focus glow */}
					<div className='group/search relative shrink-0 sm:w-64'>
						<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within/search:text-[var(--color-primary)]' />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder='Tìm kiếm...'
							className='w-full rounded-xl border-2 border-black bg-white py-2 pl-10 pr-9 text-sm font-medium text-black outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(163,230,53,0.25)]'
						/>
						{searchInput && (
							<button
								onClick={() => {
									setSearchInput("");
									setSearch("");
								}}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-black'>
								<X className='h-3.5 w-3.5' />
							</button>
						)}
					</div>

					{/* Divider */}
					<div className='hidden h-6 w-px bg-gray-200 sm:block' />

					{/* Tag chips */}
					<div className='no-scrollbar flex flex-1 gap-2 overflow-x-auto pb-0.5'>
						<button
							onClick={() => setActiveTag(null)}
							className={`inline-flex shrink-0 items-center rounded-full border-2 border-black px-4 py-1.5 text-xs font-bold transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
								!activeTag
									? "bg-[var(--color-primary)] shadow-[2px_2px_0_#111]"
									: "bg-white text-gray-700 shadow-[2px_2px_0_#111] hover:bg-gray-50"
							}`}>
							Tất cả
						</button>
						{allTags.map((tag) => (
							<button
								key={tag.id}
								onClick={() =>
									setActiveTag(activeTag === tag.name ? null : tag.name)
								}
								className={`inline-flex shrink-0 items-center rounded-full border-2 border-black px-4 py-1.5 text-xs font-bold transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
									activeTag === tag.name
										? "bg-[var(--color-primary)] shadow-[2px_2px_0_#111]"
										: "bg-white text-gray-700 shadow-[2px_2px_0_#111] hover:bg-gray-50"
								}`}>
								{tag.name}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* ── Content ── */}
			<div className='mx-auto max-w-5xl px-4 pt-8 md:px-8'>
				{loading ? (
					<div className='space-y-8'>
						<FeaturedSkeleton />
						<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
							{Array.from({ length: 6 }).map((_, i) => (
								<CardSkeleton key={i} />
							))}
						</div>
					</div>
				) : error ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
						<p className='font-heading text-xl font-extrabold text-black'>
							Có lỗi xảy ra
						</p>
						<p className='mt-2 text-sm text-gray-600'>{error}</p>
						<button
							onClick={() => setSearch((s) => s)}
							className='mt-4 rounded-lg border-2 border-black bg-[var(--color-primary)] px-4 py-2 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Thử lại
						</button>
					</div>
				) : blogs.length === 0 ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
						<Search className='mx-auto h-10 w-10 text-gray-300' />
						<p className='mt-4 font-heading text-xl font-extrabold text-black'>
							Chưa có bài viết nào
						</p>
						<p className='mt-2 text-sm text-gray-600'>
							{isFiltered
								? "Thử từ khóa khác hoặc bỏ bộ lọc."
								: "Hãy là người đầu tiên chia sẻ bài viết!"}
						</p>
						{user && !isFiltered && (
							<Link
								to='/cong-dong/dang-bai'
								className='mt-5 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								<PenSquare className='h-4 w-4' strokeWidth={3} />
								Viết bài đầu tiên
							</Link>
						)}
					</div>
				) : (
					<div className='space-y-10'>
						{/* Featured article */}
						{featuredBlog && <FeaturedArticle blog={featuredBlog} />}

						{/* Latest posts */}
						{gridBlogs.length > 0 && (
							<>
								<h2 className='font-heading text-xl font-extrabold text-black'>
									{isFiltered ? "Kết quả tìm kiếm" : "Bài viết mới nhất"}
								</h2>
								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{gridBlogs.map((blog) => (
										<BlogCard key={blog.id} blog={blog} />
									))}
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default BlogFeedPage;
