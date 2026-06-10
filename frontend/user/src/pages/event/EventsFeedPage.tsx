import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays, Loader2, MapPin, Search, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { eventService } from "@/services/event.service";
import type { EventItem, EventStatus } from "@/types/event.types";
import EventCard, { EventStatusBadge } from "@/components/event/EventCard";
import { formatEventDate, formatEventTime } from "@/lib/eventFormat";

// ─── Skeletons ────────────────────────────────────────────────────────────────

const FeaturedSkeleton: React.FC = () => (
	<div className='animate-pulse overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
		<div className='flex flex-col md:flex-row'>
			<div className='aspect-[4/3] bg-gray-200 md:aspect-auto md:min-h-[340px] md:w-[58%]' />
			<div className='flex flex-col justify-center p-8 md:flex-1 md:p-10'>
				<div className='mb-5 h-4 w-44 rounded bg-gray-200' />
				<div className='mb-3 h-9 w-full rounded-lg bg-gray-200' />
				<div className='mb-6 h-9 w-4/5 rounded-lg bg-gray-200' />
				<div className='space-y-2.5'>
					<div className='h-4 w-full rounded bg-gray-200' />
					<div className='h-4 w-5/6 rounded bg-gray-200' />
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
			<div className='h-6 w-4/5 rounded-lg bg-gray-200' />
			<div className='mt-2 space-y-1.5'>
				<div className='h-3.5 w-full rounded bg-gray-200' />
				<div className='h-3.5 w-5/6 rounded bg-gray-200' />
			</div>
			<div className='mt-4 flex items-center gap-2 border-t-2 border-gray-200 pt-3'>
				<div className='h-3.5 w-24 rounded bg-gray-200' />
			</div>
		</div>
	</div>
);

// ─── Featured event ────────────────────────────────────────────────────────────

const FeaturedEvent: React.FC<{ event: EventItem }> = ({ event }) => (
	<Link
		to={`/su-kien/${event.slug}`}
		className='group block overflow-hidden rounded-2xl border-2 border-black bg-white'>
		<div className='flex flex-col md:flex-row'>
			<div className='relative shrink-0 overflow-hidden md:w-[58%]'>
				{event.thumbnail ? (
					<img
						src={event.thumbnail}
						alt={event.title}
						className='aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:aspect-auto md:h-full'
						style={{ minHeight: "340px" }}
					/>
				) : (
					<div
						className='flex aspect-[4/3] w-full items-center justify-center bg-[var(--color-pastel-purple)] md:aspect-auto md:h-full'
						style={{ minHeight: "340px" }}>
						<span className='font-heading text-8xl font-extrabold text-[var(--color-text-primary)] opacity-20'>
							{event.title.charAt(0).toUpperCase()}
						</span>
					</div>
				)}
			</div>

			<div className='flex flex-col justify-center p-7 md:flex-1 md:p-10 lg:p-12'>
				<div className='mb-4'>
					<EventStatusBadge status={event.status} />
				</div>

				<h2 className='font-heading text-2xl font-extrabold leading-tight text-black group-hover:text-[var(--color-text-primary)] group-hover:underline md:text-3xl lg:text-[2rem]'>
					{event.title}
				</h2>

				{event.description && (
					<p className='mt-4 line-clamp-3 text-base leading-7 text-gray-600'>{event.description}</p>
				)}

				<div className='mt-5 space-y-2 text-sm text-gray-700'>
					<div className='flex items-center gap-2'>
						<CalendarDays className='h-4 w-4 shrink-0 text-gray-400' />
						<span className='font-medium'>
							{formatEventDate(event.start_at)} · {formatEventTime(event.start_at)} - {formatEventTime(event.end_at)}
						</span>
					</div>
					{event.location && (
						<div className='flex items-center gap-2'>
							<MapPin className='h-4 w-4 shrink-0 text-gray-400' />
							<span>{event.location}</span>
						</div>
					)}
					<div className='flex items-center gap-2'>
						<Users className='h-4 w-4 shrink-0 text-gray-400' />
						<span>
							{event.registrations_count}
							{event.max_attendees ? ` / ${event.max_attendees}` : ""} người tham gia
						</span>
					</div>
				</div>

				<div className='mt-7'>
					<span className='inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						Xem chi tiết
						<ArrowRight className='h-4 w-4' />
					</span>
				</div>
			</div>
		</div>
	</Link>
);

// ─── EventsFeedPage ─────────────────────────────────────────────────────────────

const PER_PAGE = 9;

const STATUS_FILTERS: { value: EventStatus | "all"; label: string }[] = [
	{ value: "all", label: "Tất cả" },
	{ value: "published", label: "Sắp diễn ra" },
	{ value: "ongoing", label: "Đang diễn ra" },
	{ value: "ended", label: "Đã kết thúc" },
];

