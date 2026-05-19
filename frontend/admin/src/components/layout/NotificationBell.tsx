import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import notificationService from "@/services/notification.service";
import type { Notification } from "@/types/notification.type";

const POLL_INTERVAL_MS = 10_000;

function timeAgo(isoString: string): string {
	const diff = Date.now() - new Date(isoString).getTime();
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return "Vừa xong";
	if (minutes < 60) return `${minutes} phút trước`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} giờ trước`;
	return `${Math.floor(hours / 24)} ngày trước`;
}

function NotificationBell() {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const fetchAll = async () => {
		try {
			const res = await notificationService.getNotifications();
			setNotifications(res.data.notifications);
			setUnreadCount(res.data.unread_count);
		} catch {
			// silently ignore
		}
	};

	const fetchUnreadCount = async () => {
		try {
			const res = await notificationService.getUnreadCount();
			setUnreadCount(res.data.count);
		} catch {
			// silently ignore
		}
	};

	// On mount: load full list + start polling unread count
	useEffect(() => {
		fetchAll();
		const timer = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
		return () => clearInterval(timer);
	}, []);

	// Reload full list when dropdown opens
	useEffect(() => {
		if (open) {
			setLoading(true);
			fetchAll().finally(() => setLoading(false));
		}
	}, [open]);

	// Close on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleMarkAsRead = async (id: string) => {
		await notificationService.markAsRead(id);
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
		);
		setUnreadCount((c) => Math.max(0, c - 1));
	};

	const handleClickItem = async (n: Notification) => {
		if (!n.read_at) await handleMarkAsRead(n.id);
		if (n.data.link) {
			setOpen(false);
			navigate(n.data.link);
		}
	};

	const handleMarkAllAsRead = async () => {
		await notificationService.markAllAsRead();
		setNotifications((prev) =>
			prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
		);
		setUnreadCount(0);
	};

	return (
		<div className='relative' ref={containerRef}>
			<button
				onClick={() => setOpen((v) => !v)}
				className='p-2 hover:bg-[#f5f5f5] dark:hover:bg-zinc-900 rounded-lg transition-colors relative'>
				<Bell className='w-5 h-5 text-[#1a1a1a] dark:text-zinc-100' />
				{unreadCount > 0 && (
					<span className='absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-destructive rounded-full text-[10px] text-white flex items-center justify-center leading-none'>
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className='absolute right-0 mt-2 w-80 z-50 bg-white dark:bg-zinc-950 rounded-lg border border-[#e0e0e0] dark:border-zinc-800 shadow-lg'>
					<div className='p-3 border-b border-[#e0e0e0] dark:border-zinc-800 flex items-center justify-between'>
						<h3 className='font-semibold text-[#1a1a1a] dark:text-zinc-100'>
							Thông báo {unreadCount > 0 && `(${unreadCount})`}
						</h3>
						{unreadCount > 0 && (
							<button
								onClick={handleMarkAllAsRead}
								className='flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors'>
								<CheckCheck className='w-3.5 h-3.5' />
								Đọc tất cả
							</button>
						)}
					</div>

					<div className='max-h-80 overflow-y-auto'>
						{loading && (
							<div className='p-4 text-center text-sm text-muted-foreground'>
								Đang tải...
							</div>
						)}
						{!loading && notifications.length === 0 && (
							<div className='p-4 text-center text-sm text-muted-foreground'>
								Không có thông báo nào.
							</div>
						)}
						{!loading &&
							notifications.map((n) => (
								<div
									key={n.id}
									onClick={() => handleClickItem(n)}
									className={`p-3 border-b border-[#e5e5e5] dark:border-zinc-800 transition-colors ${n.data.link || !n.read_at ? "cursor-pointer" : ""} ${!n.read_at ? "bg-[#5f822f]/[0.06] dark:bg-green-950/10 hover:bg-[#5f822f]/[0.1] dark:hover:bg-green-950/20" : "hover:bg-[#f5f5f5] dark:hover:bg-zinc-900"}`}>
									<div className='flex items-start gap-2'>
										<div className='mt-1.5 shrink-0 w-2'>
											{!n.read_at && (
												<span className='block w-2 h-2 rounded-full bg-[#5f822f]' />
											)}
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-[#1a1a1a] dark:text-zinc-100 truncate'>
												{n.data.title}
											</p>
											<p className='text-xs text-[#666666] dark:text-zinc-400 mt-0.5 line-clamp-2'>
												{n.data.message}
											</p>
											<p className='text-xs text-[#999999] dark:text-zinc-500 mt-1'>
												{timeAgo(n.created_at)}
											</p>
										</div>
									</div>
								</div>
							))}
					</div>

					<div className='p-2 border-t border-[#e0e0e0] dark:border-zinc-800 text-center'>
						<Link
							to='/notifications'
							onClick={() => setOpen(false)}
							className='text-xs text-[#5f822f] dark:text-zinc-200 hover:underline'>
							Tất cả thông báo
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}

export default NotificationBell;
