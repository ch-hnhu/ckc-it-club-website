import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Loader2, Menu, Trophy } from "lucide-react";
import type { CommunityLayoutContext } from "./CommunityLayout";
import { blogService } from "@/services/blog.service";
import { gamificationService } from "@/services/gamification.service";
import { readingTime } from "@/lib/utils";
import type { BlogDetail } from "@/types/blog.types";
import type { LeaderboardEntry } from "@/types/gamification.types";

type TabKey = "weekly" | "all-time";

const PER_PAGE = 20;
const COMMUNITY_LOGO = "https://www.codedex.io/images/community/trophy.gif";
const LEADERBOARD_BLOG_SLUG = "gioi-thieu-bang-xep-hang";

interface LeaderboardState {
	entries: LeaderboardEntry[];
	page: number;
	hasMore: boolean;
	loadingInitial: boolean;
	loadingMore: boolean;
	total: number;
}

const createLeaderboardState = (): LeaderboardState => ({
	entries: [],
	page: 1,
	hasMore: true,
	loadingInitial: true,
	loadingMore: false,
	total: 0,
});

const PixelXpIcon: React.FC = () => (
	<svg
		xmlns='http://www.w3.org/2000/svg'
		width='36'
		height='36'
		viewBox='0 0 36 36'
		fill='none'
		aria-hidden='true'>
		<g clipPath='url(#leaderboard-xp-clip)'>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M14 0H18V2H14V0ZM12 6V2H14V6H12ZM10 10V6H12V10H10ZM6 12V10H10V12H6ZM2 14V12H6V14H2ZM2 18H0V14H2V18ZM6 20H2V18H6V20ZM10 22H6V20H10V22ZM12 26H10V22H12V26ZM14 30V26H12V30H14ZM18 30V32H14V30H18ZM20 26V30H18V26H20ZM22 22V26H20V22H22ZM26 20V22H22V20H26ZM30 18V20H26V18H30ZM30 14H32V18H30V14ZM26 12H30V14H26V12ZM22 10H26V12H22V10ZM20 6H22V10H20V6ZM20 6V2H18V6H20Z'
				fill='#020617'
			/>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M14 2H18V6H20V10H22V12H26V14H30V18H26V20H22V22H20V26H18V30H14V26H12V22H10V20H6V18H2V14H6V12H10V10H12V6H14V2Z'
				fill='#EAB308'
			/>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M18 2H16V16H18H20H22H26V12H22V10H20V6H18V2Z'
				fill='#FDE047'
			/>
			<rect x='26' y='14' width='4' height='2' fill='#FDE047' />
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M18 2H16V6H18V10H20V12H22V14H26V16H30V14H26V12H22V10H20V6H18V2Z'
				fill='white'
			/>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M2 16H14H16V30H14V26H12V22H10V20H6V18H2V16Z'
				fill='#CA8A04'
			/>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M16 16H2V18H6V20H10V22H12V26H14V30H16V26V22V20V18V16Z'
				fill='#CA8A04'
			/>
		</g>
		<defs>
			<clipPath id='leaderboard-xp-clip'>
				<rect width='32' height='32' fill='white' />
			</clipPath>
		</defs>
	</svg>
);

const PixelChevronIcon: React.FC = () => (
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
);

