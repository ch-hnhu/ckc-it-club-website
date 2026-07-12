import userService from "@/services/user.service";
import dashboardService from "@/services/dashboard.service";
import notificationService from "@/services/notification.service";
import type { User } from "@/types/user.type";
import type { DashboardUpcomingEvent } from "@/services/dashboard.service";
import type { Notification } from "@/types/notification.type";
import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { StatCard } from "../components/dashboard/StatCard";
import { ChartCard } from "../components/dashboard/ChartCard";
import { SimpleChart } from "../components/dashboard/SimpleChart";
import { Card } from "@/components/ui/card";
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

// ─── Component ───────────────────────────────────────────────────────────────

function Dashboard() {
	const { user: authUser, hasPermission } = useAuth();
	const [user, setUser] = useState<User | null>(null);

	const [memberCount, setMemberCount] = useState<number | null>(null);
	const [courseCount, setCourseCount] = useState<number | null>(null);
	const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
	const [ongoingCount, setOngoingCount] = useState<number>(0);

	const [queue, setQueue] = useState<QueueItem[]>([]);
	const [contentChart, setContentChart] = useState<{ name: string; value: number }[]>([]);
	const [upcomingEvents, setUpcomingEvents] = useState<DashboardUpcomingEvent[]>([]);
	const [activities, setActivities] = useState<Notification[]>([]);

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
	useEffect(() => {
		dashboardService
			.getStats()
			.then((stats) => {
				setMemberCount(stats.members.total);
				setCourseCount(stats.courses.total);
				setUpcomingCount(stats.events.published + stats.events.ongoing);
				setOngoingCount(stats.events.ongoing);
				setUpcomingEvents(stats.events.upcoming);

				setContentChart([
					{ name: "Bài đăng", value: stats.community.posts_total },
					{ name: "Blog", value: stats.community.blogs_total },
					{ name: "Bình luận", value: stats.community.comments_total },
					{ name: "Tài nguyên", value: stats.community.resources_total },
				]);

				setQueue([
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
				]);
			})
			.catch((err) => console.error("Failed to fetch dashboard stats", err));
	}, []);

	// Recent activity (admin notifications feed)
	useEffect(() => {
		notificationService
			.getNotifications(1, 6)
			.then((res) => setActivities(res.data.notifications))
			.catch(() => setActivities([]));
	}, []);

	const totalPending = queue.reduce((sum, item) => sum + item.count, 0);

	return (
		<main className='flex-1 overflow-auto bg-background'>
			{/* Header */}
			<div className='border-b border-border bg-background sticky top-0 z-10'>
				<div className='px-6 py-4 flex items-center justify-between'>
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
				</div>
			</div>

			{/* Content */}
			<div className='p-6 space-y-6'>
				{/* KPI Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					<StatCard
						icon={<Users />}
						title='Thành viên'
						value={memberCount ?? "—"}
						suffix={memberCount !== null ? "người" : undefined}
						to={hasPermission("users.view") ? "/users" : undefined}
					/>
					<StatCard
						icon={<CalendarDays />}
						title='Sự kiện đang mở'
						value={upcomingCount ?? "—"}
						description={
							ongoingCount > 0 ? `${ongoingCount} đang diễn ra` : undefined
						}
						to={hasPermission("events.view") ? "/events" : undefined}
					/>
					<StatCard
						icon={<GraduationCap />}
						title='Khoá học'
						value={courseCount ?? "—"}
						to={hasPermission("courses.view") ? "/courses" : undefined}
					/>
					<StatCard
						icon={<Flag />}
						title='Chờ xử lý'
						value={queue.length ? totalPending : "—"}
						suffix={queue.length ? "mục" : undefined}
						description={
							queue.length && totalPending === 0
								? "Đã xử lý hết, tuyệt vời!"
								: undefined
						}
						tone={totalPending > 0 ? "danger" : "default"}
					/>
				</div>

				{/* Chart + Action queue */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
					<div className='lg:col-span-2'>
						<ChartCard
							title='Nội dung cộng đồng'
							description='Tổng số theo từng loại nội dung'>
							{contentChart.length ? (
								<SimpleChart
									type='bar'
									data={contentChart}
									dataKey='value'
									height={260}
									color='#22c55e'
								/>
							) : (
								<div className='h-[260px] flex items-center justify-center text-sm text-muted-foreground'>
									Không có dữ liệu để hiển thị
								</div>
							)}
						</ChartCard>
					</div>

					<Card className='border border-border bg-card p-6'>
						<h3 className='text-lg font-bold text-foreground mb-4'>Hàng chờ cần xử lý</h3>
						{queue.length ? (
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

				{/* Upcoming events + Recent activity */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
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
						{upcomingEvents.length ? (
							<div className='space-y-3'>
								{upcomingEvents.map((event) => {
									const { day, month } = eventDateParts(event.start_at);
									const canAccess = hasPermission("events.view");
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
												<p className='text-xs text-muted-foreground mt-0.5'>
													{event.registrations_count}
													{event.max_attendees ? `/${event.max_attendees}` : ""} đăng ký
												</p>
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

					{/* Recent activity */}
					<Card className='border border-border bg-card p-6'>
						<h3 className='text-lg font-bold text-foreground mb-4'>Hoạt động gần đây</h3>
						{activities.length ? (
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
