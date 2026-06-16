import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Award, History, Loader2, TrendingUp, Trophy } from "lucide-react";
import type { AuthUser } from "@/services/auth.service";
import { gamificationService } from "@/services/gamification.service";
import type { GamificationMe, PointHistoryItem } from "@/types/gamification.types";

type OutletCtx = { user: AuthUser | null; loadingUser: boolean };
const HISTORY_PER_PAGE = 5;

function StatCard({
	label,
	value,
	icon,
	accent,
}: {
	label: string;
	value: React.ReactNode;
	icon: React.ReactNode;
	accent: string;
}) {
	return (
		<div
			className='rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111]'
			style={{ background: accent }}>
			<div className='mb-2 flex items-center gap-2 text-sm font-semibold text-black/70'>
				{icon}
				{label}
			</div>
			<div className='font-heading text-3xl font-extrabold text-black'>{value}</div>
		</div>
	);
}

const dtf = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

function formatDate(value: string) {
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dtf.format(d);
}

const MyPointsPage: React.FC = () => {
	const { user, loadingUser } = useOutletContext<OutletCtx>();

	const [me, setMe] = useState<GamificationMe | null>(null);
	const [totalUsers, setTotalUsers] = useState<number | null>(null);
	const [history, setHistory] = useState<PointHistoryItem[]>([]);
	const [historyPage, setHistoryPage] = useState(1);
	const [historyHasMore, setHistoryHasMore] = useState(false);
	const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (loadingUser) return;
		if (!user) {
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);

		Promise.all([
			gamificationService.getMe(),
			gamificationService.getHistory(1, HISTORY_PER_PAGE),
			gamificationService.getAllTimeLeaderboard(1, 1),
		])
			.then(([meRes, historyRes, leaderboardRes]) => {
				if (cancelled) return;
				setMe(meRes.data);
				setTotalUsers(leaderboardRes.meta.total);
				setHistory(historyRes.data);
				setHistoryPage(historyRes.meta.current_page);
				setHistoryHasMore(historyRes.meta.current_page < historyRes.meta.last_page);
			})
			.catch(() => {
				if (cancelled) return;
				setHistoryHasMore(false);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [user, loadingUser]);

	if (loadingUser || loading) {
		return (
			<div className='flex min-h-[60vh] items-center justify-center pt-20'>
				<Loader2 className='h-8 w-8 animate-spin text-gray-400' />
			</div>
		);
	}

	if (!user) {
		return (
			<div className='mx-auto max-w-2xl px-4 pb-16 pt-24 text-center md:pt-28'>
				<Trophy className='mx-auto mb-4 h-12 w-12 text-gray-300' />
				<h1 className='font-heading text-2xl font-extrabold'>Điểm của tôi</h1>
				<p className='mt-2 text-gray-600'>
					Vui lòng đăng nhập để xem điểm hoạt động của bạn.
				</p>
				<Link
					to='/login'
					className='mt-6 inline-block rounded-lg border-2 border-black bg-white px-6 py-2.5 font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					Đăng nhập
				</Link>
			</div>
		);
	}

	const progress = me?.progress_percent ?? null;

	const handleLoadMoreHistory = () => {
		if (loadingMoreHistory || !historyHasMore) return;

		const nextPage = historyPage + 1;
		setLoadingMoreHistory(true);

		gamificationService
			.getHistory(nextPage, HISTORY_PER_PAGE)
			.then((res) => {
				setHistory((prev) => [...prev, ...res.data]);
				setHistoryPage(res.meta.current_page);
				setHistoryHasMore(res.meta.current_page < res.meta.last_page);
			})
			.catch(() => {})
			.finally(() => setLoadingMoreHistory(false));
	};

	return (
		<div className='mx-auto w-full max-w-4xl px-4 pb-12 pt-24 md:pt-28'>
			<div className='mb-8 flex items-center justify-between'>
				<div>
					<h1 className='font-heading text-3xl font-extrabold text-black'>
						Điểm của tôi
					</h1>
					<p className='mt-1 text-gray-600'>
						Theo dõi điểm hoạt động, rank và lịch sử tích điểm của bạn.
					</p>
				</div>
				<Link
					to='/cong-dong/bang-xep-hang'
					className='hidden items-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none sm:flex'>
					<Trophy className='h-4 w-4' />
					Bảng xếp hạng
				</Link>
			</div>

			{/* Rank card */}
			<div className='mb-6 flex flex-col items-center gap-5 rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111] sm:flex-row sm:p-8'>
				<div className='flex h-24 w-24 shrink-0 items-center justify-center'>
					{me?.current_rank?.badge ? (
						<img
							src={me.current_rank.badge}
							alt={me.current_rank.name}
							className='h-24 w-24 object-contain'
						/>
					) : (
						<Award className='h-12 w-12 text-black/30' />
					)}
				</div>
				<div className='flex-1 text-center sm:text-left'>
					<p className='text-sm font-semibold text-gray-500'>Rank hiện tại</p>
					<p className='font-heading text-2xl font-extrabold text-black'>
						{me?.current_rank?.name ?? "Chưa có rank"}
					</p>
					{me?.next_rank ? (
						<>
							<div className='mt-3 h-3 w-full overflow-hidden rounded-full border-2 border-black bg-gray-100'>
								<div
									className='h-full rounded-full bg-[var(--color-pastel-green,#86efac)] transition-all'
									style={{ width: `${progress ?? 0}%` }}
								/>
							</div>
							<p className='mt-2 text-sm text-gray-600'>
								Còn <span className='font-bold'>{me.points_to_next_rank}</span> điểm
								để lên <span className='font-bold'>{me.next_rank.name}</span>
							</p>
						</>
					) : (
						<p className='mt-2 text-sm text-gray-600'>
							Bạn đã đạt rank cao nhất. Tuyệt vời!
						</p>
					)}
				</div>
			</div>

			{/* Stats */}
			<div className='mb-8 grid gap-4 sm:grid-cols-3'>
				<StatCard
					label='Tổng điểm'
					value={me?.total_points ?? 0}
					icon={<Award className='h-4 w-4' />}
					accent='var(--color-pastel-blue,#dbeafe)'
				/>
				<StatCard
					label='Điểm tuần này'
					value={me?.week_points ?? 0}
					icon={<TrendingUp className='h-4 w-4' />}
					accent='var(--color-pastel-green,#dcfce7)'
				/>
				<StatCard
					label='Rank all-time'
					value={`${me?.rank_all_time ?? "-"} / ${totalUsers ?? "-"}`}
					icon={<Trophy className='h-4 w-4' />}
					accent='var(--color-pastel-pink,#fce7f3)'
				/>
			</div>

			{/* History */}
			<div className='rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
				<div className='flex items-center gap-2 border-b-2 border-black px-5 py-4'>
					<History className='h-5 w-5' />
					<h2 className='font-heading text-lg font-extrabold'>Lịch sử tích điểm</h2>
				</div>
				{history.length > 0 ? (
					<>
						<ul className='divide-y divide-gray-100'>
							{history.map((item) => (
								<li
									key={item.id}
									className='flex items-center justify-between px-5 py-3.5'>
									<div>
										<p className='font-medium text-black'>
											{item.rule ?? item.rule_key ?? "Hoạt động"}
										</p>
										<p className='text-xs text-gray-500'>
											{formatDate(item.created_at)}
										</p>
									</div>
									<span
										className={`font-heading text-lg font-extrabold ${
											item.points >= 0 ? "text-emerald-600" : "text-red-500"
										}`}>
										{item.points >= 0 ? "+" : ""}
										{item.points}
									</span>
								</li>
							))}
						</ul>
						{historyHasMore && (
							<div className='border-t-2 border-black px-5 py-4 text-center'>
								<button
									type='button'
									onClick={handleLoadMoreHistory}
									disabled={loadingMoreHistory}
									className='inline-flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-white px-3 py-2 text-xs font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none sm:px-4 sm:text-sm'>
									{loadingMoreHistory && (
										<Loader2 className='h-4 w-4 animate-spin' />
									)}
									{loadingMoreHistory ? "Đang tải..." : "Tải thêm"}
								</button>
							</div>
						)}
					</>
				) : (
					<div className='px-5 py-12 text-center text-gray-500'>
						Chưa có hoạt động nào tích điểm. Hãy đăng bài, bình luận để nhận điểm!
					</div>
				)}
			</div>
		</div>
	);
};

export default MyPointsPage;
