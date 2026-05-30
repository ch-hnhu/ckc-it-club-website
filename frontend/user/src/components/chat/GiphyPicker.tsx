/**
 * GiphyPicker — custom GIF picker dùng GIPHY API v2.
 *
 * Hiển thị trending GIF khi mở, hỗ trợ tìm kiếm với debounce.
 * Yêu cầu VITE_GIPHY_API_KEY trong .env
 * → Đăng ký miễn phí tại https://developers.giphy.com
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import type { IGif } from "@giphy/js-types";
import { Loader2, Search, X } from "lucide-react";

// ─── Setup ────────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GIPHY_API_KEY as string;
const gf      = new GiphyFetch(API_KEY);
const LIMIT   = 18;
const COLS    = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
	onSelect: (url: string) => void;
	width?:   number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay = 400): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

// ─── Component ────────────────────────────────────────────────────────────────

const GiphyPicker: React.FC<Props> = ({ onSelect, width = 340 }) => {
	const [query, setQuery]     = useState("");
	const [gifs, setGifs]       = useState<IGif[]>([]);
	const [loading, setLoading] = useState(false);
	const [offset, setOffset]   = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const debouncedQuery        = useDebounce(query);
	const containerRef          = useRef<HTMLDivElement>(null);
	const abortRef              = useRef<AbortController | null>(null);

	// ── Fetch ─────────────────────────────────────────────────────────────────
	const fetchGifs = useCallback(async (q: string, off: number, append = false) => {
		// Abort previous request
		abortRef.current?.abort();
		abortRef.current = new AbortController();

		setLoading(true);
		try {
			const { data, pagination } = q.trim()
				? await gf.search(q.trim(), { limit: LIMIT, offset: off, type: "gifs" })
				: await gf.trending({ limit: LIMIT, offset: off, type: "gifs" });

			setGifs((prev) => append ? [...prev, ...data] : data);
			setHasMore(off + data.length < pagination.total_count);
			setOffset(off + data.length);
		} catch (err) {
			if ((err as Error).name !== "AbortError") {
				setGifs([]);
				setHasMore(false);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	// ── Reset + initial fetch on query change ─────────────────────────────────
	useEffect(() => {
		setOffset(0);
		setHasMore(true);
		void fetchGifs(debouncedQuery, 0, false);
	}, [debouncedQuery, fetchGifs]);

	// ── Infinite scroll ───────────────────────────────────────────────────────
	const handleScroll = () => {
		const el = containerRef.current;
		if (!el || loading || !hasMore) return;
		if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
			void fetchGifs(debouncedQuery, offset, true);
		}
	};

	// ── Preview URL — dùng fixed_height_small cho lưới, original để gửi ──────
	const previewUrl = (gif: IGif) =>
		gif.images.fixed_height_small?.url ?? gif.images.fixed_height?.url ?? gif.images.original.url;

	const sendUrl = (gif: IGif) =>
		gif.images.original.url;

	// ── Render ────────────────────────────────────────────────────────────────
	return (
		<div
			style={{ width }}
			className='flex flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>

			{/* Header */}
			<div className='flex items-center gap-2 border-b-2 border-black px-3 py-2.5'>
				<div className='relative flex-1'>
					<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400' />
					<input
						type='text'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder='Tìm GIF...'
						className='w-full rounded-lg border-2 border-black py-1.5 pl-8 pr-8 text-sm font-medium outline-none placeholder:text-gray-400 focus:shadow-[0_0_0_2px_#A3E635]'
						autoFocus
					/>
					{query && (
						<button
							onClick={() => setQuery("")}
							className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
							<X className='h-3.5 w-3.5' />
						</button>
					)}
				</div>
				{/* GIPHY attribution */}
				<span className='shrink-0 text-[10px] font-bold tracking-wide text-gray-400'>Powered by GIPHY</span>
			</div>

			{/* Grid */}
			<div
				ref={containerRef}
				onScroll={handleScroll}
				className='overflow-y-auto'
				style={{ height: 340 }}>

				{gifs.length === 0 && !loading ? (
					<div className='flex h-full items-center justify-center text-sm text-gray-400'>
						{query ? "Không tìm thấy GIF nào." : "Đang tải..."}
					</div>
				) : (
					<div
						className='grid gap-1 p-2'
						style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
						{gifs.map((gif) => (
							<button
								key={gif.id}
								onClick={() => onSelect(sendUrl(gif))}
								className='group relative overflow-hidden rounded-lg border-2 border-transparent transition hover:border-black hover:shadow-[2px_2px_0_#111]'
								title={gif.title}>
								<img
									src={previewUrl(gif)}
									alt={gif.title}
									loading='lazy'
									className='h-20 w-full object-cover transition-transform group-hover:scale-105'
								/>
							</button>
						))}
					</div>
				)}

				{/* Load-more spinner */}
				{loading && (
					<div className='flex justify-center py-3'>
						<Loader2 className='h-5 w-5 animate-spin text-[var(--color-text-primary)]' />
					</div>
				)}
			</div>
		</div>
	);
};

export default GiphyPicker;