const EventsFeedPage: React.FC = () => {
	const [events, setEvents] = useState<EventItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(false);
	const [page, setPage] = useState(1);

	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");

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
		setPage(1);

		eventService
			.getEvents({
				per_page: PER_PAGE,
				page: 1,
				...(search ? { search } : {}),
				...(statusFilter !== "all" ? { status: statusFilter } : {}),
			})
			.then((res) => {
				if (cancelled) return;
				setEvents(res.data);
				setHasMore(res.meta.current_page < res.meta.last_page);
			})
			.catch(() => {
				if (cancelled) return;
				setError("Không thể tải danh sách sự kiện. Vui lòng thử lại.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [search, statusFilter]);

	const handleLoadMore = () => {
		const nextPage = page + 1;
		setLoadingMore(true);

		eventService
			.getEvents({
				per_page: PER_PAGE,
				page: nextPage,
				...(search ? { search } : {}),
				...(statusFilter !== "all" ? { status: statusFilter } : {}),
			})
			.then((res) => {
				setEvents((prev) => [...prev, ...res.data]);
				setPage(nextPage);
				setHasMore(res.meta.current_page < res.meta.last_page);
			})
			.catch(() => {})
			.finally(() => setLoadingMore(false));
	};

	const isFiltered = Boolean(search || statusFilter !== "all");

	const featuredEvent = !isFiltered && events.length > 0
		? (events.find((e) => e.status === "ongoing") ?? events[0])
		: null;

	const gridEvents = featuredEvent ? events.filter((e) => e.id !== featuredEvent.id) : events;

	const filterButtonClass =
		"inline-flex h-10 shrink-0 items-center justify-center rounded-full border-2 border-black px-5 text-sm font-bold leading-none shadow-[3px_3px_0_#111] transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";

	return (
		<div className='w-full min-h-screen pb-12 pt-16'>
			{/* ── Hero banner ── */}
			<div className='relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden border-b-2 border-black bg-[var(--color-pastel-blue)] px-6 py-14 md:min-h-[240px] md:py-16'>
				<h1 className='font-heading text-3xl font-extrabold uppercase text-black md:text-5xl'>
					✦ Sự kiện CKC IT Club
				</h1>
				<p className='mt-3 max-w-2xl text-center text-sm text-gray-700 md:text-base'>
					Khám phá và đăng ký tham gia các sự kiện, workshop, hoạt động sắp tới của câu lạc bộ.
				</p>
			</div>

			{/* ── Filter row ── */}
			<div className='border-b-2 border-black bg-white py-4'>
				<div className='neo-container flex flex-col gap-3 px-6 md:flex-row md:items-center'>
					{/* Search */}
					<div className='group/search relative shrink-0 md:w-72'>
						<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within/search:text-[var(--color-primary)]' />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => handleSearchChange(e.target.value)}
							placeholder='Tìm kiếm sự kiện...'
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
					<div className='hidden h-6 w-px bg-gray-200 md:block' />

					{/* Status filters */}
					<div className='flex flex-1 flex-wrap gap-2'>
						{STATUS_FILTERS.map((f) => (
							<button
								key={f.value}
								onClick={() => setStatusFilter(f.value)}
								className={`${filterButtonClass} ${
									statusFilter === f.value
										? "bg-[var(--color-primary)] text-black"
										: "bg-white text-gray-700 hover:bg-gray-50"
								}`}>
								{f.label}
							</button>
						))}
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
					</div>
				) : events.length === 0 ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'>
						<CalendarDays className='mx-auto h-10 w-10 text-gray-300' />
						<p className='mt-4 font-heading text-xl font-extrabold text-black'>
							Không tìm thấy sự kiện nào
						</p>
						<p className='mt-2 text-sm text-gray-600'>
							{isFiltered ? "Thử từ khóa hoặc bộ lọc khác." : "Hiện chưa có sự kiện nào được công bố."}
						</p>
					</div>
				) : (
					<div className='space-y-10'>
						{featuredEvent && <FeaturedEvent event={featuredEvent} />}

						{gridEvents.length > 0 && (
							<div className='space-y-6'>
								<h2 className='font-heading text-xl font-extrabold text-black'>
									{isFiltered ? "Kết quả tìm kiếm" : "Sự kiện khác"}
								</h2>

								<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
									{gridEvents.map((event) => (
										<EventCard key={event.id} event={event} />
									))}
									{loadingMore &&
										Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={`more-${i}`} />)}
								</div>

								{hasMore && !loadingMore && (
									<div className='flex justify-center pt-2'>
										<button
											onClick={handleLoadMore}
											className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-7 py-3 font-heading text-sm font-extrabold text-black shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											Tải thêm sự kiện
											<ArrowRight className='h-4 w-4' />
										</button>
									</div>
								)}

								{loadingMore && (
									<div className='flex justify-center py-4'>
										<Loader2 className='h-6 w-6 animate-spin text-black' />
									</div>
								)}

								{!hasMore && events.length > 0 && (
									<p className='text-center text-sm font-medium text-gray-400'>
										✦ Bạn đã xem hết tất cả sự kiện
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

export default EventsFeedPage;
