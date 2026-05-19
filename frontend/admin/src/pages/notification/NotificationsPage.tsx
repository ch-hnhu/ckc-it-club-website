import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCheck, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import notificationService from "@/services/notification.service";
import type { Notification } from "@/types/notification.type";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { timeAgo } from "@/lib/utils";

const PER_PAGE = 20;

function NotificationsPage() {
	useBreadcrumb([{ title: "Thông báo" }]);
	const navigate = useNavigate();

	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [total, setTotal] = useState(0);
	const [unreadCount, setUnreadCount] = useState(0);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const loadPage = useCallback(async (pageNum: number) => {
		setLoading(true);
		try {
			const res = await notificationService.getNotifications(pageNum, PER_PAGE);
			const { notifications: items, has_more, total: t, unread_count } = res.data;
			setNotifications((prev) => (pageNum === 1 ? items : [...prev, ...items]));
			setHasMore(has_more);
			setTotal(t);
			setUnreadCount(unread_count);
		} catch {
			// silently ignore
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadPage(1);
	}, [loadPage]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					setPage((prev) => {
						const next = prev + 1;
						loadPage(next);
						return next;
					});
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [hasMore, loading, loadPage]);

	const handleMarkAsRead = async (id: string) => {
		await notificationService.markAsRead(id);
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
		);
		setUnreadCount((c) => Math.max(0, c - 1));
	};

	const handleClickItem = async (n: Notification) => {
		if (!n.read_at) await handleMarkAsRead(n.id);
		if (n.data.link) navigate(n.data.link);
	};

	const handleMarkAllAsRead = async () => {
		await notificationService.markAllAsRead();
		setNotifications((prev) =>
			prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
		);
		setUnreadCount(0);
	};

	return (
		<div className='flex flex-col gap-4 p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-semibold'>Thông báo</h1>
					{total > 0 && (
						<p className='text-sm text-muted-foreground mt-0.5'>
							{total} thông báo{unreadCount > 0 && ` · ${unreadCount} chưa đọc`}
						</p>
					)}
				</div>
				{unreadCount > 0 && (
					<Button
						variant='outline'
						size='sm'
						onClick={handleMarkAllAsRead}
						className='gap-1.5'>
						<CheckCheck className='w-4 h-4' />
						Đánh dấu đã đọc tất cả
					</Button>
				)}
			</div>

			<div className='rounded-lg border border-[#e0e0e0] dark:border-zinc-800 overflow-hidden'>
				{notifications.length === 0 && !loading && (
					<div className='flex flex-col items-center gap-2 py-16 text-muted-foreground'>
						<Bell className='w-8 h-8 opacity-40' />
						<p className='text-sm'>Không có thông báo nào.</p>
					</div>
				)}

				{notifications.map((n) => (
					<div
						key={n.id}
						onClick={() => handleClickItem(n)}
						className={`flex items-start gap-3 px-4 py-3 border-b border-[#e5e5e5] dark:border-zinc-800 last:border-b-0 transition-colors
							${n.data.link || !n.read_at ? "cursor-pointer" : ""}
							${!n.read_at ? "bg-[#5f822f]/[0.06] dark:bg-green-950/10 hover:bg-[#5f822f]/[0.1] dark:hover:bg-green-950/20" : "hover:bg-[#f5f5f5] dark:hover:bg-zinc-900"}
						`}>
						<div className='mt-1.5 shrink-0 w-2'>
							{!n.read_at && (
								<span className='block w-2 h-2 rounded-full bg-[#5f822f]' />
							)}
						</div>

						<div className='flex-1 min-w-0'>
							<p
								className={`text-sm ${!n.read_at ? "font-medium" : "font-normal"} text-[#1a1a1a] dark:text-zinc-100`}>
								{n.data.title}
							</p>
							<p className='text-sm text-[#666666] dark:text-zinc-400 mt-0.5'>
								{n.data.message}
							</p>
							<p className='text-xs text-[#999999] dark:text-zinc-500 mt-1'>
								{timeAgo(n.created_at)}
							</p>
						</div>
					</div>
				))}

				{loading && (
					<div className='py-4 text-center text-sm text-muted-foreground'>
						Đang tải...
					</div>
				)}
			</div>

			<div ref={sentinelRef} className='h-1' />

			{!hasMore && notifications.length > 0 && (
				<p className='text-center text-xs text-muted-foreground pb-2'>
					Đã hiển thị tất cả {total} thông báo.
				</p>
			)}
		</div>
	);
}

export default NotificationsPage;
