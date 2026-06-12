import { useEffect, useState } from "react";
import { Crown, Medal } from "lucide-react";
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

function rankBadge(rank: number) {
	if (rank === 1) return <Crown className='h-4 w-4 text-amber-500' />;
	if (rank === 2) return <Medal className='h-4 w-4 text-zinc-400' />;
	if (rank === 3) return <Medal className='h-4 w-4 text-amber-700' />;
	return <span className='text-sm font-medium text-muted-foreground'>{rank}</span>;
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
	entries,
	loading,
	showLevel,
}: {
	entries: LeaderboardEntry[];
	loading: boolean;
	showLevel: boolean;
}) {
	return (
		<div className='overflow-hidden rounded-md border'>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='text-sm font-medium w-[70px] text-center'>
							Hạng
						</TableHead>
						<TableHead className='text-sm font-medium'>Thành viên</TableHead>
						{showLevel && (
							<TableHead className='text-sm font-medium w-[150px]'>Cấp độ</TableHead>
						)}
						<TableHead className='text-sm font-medium w-[110px] text-right'>
							Điểm
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						Array.from({ length: 8 }).map((_, i) => (
							<TableRow key={i}>
								<TableCell colSpan={showLevel ? 4 : 3}>
									<Skeleton className='h-6 w-full' />
								</TableCell>
							</TableRow>
						))
					) : entries.length > 0 ? (
						entries.map((entry) => (
							<TableRow
								key={entry.user_id}
								className={entry.is_me ? "bg-primary/5" : undefined}>
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
											{entry.full_name}
											{entry.is_me && (
												<Badge variant='secondary' className='ml-2'>
													Bạn
												</Badge>
											)}
										</span>
									</div>
								</TableCell>
								{showLevel && (
									<TableCell>
										{entry.level ? (
											<span className='inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium'>
												{entry.level.badge && (
													<img
														src={resolvePublicAssetUrl(entry.level.badge)}
														alt={`Badge ${entry.level.name}`}
														className='h-5 w-5 object-contain'
													/>
												)}
												{entry.level.name}
											</span>
										) : (
											<span className='text-sm text-muted-foreground'>—</span>
										)}
									</TableCell>
								)}
								<TableCell className='text-right font-semibold'>
									{entry.points}
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell
								colSpan={showLevel ? 4 : 3}
								className='h-32 text-center text-muted-foreground'>
								Chưa có dữ liệu xếp hạng.
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

	const [weekly, setWeekly] = useState<LeaderboardEntry[]>([]);
	const [allTime, setAllTime] = useState<LeaderboardEntry[]>([]);
	const [loadingWeekly, setLoadingWeekly] = useState(true);
	const [loadingAllTime, setLoadingAllTime] = useState(true);

	useEffect(() => {
		let cancelled = false;
		gamificationService
			.getWeeklyLeaderboard()
			.then((res) => !cancelled && setWeekly(res.data))
			.catch(() => !cancelled && toast.error("Không thể tải bảng xếp hạng tuần."))
			.finally(() => !cancelled && setLoadingWeekly(false));

		gamificationService
			.getAllTimeLeaderboard()
			.then((res) => !cancelled && setAllTime(res.data))
			.catch(() => !cancelled && toast.error("Không thể tải bảng xếp hạng tổng."))
			.finally(() => !cancelled && setLoadingAllTime(false));

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Bảng xếp hạng</h2>
					<p className='text-muted-foreground text-sm'>
						Xếp hạng thành viên theo điểm hoạt động — tuần hiện tại và toàn thời gian.
					</p>
				</div>

				<Tabs defaultValue='weekly'>
					<TabsList>
						<TabsTrigger value='weekly'>Tuần này</TabsTrigger>
						<TabsTrigger value='all-time'>Mọi thời điểm</TabsTrigger>
					</TabsList>
					<TabsContent value='weekly' className='mt-4'>
						<LeaderboardTable
							entries={weekly}
							loading={loadingWeekly}
							showLevel={false}
						/>
					</TabsContent>
					<TabsContent value='all-time' className='mt-4'>
						<LeaderboardTable entries={allTime} loading={loadingAllTime} showLevel />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

export default LeaderboardPage;
