import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { resolvePublicAssetUrl } from "@/lib/utils";
import gamificationService from "@/services/gamification.service";
import type { LeaderboardEntry } from "@/types/gamification.type";
import { Link } from "react-router-dom";

const PER_PAGE = 20;

type TabKey = "weekly" | "all-time";

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

function rankBadge(rank: number) {
	return <span className='text-sm font-medium text-muted-foreground'>#{rank}</span>;
}

function initials(name: string) {
	return name
		.split(" ")
		.map((p) => p[0])
		.slice(-2)
		.join("")
		.toUpperCase();
}

function LeaderboardTable({
	state,
	showMemberRank,
}: {
	state: LeaderboardState;
	showMemberRank: boolean;
}) {
	const initialLoading = state.loadingInitial && state.entries.length === 0;
	const colSpan = showMemberRank ? 4 : 3;

	return (
		<div className='overflow-hidden rounded-md border'>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='text-sm font-medium w-[70px] text-center'>
							Hạng
						</TableHead>
						<TableHead className='text-sm font-medium'>Thành viên</TableHead>
						{showMemberRank && (
							<TableHead className='text-sm font-medium w-[150px]'>Rank</TableHead>
						)}
						<TableHead className='text-sm font-medium w-[110px] text-right'>
							Điểm
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{initialLoading ? (
						Array.from({ length: 8 }).map((_, i) => (
							<TableRow key={i}>
								<TableCell colSpan={colSpan}>
									<Skeleton className='h-6 w-full' />
								</TableCell>
							</TableRow>
						))
					) : state.entries.length > 0 ? (
						state.entries.map((entry) => (
							<TableRow
								key={entry.user_id}
								className={
									entry.is_me ? "bg-primary/5 hover:bg-primary/5" : undefined
								}>
								<TableCell className='text-center'>
									<div className='flex items-center justify-center'>
										{rankBadge(entry.rank)}
									</div>
								</TableCell>
								<TableCell>
									<div className='flex items-center gap-3'>
										<Avatar className='h-8 w-8'>
											<AvatarImage src={entry.avatar ?? undefined} />
											<AvatarFallback className='text-xs'>
												{initials(entry.full_name)}
											</AvatarFallback>
										</Avatar>
										<span className='font-medium'>
											<Link to={`/users/${entry.user_id}`}>
												{entry.full_name}
											</Link>
											{entry.is_me && (
												<span className='inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ml-2'>
													Bạn
												</span>
											)}
										</span>
									</div>
								</TableCell>
								{showMemberRank && (
									<TableCell>
										{entry.member_rank ? (
											<span className='inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium'>
												{entry.member_rank.badge && (
													<img
														src={resolvePublicAssetUrl(
															entry.member_rank.badge,
														)}
														alt={`Badge ${entry.member_rank.name}`}
														className='h-5 w-5 object-contain'
													/>
												)}
												{entry.member_rank.name}
											</span>
										) : (
											<span className='text-sm text-muted-foreground'>—</span>
										)}
									</TableCell>
								)}
								<TableCell className='text-right font-semibold'>
									{entry.points} XP
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={colSpan}
								className='h-32 text-center text-muted-foreground'>
								Chưa có dữ liệu xếp hạng.
							</TableCell>
						</TableRow>
					)}

					{state.loadingMore && (
						<TableRow>
							<TableCell
								colSpan={colSpan}
								className='h-12 text-center text-sm text-muted-foreground'>
								Đang tải thêm...
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

function LeaderboardPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Bảng xếp hạng" }]);

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
				toast.error(
					scope === "weekly"
						? "Không thể tải bảng xếp hạng tuần."
						: "Không thể tải bảng xếp hạng tổng.",
				);
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

	const activeState = tab === "weekly" ? weekly : allTime;

	const handleLoadMore = useCallback(() => {
		if (!activeState.hasMore || activeState.loadingInitial || activeState.loadingMore) return;

		void loadLeaderboardPage(tab, activeState.page + 1);
	}, [
		activeState.hasMore,
		activeState.loadingInitial,
		activeState.loadingMore,
		activeState.page,
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
			{ rootMargin: "160px 0px", threshold: 0.1 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [handleLoadMore]);

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Bảng xếp hạng</h2>
					<p className='text-muted-foreground text-sm'>
						Xếp hạng thành viên theo điểm hoạt động — tuần hiện tại và toàn thời gian.
					</p>
				</div>

				<Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
					<TabsList>
						<TabsTrigger value='weekly'>Weekly</TabsTrigger>
						<TabsTrigger value='all-time'>All Time</TabsTrigger>
					</TabsList>
					<TabsContent value='weekly' className='mt-4'>
						<LeaderboardTable state={weekly} showMemberRank />
					</TabsContent>
					<TabsContent value='all-time' className='mt-4'>
						<LeaderboardTable state={allTime} showMemberRank />
					</TabsContent>
				</Tabs>

				<div ref={sentinelRef} className='h-2' />

				{!activeState.hasMore && activeState.entries.length > 0 && (
					<p className='pb-2 text-center text-xs text-muted-foreground'>
						Đã hiển thị tất cả {activeState.total} thành viên.
					</p>
				)}
			</div>
		</div>
	);
}

export default LeaderboardPage;
