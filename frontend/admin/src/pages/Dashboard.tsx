import userService from "@/services/user.service";
import dashboardService from "@/services/dashboard.service";
import notificationService from "@/services/notification.service";
import type { User } from "@/types/user.type";
import type { DashboardStats } from "@/services/dashboard.service";
import type { Notification } from "@/types/notification.type";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
	Users,
	CalendarDays,
	GraduationCap,
	Flag,
	ChevronRight,
	AlertTriangle,
	FileWarning,
	UserPlus,
	Mail,
	Bell,
	Award,
	FolderKanban,
	ListTodo,
	RefreshCw,
} from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { ChartCard } from "../components/dashboard/ChartCard";
import { SimpleChart } from "../components/dashboard/SimpleChart";
import { TrendChart } from "../components/dashboard/TrendChart";
import { DonutChart } from "../components/dashboard/DonutChart";
import { HBarChart } from "../components/dashboard/HBarChart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
	const date = new Date(iso);
	const diff = Date.now() - date.getTime();
	const mins = Math.round(diff / 60000);
	if (mins < 1) return "vừa xong";
	if (mins < 60) return `${mins} phút trước`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours} giờ trước`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days} ngày trước`;
	return date.toLocaleDateString("vi-VN");
}

function eventDateParts(iso: string | null): { day: string; month: string } {
	if (!iso) return { day: "--", month: "" };
	const date = new Date(iso);
	return {
		day: date.toLocaleDateString("vi-VN", { day: "2-digit" }),
		month: `Thg ${date.getMonth() + 1}`,
	};
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface QueueItem {
	label: string;
	count: number;
	link: string;
	permission: string;
	tone: "danger" | "warning" | "accent";
	icon: React.ReactNode;
}

const toneClasses: Record<QueueItem["tone"], string> = {
	danger: "bg-destructive/10 text-destructive",
	warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
	accent: "bg-primary/10 text-primary",
};

// ─── Mini stat (dải thống kê phụ, gọn hơn StatCard) ──────────────────────────

interface MiniStatProps {
	icon: React.ReactNode;
	label: string;
	value: string | number;
	sub?: string;
	to?: string;
}

function MiniStat({ icon, label, value, sub, to }: MiniStatProps) {
	const content = (
		<div className='flex items-center gap-3 px-4 py-3'>
			<span className='w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4'>
				{icon}
			</span>
			<div className='min-w-0'>
				<div className='flex items-baseline gap-1.5'>
					<span className='text-xl font-bold text-foreground leading-none'>{value}</span>
					{sub && <span className='text-xs text-muted-foreground truncate'>{sub}</span>}
				</div>
				<p className='text-xs text-muted-foreground mt-1 truncate'>{label}</p>
			</div>
		</div>
	);

	return to ? (
		<Link to={to} className='block rounded-lg hover:bg-muted/60 transition-colors'>
			{content}
		</Link>
	) : (
		content
	);
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function StatCardSkeleton() {
	return (
		<Card className='border border-border bg-card p-6'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex-1 space-y-3'>
					<Skeleton className='h-4 w-24' />
					<Skeleton className='h-8 w-16' />
				</div>
				<Skeleton className='w-11 h-11 rounded-xl' />
			</div>
		</Card>
	);
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<div className='space-y-4'>
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className='flex items-center gap-3'>
					<Skeleton className='w-9 h-9 rounded-lg flex-shrink-0' />
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-3.5 w-3/4' />
						<Skeleton className='h-3 w-1/2' />
					</div>
				</div>
			))}
		</div>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

