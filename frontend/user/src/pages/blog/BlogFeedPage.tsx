import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, PenSquare, Search, X } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { blogService } from "@/services/blog.service";
import type { Blog, BlogTag } from "@/types/blog.types";
import BlogCard from "@/components/community/BlogCard";
import { AvatarImage } from "@/components/ui/AvatarImage";

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

const FeaturedArticle: React.FC<{ blog: Blog; isHighlight?: boolean }> = ({ blog, isHighlight }) => {
	const authorName = blog.user?.full_name ?? "CKC IT CLUB";
	const authorAvatar = blog.user?.avatar?.trim();
	const authorInitial = authorName.trim().charAt(0).toUpperCase() || "C";
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
			className='group block overflow-hidden rounded-2xl border-2 border-black bg-white'>
			<div className='flex flex-col md:flex-row'>
				{/* Image — 58% width on desktop */}
				<div className='relative aspect-[4/3] max-h-[340px] shrink-0 overflow-hidden bg-gray-100 md:aspect-auto md:h-auto md:max-h-none md:min-h-[380px] md:w-[58%] md:self-stretch'>
					{blog.featured_image ? (
						<img
							src={blog.featured_image}
							alt={blog.title}
							className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
						/>
					) : (
						<div className='flex h-full w-full items-center justify-center bg-[var(--color-pastel-green)]'>
							<span className='font-heading text-8xl font-extrabold text-[var(--color-text-primary)] opacity-20'>
								{blog.title.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
				</div>

				{/* Text — 42% width on desktop */}
				<div className='flex flex-col justify-center p-7 md:flex-1 md:p-10 lg:p-12'>
					{/* Highlight badge + Date · Author */}
					{isHighlight && (
						<div className='mb-3'>
							<span className='inline-flex items-center gap-1 rounded-full border-2 border-black bg-[var(--color-primary)] px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-wide text-black shadow-[2px_2px_0_#111]'>
								✦ Nổi bật
							</span>
						</div>
					)}
					<div className='mb-4 flex items-center gap-2'>
						<span className='text-xs font-medium text-gray-400'>{formattedDate}</span>
						{blog.user && (
							<>
								<span className='text-gray-300'>·</span>
								{authorAvatar ? (
									<AvatarImage
										fallbackName={authorName}
										src={authorAvatar}
										alt={authorName}
										className='h-5 w-5 rounded-full border-2 border-black object-cover'
									/>
								) : (
									<span className='inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)] font-heading text-[10px] font-extrabold leading-none text-black'>
										{authorInitial}
									</span>
								)}
								<span className='text-xs font-semibold text-gray-600'>
									{authorName}
								</span>
							</>
						)}
					</div>

					{/* Title */}
					<h2 className='font-heading text-2xl font-extrabold leading-tight text-black hover:text-[var(--color-text-primary)] hover:underline md:text-3xl lg:text-[2rem]'>
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
						<span className='inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Đọc ngay
							<ArrowRight className='h-4 w-4' />
						</span>
					</div>
					{blog.tags.length > 0 && (
						<div className='mt-5 flex flex-wrap gap-2'>
							{blog.tags.slice(0, 3).map((tag, i) => (
								<span
									key={tag.id}
									className={`inline-block neo-tag uppercase text-[10px] bg-white ${TAG_BG[i % TAG_BG.length]}`}>
									{tag.name}
								</span>
							))}
						</div>
					)}
				</div>
			</div>
		</Link>
	);
};

// ─── BlogFeedPage ─────────────────────────────────────────────────────────────

const PREVIEW_PER_PAGE = 7;  // 1 featured + 6 grid
const EXPANDED_PER_PAGE = 9; // 3 × 3 grid

const BlogFeedPage: React.FC = () => {
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [page, setPage] = useState(1);
	const [showAll, setShowAll] = useState(false);

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [activeTag, setActiveTag] = useState<string | null>(null);

	const [allTags, setAllTags] = useState<BlogTag[]>([]);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const tagsScrollRef = useRef<HTMLDivElement>(null);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const [canScrollLeft, setCanScrollLeft] = useState(false);

	const updateScrollState = useCallback(() => {
		const el = tagsScrollRef.current;
		if (!el) return;
		setCanScrollLeft(el.scrollLeft > 4);
		setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
	}, []);

	const scrollTagsRight = () => {
		tagsScrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
	};

	const scrollTagsLeft = () => {
		tagsScrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
	};

	useEffect(() => {
		const el = tagsScrollRef.current;
		if (!el) return;
		updateScrollState();
		el.addEventListener("scroll", updateScrollState);
		window.addEventListener("resize", updateScrollState);
		return () => {
			el.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}, [updateScrollState]);

	const handleSearchChange = (value: string) => {
		setSearchInput(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setSearch(value.trim());
		}, 400);
	};

	// Khi filter thay đổi → về lại chế độ mặc định
	useEffect(() => {
		setShowAll(false);
	}, [search, activeTag]);

	// Fetch trang đầu mỗi khi search / tag / showAll thay đổi
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		setPage(1);

		const isExpanded = showAll || Boolean(search || activeTag);
		const perPage = isExpanded ? EXPANDED_PER_PAGE : PREVIEW_PER_PAGE;

		blogService
			.getBlogs({
				sort: "published_at",
				order: "desc",
				per_page: perPage,
				page: 1,
				...(search ? { search } : {}),
				...(activeTag ? { tag: activeTag } : {}),
			})
			.then((res) => {
				if (cancelled) return;
				setBlogs(res.data);
				setHasMore(res.meta.current_page < res.meta.last_page);
			})
			.catch(() => {
				if (cancelled) return;
				setError("Không thể tải bài viết. Vui lòng thử lại.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => { cancelled = true; };
	}, [search, activeTag, showAll]);

	// Load tất cả tags một lần khi mount
	useEffect(() => {
		blogService.getTags().then((res) => setAllTags(res.data)).catch(() => {});
	}, []);

	useEffect(() => {
		const id = requestAnimationFrame(updateScrollState);
		return () => cancelAnimationFrame(id);
	}, [allTags, updateScrollState]);

	// Load more — gắn thêm vào danh sách hiện tại
	const handleLoadMore = useCallback(() => {
		const nextPage = page + 1;
		setLoadingMore(true);

		blogService
			.getBlogs({
				sort: "published_at",
				order: "desc",
				per_page: EXPANDED_PER_PAGE,
				page: nextPage,
				...(search ? { search } : {}),
				...(activeTag ? { tag: activeTag } : {}),
			})
			.then((res) => {
				setBlogs((prev) => [...prev, ...res.data]);
				setPage(nextPage);
				setHasMore(res.meta.current_page < res.meta.last_page);
			})
			.catch(() => {})
			.finally(() => setLoadingMore(false));
	}, [page, search, activeTag]);

	const isFiltered = Boolean(search || activeTag);
	const isExpandedMode = showAll || isFiltered;

	// Bài featured: luôn ghim trên cùng trừ khi đang filter (search/tag)
	const featuredBlog = !isFiltered && blogs.length > 0
		? (blogs.find((b) => b.is_highlight) ?? blogs[0])
		: null;

	// Grid không bao gồm bài featured
	const gridBlogs = featuredBlog
		? blogs.filter((b) => b.id !== featuredBlog.id)
		: blogs;

	const tagButtonClass =
		"inline-flex h-10 shrink-0 items-center justify-center rounded-full border-2 border-black px-5 text-sm font-bold leading-none shadow-[3px_3px_0_#111] transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";
	const tagArrowButtonClass =
		"pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";

	return (
		<div className='w-full min-h-screen pb-12 pt-16'>
			{/* ── Mobile header ── */}
			<div className='sticky top-16 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-[var(--color-surface)] px-4 md:hidden'>
				<h1 className='font-heading text-sm font-bold text-black'>✦ Blog</h1>
				{user && (
					<Link
						to='/blog/dang-bai'
						className='inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary)] px-3 font-heading text-xs font-extrabold text-dark shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						<PenSquare className='h-3.5 w-3.5' strokeWidth={3} />
						Viết bài
					</Link>
				)}
			</div>

			{/* ── Hero banner ── */}
			<div
				className='relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden border-b-2 border-black px-6 py-14 md:min-h-[300px] md:py-20'
				style={{
					backgroundImage:
						"url('https://www.codedex.io/images/blog/blog-background.png')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}>
				<img
					src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/ckc-blog-title.png'
					alt='CKC IT BLOG'
					className='relative max-h-28 w-auto object-contain md:max-h-32'
				/>
			</div>

			{/* ── Filter row ── */}
			<div className='border-b-2 border-black bg-white py-4'>
				<div className='neo-container flex flex-col gap-3 px-6 md:flex-row md:items-center'>
					<Link
						to={user ? "/blog/dang-bai" : "/login"}
						className='hidden h-10 shrink-0 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-4 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none md:order-1 md:inline-flex'>
						<PenSquare className='h-4 w-4' strokeWidth={3} />
						Thêm
					</Link>
					{/* Search */}
					<div className='group/search relative order-1 shrink-0 md:order-2 md:w-72'>
						<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within/search:text-[var(--color-primary)]' />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder='Tìm kiếm...'
							className='w-full rounded-xl border-2 border-black bg-white py-2 pl-10 pr-9 text-sm font-medium text-black outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
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
					<div className='hidden h-6 w-px bg-gray-200 md:order-3 md:block' />

					{/* Tag chips */}
					<div className='relative order-2 flex min-w-0 flex-1 md:order-4'>
						{canScrollLeft && (
							<div className='pointer-events-none absolute -inset-y-1 left-0 z-10 flex items-center bg-gradient-to-r from-white via-white/90 to-transparent pr-8 pl-0'>
								<button onClick={scrollTagsLeft} className={tagArrowButtonClass}>
									<ArrowRight className='h-4 w-4 rotate-180' />
								</button>
							</div>
						)}
						<div
							ref={tagsScrollRef}
							className='no-scrollbar flex flex-1 gap-2 overflow-x-auto px-0.5 pb-1 pt-0.5'>
							<button
								onClick={() => setActiveTag(null)}
								className={`${tagButtonClass} ${
									!activeTag
										? "bg-[var(--color-primary)] text-black"
										: "bg-white text-gray-700 hover:bg-gray-50"
								}`}>
								Tất cả
							</button>
							{allTags.map((tag) => (
								<button
									key={tag.id}
									onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
									className={`${tagButtonClass} ${
										activeTag === tag.name
											? "bg-[var(--color-primary)] text-black"
											: "bg-white text-gray-700 hover:bg-gray-50"
									}`}>
									{tag.name}
								</button>
							))}
						</div>
						{canScrollRight && (
							<div className='pointer-events-none absolute -inset-y-1 right-0 z-10 flex items-center bg-gradient-to-l from-white via-white/90 to-transparent pl-8 pr-0'>
								<button onClick={scrollTagsRight} className={tagArrowButtonClass}>
									<ArrowRight className='h-4 w-4' />
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ── Content ── */}
			<div className='neo-container px-6 pt-8'>
				{loading ? (
					<div className='space-y-8'>
						{!isFiltered && <FeaturedSkeleton />}
						<div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
							{Array.from({ length: 6 }).map((_, i) => (
								<CardSkeleton key={i} />
							))}
						</div>
					</div>
				) : error ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
						<p className='font-heading text-xl font-extrabold text-black'>Có lỗi xảy ra</p>
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
							Không tìm thấy bài viết nào
						</p>
						<p className='mt-2 text-sm text-gray-600'>
							{isFiltered
								? "Thử từ khóa khác hoặc bỏ bộ lọc."
								: "Hãy là người đầu tiên chia sẻ bài viết!"}
						</p>
						{user && !isFiltered && (
							<Link
								to='/blog/dang-bai'
								className='mt-5 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								<PenSquare className='h-4 w-4' strokeWidth={3} />
								Viết bài đầu tiên
							</Link>
						)}
					</div>
				) : (
					<div className='space-y-10'>
						{/* Featured article — chỉ hiện ở chế độ preview */}
						{featuredBlog && (
							<FeaturedArticle blog={featuredBlog} isHighlight={featuredBlog.is_highlight} />
						)}

						{/* Grid section */}
						{gridBlogs.length > 0 && (
							<div className='space-y-6'>
								<h2 className='font-heading text-xl font-extrabold text-black'>
									{isFiltered
										? "Kết quả tìm kiếm"
										: showAll
											? "Tất cả bài viết"
											: "Bài viết mới nhất"}
								</h2>

								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{gridBlogs.map((blog) => (
										<BlogCard key={blog.id} blog={blog} />
									))}

									{/* Skeleton khi đang load more */}
									{loadingMore &&
										Array.from({ length: 3 }).map((_, i) => (
											<CardSkeleton key={`more-${i}`} />
										))}
								</div>

								{/* ── Nút Xem tất cả (chế độ preview) ── */}
								{!isExpandedMode && hasMore && (
									<div className='flex justify-center pt-2'>
										<button
											onClick={() => setShowAll(true)}
											className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-7 py-3 font-heading text-sm font-extrabold text-black shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											Xem tất cả bài viết
											<ArrowRight className='h-4 w-4' />
										</button>
									</div>
								)}

								{/* ── Nút Tải thêm (chế độ expanded) ── */}
								{isExpandedMode && hasMore && !loadingMore && (
									<div className='flex justify-center pt-2'>
										<button
											onClick={handleLoadMore}
											className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-7 py-3 font-heading text-sm font-extrabold text-black shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											Tải thêm bài viết
											<ArrowRight className='h-4 w-4' />
										</button>
									</div>
								)}

								{/* Spinner load more */}
								{isExpandedMode && loadingMore && (
									<div className='flex justify-center py-4'>
										<Loader2 className='h-6 w-6 animate-spin text-black' />
									</div>
								)}

								{/* Hết bài */}
								{isExpandedMode && !hasMore && blogs.length > 0 && (
									<p className='text-center text-sm font-medium text-gray-400'>
										✦ Bạn đã xem hết tất cả bài viết
									</p>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default BlogFeedPage;
