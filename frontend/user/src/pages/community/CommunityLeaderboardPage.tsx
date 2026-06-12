import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { BookOpen, ChevronRight, Loader2, Menu, PenLine, Sparkles, Trophy } from "lucide-react";
import type { CommunityLayoutContext } from "./CommunityLayout";
import { gamificationService } from "@/services/gamification.service";
import type { LeaderboardEntry } from "@/types/gamification.types";

type TabKey = "weekly" | "all-time";

const COMMUNITY_LOGO = "https://www.codedex.io/images/community/trophy.gif";

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
				<span className='truncate font-heading text-base font-extrabold text-black'>
					{entry.full_name}
				</span>
				{entry.level?.badge && (
					<img
						src={entry.level.badge}
						alt={entry.level.name}
						title={entry.level.name}
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

const LeaderboardRightRail: React.FC = () => (
	<aside className='community-right-rail'>
		<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-3 py-5'>
			<section className='neo-card neo-card-static bg-white p-5'>
				<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-[var(--color-pastel-yellow,#FEF3C8)] shadow-[3px_3px_0_#111]'>
					<Sparkles className='h-6 w-6 text-black' />
				</div>
				<h2 className='font-heading text-lg font-extrabold leading-tight text-black'>
					Kiếm XP bằng hoạt động
				</h2>
				<p className='mt-3 text-sm font-medium leading-6 text-gray-600'>
					Nhận XP khi đăng bài chất lượng, chia sẻ blog, tham gia thảo luận và đóng góp
					cho cộng đồng CKC IT Club.
				</p>
				<div className='mt-5 grid gap-2'>
					<Link
						to='/cong-dong/dang-bai'
						className='neo-btn neo-btn-secondary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm'>
						<PenLine className='h-4 w-4' />
						Đăng bài mới
					</Link>
					<Link
						to='/diem-cua-toi'
						className='neo-btn neo-btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm'>
						<Trophy className='h-4 w-4' />
						Xem điểm của tôi
					</Link>
				</div>
			</section>

			<Link
				to='/blog'
				className='neo-card neo-card-static mt-5 flex items-center gap-4 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#111]'>
				<div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[var(--color-pastel-blue,#BFD9FE)]'>
					<BookOpen className='h-7 w-7 text-black' />
				</div>
				<div className='min-w-0 flex-1'>
					<h3 className='font-heading text-sm font-extrabold leading-snug text-black'>
						Cách tăng hạng trong cộng đồng
					</h3>
					<p className='mt-1 text-xs font-medium text-gray-500'>
						Đọc blog và mẹo đóng góp
					</p>
				</div>
				<ChevronRight className='h-5 w-5 shrink-0 text-gray-500' />
			</Link>

			<p className='mt-5 text-center text-sm text-gray-500'>
				© 2026 CKC IT CLUB · Điều khoản · Bảo mật
			</p>
		</div>
	</aside>
);

const CommunityLeaderboardPage: React.FC = () => {
	const { setIsSidebarOpen } = useOutletContext<CommunityLayoutContext>();

	const [tab, setTab] = useState<TabKey>("weekly");
	const [weekly, setWeekly] = useState<LeaderboardEntry[]>([]);
	const [allTime, setAllTime] = useState<LeaderboardEntry[]>([]);
	const [loadingWeekly, setLoadingWeekly] = useState(true);
	const [loadingAllTime, setLoadingAllTime] = useState(true);

	useEffect(() => {
		let cancelled = false;
		gamificationService
			.getWeeklyLeaderboard()
			.then((res) => !cancelled && setWeekly(res.data))
			.catch(() => {})
			.finally(() => !cancelled && setLoadingWeekly(false));

		gamificationService
			.getAllTimeLeaderboard()
			.then((res) => !cancelled && setAllTime(res.data))
			.catch(() => {})
			.finally(() => !cancelled && setLoadingAllTime(false));

		return () => {
			cancelled = true;
		};
	}, []);

	const isWeekly = tab === "weekly";
	const entries = isWeekly ? weekly : allTime;
	const loading = isWeekly ? loadingWeekly : loadingAllTime;

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
						Tuần này
					</button>
					<button
						onClick={() => setTab("all-time")}
						className={`-mb-0.5 border-b-2 px-1 pb-2.5 font-heading text-base font-extrabold transition-colors ${
							!isWeekly
								? "border-[var(--color-primary-dark)] text-black"
								: "border-transparent text-gray-400 hover:text-gray-600"
						}`}>
						Mọi thời điểm
					</button>
				</div>

				{/* List */}
				{loading ? (
					<div className='flex min-h-[30vh] items-center justify-center'>
						<Loader2 className='h-7 w-7 animate-spin text-gray-400' />
					</div>
				) : entries.length > 0 ? (
					<ul className='space-y-1.5'>
						{entries.map((entry) => (
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
			</main>

			<LeaderboardRightRail />
		</div>
	);
};

export default CommunityLeaderboardPage;