function Dashboard() {
	const { user: authUser, hasPermission } = useAuth();
	const [user, setUser] = useState<User | null>(null);

	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [trendMonths, setTrendMonths] = useState<6 | 12>(6);

	const [activities, setActivities] = useState<Notification[]>([]);
	const [activitiesLoading, setActivitiesLoading] = useState(true);

	const breadcrumb = useMemo(() => [{ title: "Dashboard", link: "/" }], []);
	useBreadcrumb(breadcrumb);

	useEffect(() => {
		userService
			.getMe()
			.then((res) => res.success && setUser(res.data))
			.catch((err) => console.error("Failed to fetch user", err));
	}, []);

	// Thống kê tổng quan — hiển thị đầy đủ số liệu cho mọi tài khoản có quyền
	// dashboard.view; việc điều hướng vào từng trang quản lý vẫn do quyền
	// riêng của trang đó quyết định (xem các prop `to`/`hasPermission` bên dưới).
	const fetchStats = useCallback(
		(months: 6 | 12) =>
			dashboardService
				.getStats(months)
				.then(setStats)
				.catch((err) => console.error("Failed to fetch dashboard stats", err)),
		[],
	);

	const fetchActivities = useCallback(
		() =>
			notificationService
				.getNotifications(1, 6)
				.then((res) => setActivities(res.data.notifications))
				.catch(() => setActivities([])),
		[],
	);

	useEffect(() => {
		setLoading(true);
		Promise.all([fetchStats(trendMonths), fetchActivities()]).finally(() => {
			setLoading(false);
			setActivitiesLoading(false);
		});
		// Chỉ chạy lần đầu; đổi khoảng thời gian và refresh có handler riêng.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleTrendMonthsChange = (value: string) => {
		const months = Number(value) === 12 ? 12 : 6;
		setTrendMonths(months);
		fetchStats(months);
	};

	const handleRefresh = () => {
		setRefreshing(true);
		Promise.all([fetchStats(trendMonths), fetchActivities()]).finally(() =>
			setRefreshing(false),
		);
	};

	const queue = useMemo<QueueItem[]>(() => {
		if (!stats) return [];
		return [
			{
				label: "Báo cáo vi phạm",
				count: stats.queue.reports_pending,
				link: "/community/reports",
				permission: "community.reports.view",
				tone: "danger" as const,
				icon: <AlertTriangle className='w-4 h-4' />,
			},
			{
				label: "Tài nguyên chờ duyệt",
				count: stats.queue.resources_pending_review,
				link: "/community/resources",
				permission: "community.resources.view",
				tone: "warning" as const,
				icon: <FileWarning className='w-4 h-4' />,
			},
			{
				label: "Đơn tuyển thành viên",
				count: stats.queue.applications_pending,
				link: "/requests",
				permission: "applications.view",
				tone: "accent" as const,
				icon: <UserPlus className='w-4 h-4' />,
			},
			{
				label: "Liên hệ chưa xử lý",
				count: stats.queue.contacts_pending,
				link: "/contacts",
				permission: "contacts.view",
				tone: "accent" as const,
				icon: <Mail className='w-4 h-4' />,
			},
		];
	}, [stats]);

	const contentChart = useMemo(() => {
		if (!stats) return [];
		return [
			{ name: "Bài đăng", value: stats.community.posts_total },
			{ name: "Blog", value: stats.community.blogs_total },
			{ name: "Bình luận", value: stats.community.comments_total },
			{ name: "Tài nguyên", value: stats.community.resources_total },
		];
	}, [stats]);

	// Top khoá học: tách "hoàn thành" và "đang học" để xếp chồng trên thanh ngang
	const topCoursesChart = useMemo(() => {
		if (!stats) return [];
		return stats.learning.top_courses.map((course) => ({
			name: course.title,
			completed: course.completed_count,
			in_progress: course.enrollments_count - course.completed_count,
		}));
	}, [stats]);

	const enrollmentDonut = useMemo(() => {
		if (!stats) return [];
		return [
			{
				name: "Hoàn thành",
				value: stats.learning.enrollments_completed,
				color: "#16a34a",
			},
			{
				name: "Đang học",
				value: stats.learning.enrollments_total - stats.learning.enrollments_completed,
				color: "#3b82f6",
			},
		];
	}, [stats]);

	const memberRolesChart = useMemo(() => {
		if (!stats) return [];
		return stats.members.by_role.map((item) => ({
			name: item.label,
			count: item.count,
		}));
	}, [stats]);

	const eventStatusDonut = useMemo(() => {
		if (!stats) return [];
		const s = stats.events.by_status;
		return [
			{ name: "Đã đăng", value: s.published, color: "#16a34a" },
			{ name: "Đang diễn ra", value: s.ongoing, color: "#3b82f6" },
			{ name: "Bản nháp", value: s.draft, color: "#d97706" },
			{ name: "Đã kết thúc", value: s.ended, color: "#64748b" },
			{ name: "Đã hủy", value: s.cancelled, color: "#e11d48" },
		];
	}, [stats]);

	// Tiến độ task ProjectHub (tỷ lệ đã xong trên tổng số task)
	const tasksTotal = stats ? stats.projecthub.tasks_open + stats.projecthub.tasks_completed : 0;
	const tasksDonePercent =
		stats && tasksTotal > 0
			? Math.round((stats.projecthub.tasks_completed / tasksTotal) * 100)
			: 0;

	const upcomingEvents = stats?.events.upcoming ?? [];
	const totalPending = queue.reduce((sum, item) => sum + item.count, 0);
	const ongoingCount = stats?.events.ongoing ?? 0;

	return (
		<main className='flex-1 overflow-auto bg-background'>
			{/* Header */}
			<div className='border-b border-border bg-background sticky top-0 z-10'>
				<div className='px-6 py-4 flex items-center justify-between gap-4'>
					<div>
						<h1 className='text-3xl font-bold text-foreground'>
							{user
								? `Xin chào, ${user.full_name || user.email}`
								: authUser
									? `Xin chào, ${authUser.full_name || authUser.email}`
									: "Dashboard"}
						</h1>
						<p className='text-sm text-muted-foreground mt-1'>
							Tổng quan hoạt động câu lạc bộ
						</p>
					</div>
					<Button
						variant='outline'
						size='sm'
						onClick={handleRefresh}
						disabled={loading || refreshing}>
						<RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
						<span className='hidden sm:inline'>Làm mới</span>
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className='p-6 space-y-6'>
				{/* KPI Grid */}
				{loading ? (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
						{Array.from({ length: 4 }).map((_, i) => (
							<StatCardSkeleton key={i} />
						))}
					</div>
				) : (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
						<StatCard
							icon={<Users />}
							title='Thành viên'
							value={stats?.members.total ?? "—"}
							suffix={stats ? "người" : undefined}
							to={hasPermission("users.view") ? "/users" : undefined}
						/>
						<StatCard
							icon={<CalendarDays />}
							title='Sự kiện đang mở'
							value={stats ? stats.events.published + stats.events.ongoing : "—"}
							description={
								ongoingCount > 0 ? `${ongoingCount} đang diễn ra` : undefined
							}
							to={hasPermission("events.view") ? "/events" : undefined}
						/>
						<StatCard
							icon={<GraduationCap />}
							title='Khoá học'
							value={stats?.courses.total ?? "—"}
							to={hasPermission("courses.view") ? "/courses" : undefined}
						/>
						<StatCard
							icon={<Flag />}
							title='Chờ xử lý'
							value={stats ? totalPending : "—"}
							suffix={stats ? "mục" : undefined}
							description={
								stats && totalPending === 0 ? "Đã xử lý hết, tuyệt vời!" : undefined
							}
							tone={totalPending > 0 ? "danger" : "default"}
						/>
					</div>
				)}

				{/* Học tập — top khoá học + trạng thái ghi danh */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					<div className='lg:col-span-2'>
						<ChartCard
							title='Top khoá học theo lượt ghi danh'
							description='5 khoá học có nhiều lượt ghi danh nhất, tách theo tiến độ học'
							action={
								hasPermission("courses.view") ? (
									<Link to='/courses' className='text-xs text-primary hover:underline'>
										Xem tất cả
									</Link>
								) : undefined
							}>
							{loading ? (
								<Skeleton className='h-[240px] w-full' />
							) : topCoursesChart.length ? (
								<HBarChart
									data={topCoursesChart}
									series={[
										{ key: "completed", label: "Hoàn thành", color: "#16a34a" },
										{ key: "in_progress", label: "Đang học", color: "#3b82f6" },
									]}
									stacked
									height={240}
									labelWidth={150}
								/>
							) : (
								<div className='h-[240px] flex items-center justify-center text-sm text-muted-foreground'>
									Chưa có lượt ghi danh nào
								</div>
							)}
						</ChartCard>
					</div>

					<ChartCard
						title='Trạng thái ghi danh'
						description={
							stats
								? `${stats.learning.enrollments_total} lượt ghi danh khoá học`
								: undefined
						}>
						{loading ? (
							<Skeleton className='h-[240px] w-full' />
						) : stats && stats.learning.enrollments_total > 0 ? (
							<>
								<DonutChart
									data={enrollmentDonut}
									centerValue={`${stats.learning.completion_rate}%`}
									centerLabel='hoàn thành'
									height={170}
								/>
								<div className='mt-4 pt-3 border-t border-border flex items-center gap-2 text-sm'>
									<Award className='w-4 h-4 text-primary flex-shrink-0' />
									<span className='text-muted-foreground flex-1'>Chứng chỉ đã cấp</span>
									<span className='font-semibold text-foreground tabular-nums'>
										{stats.learning.certificates_issued}
									</span>
								</div>
							</>
						) : (
							<div className='h-[240px] flex items-center justify-center text-sm text-muted-foreground'>
								Chưa có lượt ghi danh nào
							</div>
						)}
					</ChartCard>
				</div>

				{/* Trend chart + Action queue */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					<div className='lg:col-span-2'>
						<ChartCard
							title='Xu hướng hoạt động'
							description='Thành viên mới, bài đăng và đăng ký sự kiện theo tháng'
							action={
								<Tabs
									value={String(trendMonths)}
									onValueChange={handleTrendMonthsChange}>
									<TabsList>
										<TabsTrigger value='6'>6 tháng</TabsTrigger>
										<TabsTrigger value='12'>12 tháng</TabsTrigger>
									</TabsList>
								</Tabs>
							}>
							{loading ? (
								<Skeleton className='h-[280px] w-full' />
							) : stats?.trends.length ? (
								<TrendChart data={stats.trends} height={280} />
							) : (
								<div className='h-[280px] flex items-center justify-center text-sm text-muted-foreground'>
									Không có dữ liệu để hiển thị
								</div>
							)}
						</ChartCard>
					</div>

					<Card className='border border-border bg-card p-6'>
						<h3 className='text-lg font-bold text-foreground mb-4'>Hàng chờ cần xử lý</h3>
						{loading ? (
							<ListSkeleton rows={4} />
						) : queue.length ? (
							<div className='space-y-1'>
								{queue.map((item) => {
									const canAccess = hasPermission(item.permission);
									const content = (
										<>
											<div className='flex items-center gap-3'>
												<span
													className={`w-8 h-8 rounded-lg flex items-center justify-center ${
														item.count > 0
															? toneClasses[item.tone]
															: "bg-muted text-muted-foreground"
													}`}>
													{item.icon}
												</span>
												<span
													className={`text-sm ${
														canAccess ? "group-hover:text-primary transition-colors" : ""
													} ${item.count > 0 ? "text-foreground" : "text-muted-foreground"}`}>
													{item.label}
												</span>
											</div>
											<div className='flex items-center gap-2'>
												<span
													className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
														item.count > 0
															? toneClasses[item.tone]
															: "bg-muted text-muted-foreground"
													}`}>
													{item.count}
												</span>
												{canAccess && (
													<ChevronRight className='w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors' />
												)}
											</div>
										</>
									);

									return canAccess ? (
										<Link
											key={item.link}
											to={item.link}
											className='flex items-center justify-between py-3 border-b border-border last:border-0 group'>
											{content}
										</Link>
									) : (
										<div
											key={item.link}
											className='flex items-center justify-between py-3 border-b border-border last:border-0'>
											{content}
										</div>
									);
								})}
							</div>
						) : (
							<p className='text-sm text-muted-foreground py-8 text-center'>
								Không có mục nào cần xử lý
							</p>
						)}
					</Card>
				</div>

				{/* Thành viên theo vai trò + Sự kiện theo trạng thái + Nội dung cộng đồng */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					<ChartCard
						title='Thành viên theo vai trò'
						description={stats ? `${stats.members.total} tài khoản trên hệ thống` : undefined}
						action={
							hasPermission("users.view") ? (
								<Link to='/users' className='text-xs text-primary hover:underline'>
									Xem tất cả
								</Link>
							) : undefined
						}>
						{loading ? (
							<Skeleton className='h-[240px] w-full' />
						) : memberRolesChart.length ? (
							<HBarChart
								data={memberRolesChart}
								series={[{ key: "count", label: "Số người", color: "#0d9488" }]}
								height={240}
								labelWidth={150}
							/>
						) : (
							<div className='h-[240px] flex items-center justify-center text-sm text-muted-foreground'>
								Không có dữ liệu để hiển thị
							</div>
						)}
					</ChartCard>

					<ChartCard
						title='Sự kiện theo trạng thái'
						description={stats ? `${stats.events.total} sự kiện đã tạo` : undefined}
						action={
							hasPermission("events.view") ? (
								<Link to='/events' className='text-xs text-primary hover:underline'>
									Xem tất cả
								</Link>
							) : undefined
						}>
						{loading ? (
							<Skeleton className='h-[240px] w-full' />
						) : stats && stats.events.total > 0 ? (
							<DonutChart
								data={eventStatusDonut}
								centerValue={String(stats.events.total)}
								centerLabel='sự kiện'
								height={160}
							/>
						) : (
							<div className='h-[240px] flex items-center justify-center text-sm text-muted-foreground'>
								Chưa có sự kiện nào
							</div>
						)}
					</ChartCard>

					{/* Community content */}
					<ChartCard
						title='Nội dung cộng đồng'
						description='Tổng số theo từng loại'>
						{loading ? (
							<Skeleton className='h-[240px] w-full' />
						) : contentChart.length ? (
							<SimpleChart
								type='bar'
								data={contentChart}
								dataKey='value'
								height={240}
								color='#16a34a'
							/>
						) : (
							<div className='h-[240px] flex items-center justify-center text-sm text-muted-foreground'>
								Không có dữ liệu để hiển thị
							</div>
						)}
					</ChartCard>
				</div>

				{/* Upcoming events + ProjectHub + Recent activity */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					{/* Upcoming events */}
					<Card className='border border-border bg-card p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-lg font-bold text-foreground'>Sự kiện sắp diễn ra</h3>
							{hasPermission("events.view") && (
								<Link
									to='/events'
									className='text-xs text-primary hover:underline'>
									Xem tất cả
								</Link>
							)}
						</div>
						{loading ? (
							<ListSkeleton rows={4} />
						) : upcomingEvents.length ? (
							<div className='space-y-3'>
								{upcomingEvents.map((event) => {
									const { day, month } = eventDateParts(event.start_at);
									const canAccess = hasPermission("events.view");
									// Tỷ lệ lấp đầy đăng ký (chỉ khi sự kiện giới hạn số lượng)
									const fillPercent = event.max_attendees
										? Math.min(
												100,
												Math.round(
													(event.registrations_count / event.max_attendees) * 100,
												),
											)
										: null;
									const content = (
										<>
											<div className='text-center bg-primary/10 rounded-lg px-2.5 py-1.5 min-w-[52px]'>
												<div className='text-base font-bold text-primary leading-none'>
													{day}
												</div>
												<div className='text-[11px] text-primary/80 mt-0.5'>{month}</div>
											</div>
											<div className='min-w-0 flex-1'>
												<p
													className={`text-sm font-medium text-foreground truncate ${
														canAccess ? "group-hover:text-primary transition-colors" : ""
													}`}>
													{event.title}
												</p>
												<div className='flex items-center gap-2 mt-1'>
													<p className='text-xs text-muted-foreground whitespace-nowrap'>
														{event.registrations_count}
														{event.max_attendees ? `/${event.max_attendees}` : ""} đăng ký
													</p>
													{fillPercent !== null && (
														<>
															<div className='flex-1 h-1.5 rounded-full bg-muted overflow-hidden'>
																<div
																	className={`h-full rounded-full ${
																		fillPercent >= 90
																			? "bg-amber-500"
																			: "bg-primary"
																	}`}
																	style={{ width: `${fillPercent}%` }}
																/>
															</div>
															<span className='text-[11px] text-muted-foreground tabular-nums'>
																{fillPercent}%
															</span>
														</>
													)}
												</div>
											</div>
										</>
									);

									return canAccess ? (
										<Link key={event.id} to={`/events/${event.id}`} className='flex items-center gap-3 py-1 group'>
											{content}
										</Link>
									) : (
										<div key={event.id} className='flex items-center gap-3 py-1'>
											{content}
										</div>
									);
								})}
							</div>
						) : (
							<div className='flex flex-col items-center justify-center py-10 gap-3'>
								<span className='w-12 h-12 rounded-full bg-muted flex items-center justify-center'>
									<CalendarDays className='w-5 h-5 text-muted-foreground/60' />
								</span>
								<p className='text-sm text-muted-foreground'>Chưa có sự kiện sắp tới</p>
							</div>
						)}
					</Card>

					{/* ProjectHub */}
					<Card className='border border-border bg-card p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-lg font-bold text-foreground'>ProjectHub</h3>
							{hasPermission("admin_panel.access") && (
								<Link to='/to-do-list' className='text-xs text-primary hover:underline'>
									Xem tất cả
								</Link>
							)}
						</div>
						{loading ? (
							<ListSkeleton rows={3} />
						) : stats ? (
							<div className='space-y-5'>
								<div className='grid grid-cols-2 divide-x divide-border rounded-lg border border-border'>
									<MiniStat
										icon={<FolderKanban />}
										label='Board đang hoạt động'
										value={stats.projecthub.boards_active}
									/>
									<MiniStat
										icon={<ListTodo />}
										label='Task đang mở'
										value={stats.projecthub.tasks_open}
									/>
								</div>
								<div>
									<div className='flex items-center justify-between text-sm mb-2'>
										<span className='text-muted-foreground'>Tiến độ task</span>
										<span className='font-semibold text-foreground tabular-nums'>
											{stats.projecthub.tasks_completed}/{tasksTotal} ({tasksDonePercent}
											%)
										</span>
									</div>
									<div className='h-2.5 rounded-full bg-muted overflow-hidden'>
										<div
											className='h-full rounded-full bg-[#16a34a] transition-all'
											style={{ width: `${tasksDonePercent}%` }}
										/>
									</div>
									<p className='text-xs text-muted-foreground mt-2'>
										{stats.projecthub.tasks_completed} task đã hoàn thành,{" "}
										{stats.projecthub.tasks_open} task đang mở
									</p>
								</div>
							</div>
						) : (
							<p className='text-sm text-muted-foreground py-8 text-center'>
								Không có dữ liệu để hiển thị
							</p>
						)}
					</Card>

					{/* Recent activity */}
					<Card className='border border-border bg-card p-6'>
						<h3 className='text-lg font-bold text-foreground mb-4'>Hoạt động gần đây</h3>
						{activitiesLoading ? (
							<ListSkeleton rows={5} />
						) : activities.length ? (
							<div className='space-y-4'>
								{activities.map((item) => (
									<div key={item.id} className='flex items-start gap-3'>
										<span className='w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0'>
											<Bell className='w-4 h-4' />
										</span>
										<div className='min-w-0 flex-1'>
											<p className='text-sm text-foreground'>{item.data.title}</p>
											<p className='text-xs text-muted-foreground mt-0.5 truncate'>
												{item.data.message}
											</p>
										</div>
										<span className='text-xs text-muted-foreground whitespace-nowrap flex-shrink-0'>
											{relativeTime(item.created_at)}
										</span>
									</div>
								))}
							</div>
						) : (
							<div className='flex flex-col items-center justify-center py-10 gap-3'>
								<span className='w-12 h-12 rounded-full bg-muted flex items-center justify-center'>
									<Bell className='w-5 h-5 text-muted-foreground/60' />
								</span>
								<p className='text-sm text-muted-foreground'>Chưa có hoạt động nào</p>
								<p className='text-xs text-muted-foreground/70 text-center max-w-[260px]'>
									Thông báo về đơn tuyển, bài đăng và sự kiện sẽ hiển thị tại đây.
								</p>
							</div>
						)}
					</Card>
				</div>
			</div>
		</main>
	);
}

export default Dashboard;
