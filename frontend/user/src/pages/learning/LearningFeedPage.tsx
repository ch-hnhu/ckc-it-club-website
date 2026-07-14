import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { learningService } from "@/services/learning.service";
import type { Course, CourseAudience, CourseCategory } from "@/types/learning.types";
import CourseCard from "@/components/learning/CourseCard";
import NeoSelect, { type NeoSelectOption } from "@/components/ui/NeoSelect";

// ─── Skeletons ────────────────────────────────────────────────────────────────

const FeaturedSkeleton: React.FC = () => (
	<div className='animate-pulse overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
		<div className='aspect-[21/9] bg-gray-200' />
		<div className='p-6 md:p-8'>
			<div className='mb-4 h-5 w-40 rounded-lg bg-gray-200' />
			<div className='mb-3 h-9 w-3/4 rounded-lg bg-gray-200' />
			<div className='space-y-2.5'>
				<div className='h-4 w-full rounded bg-gray-200' />
				<div className='h-4 w-4/5 rounded bg-gray-200' />
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

// ─── LearningFeedPage ───────────────────────────────────────────────────────────

const PER_PAGE = 6; // mỗi lượt tải 6 khóa (2 hàng × 3)

const AUDIENCE_OPTIONS: NeoSelectOption[] = [
	{ value: "all", label: "Tất cả đối tượng" },
	{ value: "club_member", label: "Thành viên CLB" },
	{ value: "cao_thang_student", label: "Sinh viên Cao Thắng" },
	{ value: "public", label: "Công khai" },
];

const LearningFeedPage: React.FC = () => {
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [page, setPage] = useState(1);

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [activeAudience, setActiveAudience] = useState<CourseAudience | null>(null);
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const [allCategories, setAllCategories] = useState<CourseCategory[]>([]);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
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

	// Fetch trang đầu mỗi khi search / category thay đổi
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		setPage(1);

		learningService
			.getCourses({
				sort: "created_at",
				order: "desc",
				per_page: PER_PAGE,
				page: 1,
				...(search ? { search } : {}),
				...(activeAudience ? { audience: activeAudience } : {}),
				...(activeCategory ? { category: activeCategory } : {}),
			})
			.then((res) => {
				if (cancelled) return;
				setCourses(res.data);
				setHasMore(res.meta.current_page < res.meta.last_page);
			})
			.catch(() => {
				if (cancelled) return;
				setError("Không thể tải khóa học. Vui lòng thử lại.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [search, activeAudience, activeCategory]);

	// Load tất cả category một lần khi mount
	useEffect(() => {
		learningService
			.getCategories()
			.then((res) => setAllCategories(res.data))
			.catch(() => {});
	}, []);

	useEffect(() => {
		const id = requestAnimationFrame(updateScrollState);
		return () => cancelAnimationFrame(id);
	}, [allCategories, updateScrollState]);

	// Load more — gắn thêm vào danh sách hiện tại
	const handleLoadMore = useCallback(() => {
		if (loadingMore || !hasMore) return;
		const nextPage = page + 1;
		setLoadingMore(true);

		learningService
			.getCourses({
				sort: "created_at",
				order: "desc",
				per_page: PER_PAGE,
				page: nextPage,
				...(search ? { search } : {}),
				...(activeAudience ? { audience: activeAudience } : {}),
				...(activeCategory ? { category: activeCategory } : {}),
			})
			.then((res) => {
				setCourses((prev) => [...prev, ...res.data]);
				setPage(nextPage);
				setHasMore(res.meta.current_page < res.meta.last_page);
			})
			.catch(() => {})
			.finally(() => setLoadingMore(false));
	}, [page, search, activeAudience, activeCategory, loadingMore, hasMore]);

	// Tự động tải thêm khi sentinel lọt vào vùng nhìn (infinite scroll)
	useEffect(() => {
		const el = sentinelRef.current;
		if (!el || loading || !hasMore) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) handleLoadMore();
			},
			{ rootMargin: "300px" },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [handleLoadMore, loading, hasMore]);

	const isFiltered = Boolean(search || activeAudience || activeCategory);

	// Khóa học nổi bật: luôn ghim trên cùng trừ khi đang filter (search/category)
	const featuredCourse =
		!isFiltered && courses.length > 0
			? (courses.find((c) => c.is_featured) ?? courses[0])
			: null;

	// Grid không bao gồm khóa học featured
	const gridCourses = featuredCourse
		? courses.filter((c) => c.id !== featuredCourse.id)
		: courses;

	const tagButtonClass =
		"inline-flex h-10 shrink-0 items-center justify-center rounded-full border-2 border-black px-5 text-sm font-bold leading-none shadow-[3px_3px_0_#111] transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";
	const tagArrowButtonClass =
		"pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";

	return (
		<div className='w-full min-h-screen pb-12 pt-16'>
			{/* ── Mobile header ── */}
			<div className='sticky top-16 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-[var(--color-surface)] px-4 md:hidden'>
				<h1 className='font-heading text-sm font-bold text-black'>✦ Learning Center</h1>
			</div>

			{/* ── Hero banner ── */}
			<div
				className='relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden border-b-2 border-black px-6 py-14 md:min-h-[300px] md:py-20'
				style={{
					backgroundImage:
						"linear-gradient(rgba(0, 0, 0, 0.46), rgba(0, 0, 0, 0.46)), url('/assets/gif/uiux.gif')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}>
				<h1
					className='font-pixel text-4xl text-white md:text-5xl'
					style={{ textShadow: "5px 5px 0 #111, 0 2px 10px rgba(0, 0, 0, 0.45)" }}>
					Khoá học
				</h1>
				<p className='mt-10 max-w-xl text-center text-md font-bold text-white'>
					Khoá học do thành viên CLB tổ chức, chia sẻ kiến thức và kỹ năng.
				</p>
			</div>

			{/* ── Filter row ── */}
			<div className='border-b-2 border-black bg-white py-4'>
				<div className='neo-container flex flex-col gap-3 px-6 md:flex-row md:items-center'>
					{/* Search */}
					<div className='group/search relative order-1 shrink-0 md:w-72'>
						<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within/search:text-[var(--color-primary)]' />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder='Tìm khóa học...'
							className='h-[3.25rem] w-full rounded-[10px] border-2 border-black bg-white py-2 pl-10 pr-9 text-sm font-medium text-black outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
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

					{/* Audience */}
					<NeoSelect
						id='course-audience-filter'
						options={AUDIENCE_OPTIONS}
						value={activeAudience ?? "all"}
						onChange={(value) =>
							setActiveAudience(value === "all" ? null : (value as CourseAudience))
						}
						className='order-1 shrink-0 md:w-60'
					/>

					{/* Category chips */}
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
								onClick={() => setActiveCategory(null)}
								className={`${tagButtonClass} ${
									!activeCategory
										? "bg-[var(--color-primary)] text-black"
										: "bg-white text-gray-700 hover:bg-gray-50"
								}`}>
								Tất cả
							</button>
							{allCategories.map((cat) => (
								<button
									key={cat.id}
									onClick={() =>
										setActiveCategory(
											activeCategory === cat.name ? null : cat.name,
										)
									}
									className={`${tagButtonClass} ${
										activeCategory === cat.name
											? "bg-[var(--color-primary)] text-black"
											: "bg-white text-gray-700 hover:bg-gray-50"
									}`}>
									{cat.name}
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
				) : courses.length === 0 ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
						<Search className='mx-auto h-10 w-10 text-gray-300' />
						<p className='mt-4 font-heading text-xl font-extrabold text-black'>
							Không tìm thấy khóa học nào
						</p>
						<p className='mt-2 text-sm text-gray-600'>
							{isFiltered
								? "Thử từ khóa khác hoặc bỏ bộ lọc."
								: "Các khóa học sẽ sớm được cập nhật."}
						</p>
					</div>
				) : (
					<div className='space-y-10'>
						{/* Khóa học nổi bật — chỉ hiện ở chế độ preview */}
						{featuredCourse && <CourseCard course={featuredCourse} featured />}

						{/* Grid section */}
						{gridCourses.length > 0 && (
							<div className='space-y-6'>
								<h2 className='font-heading text-xl font-extrabold text-black'>
									{isFiltered ? "Kết quả tìm kiếm" : "Tất cả khóa học"}
								</h2>

								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{gridCourses.map((course) => (
										<CourseCard key={course.id} course={course} />
									))}

									{/* Skeleton khi đang load more */}
									{loadingMore &&
										Array.from({ length: 3 }).map((_, i) => (
											<CardSkeleton key={`more-${i}`} />
										))}
								</div>

								{/* Sentinel: lọt vào vùng nhìn sẽ tự tải thêm */}
								{hasMore && <div ref={sentinelRef} className='h-px w-full' />}

								{/* Spinner load more */}
								{loadingMore && (
									<div className='flex justify-center py-4'>
										<Loader2 className='h-6 w-6 animate-spin text-black' />
									</div>
								)}

								{/* Hết khóa học */}
								{!hasMore && !loadingMore && courses.length > 0 && (
									<p className='text-center text-sm font-medium text-gray-400'>
										✦ Bạn đã xem hết tất cả khóa học
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

export default LearningFeedPage;