const formatBlogDate = (date?: string | null): string => {
	if (!date) return "";

	return new Date(date).toLocaleDateString("vi-VN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

function initials(name: string) {
	return name
		.split(" ")
		.map((p) => p[0])
		.slice(-2)
		.join("")
		.toUpperCase();
}

function rankLabel(rank: number) {
	const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
	return (
		<span className='flex w-8 shrink-0 items-center justify-center text-base font-extrabold text-gray-500'>
			{medal ?? rank}
		</span>
	);
}

interface RowProps {
	entry: LeaderboardEntry;
}

const LeaderboardRow: React.FC<RowProps> = ({ entry }) => (
	<div
		className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3 ${
			entry.is_me
				? "border-[var(--color-primary-dark)] bg-primary-100"
				: "border-transparent bg-white"
		}`}>
		{rankLabel(entry.rank)}

		{entry.avatar ? (
			<img
				src={entry.avatar}
				alt={entry.full_name}
				className='h-11 w-11 shrink-0 rounded-full border-2 border-black object-cover'
			/>
		) : (
			<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[var(--color-pastel-blue,#dbeafe)] text-sm font-bold'>
				{initials(entry.full_name)}
			</div>
		)}

		<div className='min-w-0 flex-1'>
			<div className='flex items-center gap-2'>
				<Link to={`/@${entry.username ?? entry.email}`}>
					<span className='truncate font-heading text-base font-extrabold text-black'>
						{entry.full_name}
					</span>
				</Link>
				{entry.member_rank?.badge && (
					<img
						src={entry.member_rank.badge}
						alt={entry.member_rank.name}
						title={entry.member_rank.name}
						className='h-5 w-5 shrink-0 object-contain'
					/>
				)}
				{entry.is_me && (
					<span className='rounded-full border border-gray-500 bg-white px-2 py-0.5 text-[11px] font-bold'>
						Bạn
					</span>
				)}
			</div>
			<p className='truncate text-sm text-gray-500'>
				{entry.username ? `@${entry.username}` : (entry.email ?? entry.full_name)}
			</p>
		</div>

		<div className='shrink-0 text-md font-semibold text-gray-500'>
			{entry.points.toLocaleString("vi-VN")} XP
		</div>
	</div>
);

const LeaderboardRightRail: React.FC = () => {
	const [blog, setBlog] = useState<BlogDetail | null>(null);

	useEffect(() => {
		let cancelled = false;

		blogService
			.getBlog(LEADERBOARD_BLOG_SLUG)
			.then((res) => {
				if (!cancelled) setBlog(res.data);
			})
			.catch(() => {
				if (!cancelled) setBlog(null);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const blogTitle = blog?.title ?? "Giới thiệu: Bảng xếp hạng";
	const blogImage = blog?.featured_image ?? "/assets/img/level03.png";
	const blogDate = formatBlogDate(blog?.published_at ?? blog?.created_at);
	const blogMeta = blog
		? `${readingTime(blog.content)} phút đọc${blogDate ? ` · ${blogDate}` : ""}`
		: "2 phút đọc";
	const blogUrl = blog?.slug ? `/blog/${blog.slug}` : `/blog/${LEADERBOARD_BLOG_SLUG}`;

	return (
		<aside className='community-right-rail'>
			<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5'>
				<section className='neo-card neo-card-static rounded-[18px] border-[3px] bg-white p-6'>
					<div className='mb-5'>
						<PixelXpIcon />
					</div>
					<h2 className='font-heading text-xl font-extrabold leading-tight text-black'>
						Tích cực đóng góp, thăng hạng cao hơn!
					</h2>
					<p className='mt-4 text-base font-medium leading-7 text-gray-600'>
						Thu thập XP thông qua việc tương tác cộng đồng, đăng blog, tham gia sự kiện
						và hoàn thành các khoá học,..
					</p>
				</section>

				<Link
					to={blogUrl}
					className='neo-card neo-card-static mt-5 flex w-full cursor-pointer items-center gap-3 bg-white p-3 text-left transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'
					aria-label={`Đọc blog ${blogTitle}`}>
					<img
						src={blogImage}
						alt={blogTitle}
						className='h-14 w-14 shrink-0 rounded-lg border-2 border-black bg-white object-cover'
					/>

					<span className='min-w-0 flex-1'>
						<span className='line-clamp-2 font-heading text-sm font-extrabold leading-5 text-slate-950'>
							{blogTitle}
						</span>
						<span className='mt-1 block truncate text-xs font-semibold leading-5 text-slate-500'>
							{blogMeta}
						</span>
					</span>

					<PixelChevronIcon />
				</Link>

				<p className='mt-5 text-center text-sm text-gray-500'>
					© 2026 CKC IT CLUB · Điều khoản · Bảo mật
				</p>
			</div>
		</aside>
	);
};

const CommunityLeaderboardPage: React.FC = () => {
	const { setIsSidebarOpen } = useOutletContext<CommunityLayoutContext>();

	const [tab, setTab] = useState<TabKey>("weekly");
	const [weekly, setWeekly] = useState<LeaderboardState>(createLeaderboardState);
	const [allTime, setAllTime] = useState<LeaderboardState>(createLeaderboardState);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const updateLeaderboardState = useCallback(
		(scope: TabKey, updater: (state: LeaderboardState) => LeaderboardState) => {
			if (scope === "weekly") {
				setWeekly(updater);
				return;
			}

			setAllTime(updater);
		},
		[],
	);

	const loadLeaderboardPage = useCallback(
		async (scope: TabKey, pageNum: number) => {
			updateLeaderboardState(scope, (current) => ({
				...current,
				loadingInitial: pageNum === 1,
				loadingMore: pageNum > 1,
			}));

			try {
				const res =
					scope === "weekly"
						? await gamificationService.getWeeklyLeaderboard(pageNum, PER_PAGE)
						: await gamificationService.getAllTimeLeaderboard(pageNum, PER_PAGE);

				updateLeaderboardState(scope, (current) => ({
					...current,
					entries: pageNum === 1 ? res.data : [...current.entries, ...res.data],
					page: res.meta.current_page,
					hasMore: res.meta.current_page < res.meta.last_page,
					total: res.meta.total,
				}));
			} catch {
				updateLeaderboardState(scope, (current) => ({
					...current,
					hasMore: false,
				}));
			} finally {
				updateLeaderboardState(scope, (current) => ({
					...current,
					loadingInitial: false,
					loadingMore: false,
				}));
			}
		},
		[updateLeaderboardState],
	);

	useEffect(() => {
		void loadLeaderboardPage("weekly", 1);
		void loadLeaderboardPage("all-time", 1);
	}, [loadLeaderboardPage]);

	const isWeekly = tab === "weekly";
	const currentLeaderboard = isWeekly ? weekly : allTime;

	const handleLoadMore = useCallback(() => {
		if (
			!currentLeaderboard.hasMore ||
			currentLeaderboard.loadingInitial ||
			currentLeaderboard.loadingMore
		) {
			return;
		}

		void loadLeaderboardPage(tab, currentLeaderboard.page + 1);
	}, [
		currentLeaderboard.hasMore,
		currentLeaderboard.loadingInitial,
		currentLeaderboard.loadingMore,
		currentLeaderboard.page,
		loadLeaderboardPage,
		tab,
	]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					handleLoadMore();
				}
			},
			{ rootMargin: "180px 0px", threshold: 0.1 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [handleLoadMore]);

	return (
		<div className='community-content'>
			<main className='community-feed min-w-0 px-4 pb-10 md:px-4 md:pt-5'>
				{/* Mobile header */}
				<div className='sticky top-16 z-30 -mx-3 mb-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 lg:hidden'>
					<button
						onClick={() => setIsSidebarOpen(true)}
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
						aria-label='Mở menu cộng đồng'>
						<Menu className='h-5 w-5' />
					</button>
					<Trophy className='h-5 w-5 text-amber-500' />
					<h1 className='font-heading text-sm font-bold text-black'>Bảng xếp hạng</h1>
				</div>

				{/* Header */}
				<div className='my-4 flex items-center gap-4 pb-2'>
					<div className='flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[var(--color-pastel-green,#dcfce7)]'>
						<img
							src={COMMUNITY_LOGO}
							alt='Bảng xếp hạng'
							className='h-full w-full object-cover'
							onError={(e) => {
								e.currentTarget.style.display = "none";
							}}
						/>
					</div>
					<div>
						<h1 className='font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
							Bảng xếp hạng
						</h1>
						<p className='mt-1 text-sm font-medium text-gray-500'>
							Thi đua cùng các thành viên khác và vươn lên top đầu ٩(◦`꒳´◦)۶
						</p>
					</div>
				</div>

				{/* Tabs */}
				<div className='mb-5 flex items-center gap-6 border-b-2 border-gray-200'>
					<button
						onClick={() => setTab("weekly")}
						className={`-mb-0.5 border-b-2 px-1 pb-2.5 font-heading text-base font-extrabold transition-colors ${
							isWeekly
								? "border-[var(--color-primary-dark)] text-black"
								: "border-transparent text-gray-400 hover:text-gray-600"
						}`}>
						Weekly
					</button>
					<button
						onClick={() => setTab("all-time")}
						className={`-mb-0.5 border-b-2 px-1 pb-2.5 font-heading text-base font-extrabold transition-colors ${
							!isWeekly
								? "border-[var(--color-primary-dark)] text-black"
								: "border-transparent text-gray-400 hover:text-gray-600"
						}`}>
						All Time
					</button>
				</div>

				{/* List */}
				{currentLeaderboard.loadingInitial && currentLeaderboard.entries.length === 0 ? (
					<div className='flex min-h-[30vh] items-center justify-center'>
						<Loader2 className='h-7 w-7 animate-spin text-gray-400' />
					</div>
				) : currentLeaderboard.entries.length > 0 ? (
					<ul className='space-y-1.5'>
						{currentLeaderboard.entries.map((entry) => (
							<li key={entry.user_id}>
								<LeaderboardRow entry={entry} />
							</li>
						))}
					</ul>
				) : (
					<div className='py-16 text-center text-gray-500'>
						Chưa có dữ liệu xếp hạng cho khoảng thời gian này.
					</div>
				)}

				<div ref={sentinelRef} className='h-3' />

				{currentLeaderboard.loadingMore && (
					<div className='flex items-center justify-center gap-2 py-5 text-sm font-bold text-gray-500'>
						<Loader2 className='h-4 w-4 animate-spin' />
						Đang tải thêm...
					</div>
				)}

				{!currentLeaderboard.hasMore && currentLeaderboard.entries.length > 0 && (
					<p className='py-5 text-center text-xs font-bold text-gray-500'>
						Đã hiển thị tất cả {currentLeaderboard.total} thành viên.
					</p>
				)}
			</main>

			<LeaderboardRightRail />
		</div>
	);
};

export default CommunityLeaderboardPage;
