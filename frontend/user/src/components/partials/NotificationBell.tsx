import { useEffect, useRef, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import notificationService from "@/services/notification.service";
import echo, { updateEchoAuthToken } from "@/config/echo";
import type { UserNotification } from "@/types/notification.types";
import type { AuthUser } from "@/services/auth.service";
import { formatNotificationTime } from "@/lib/utils";

const POLL_INTERVAL_MS = 30_000;

type Props = { user: AuthUser };

export default function NotificationBell({ user }: Props) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<UserNotification[]>([]);
	const [loading, setLoading] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const [tooltip, setTooltip] = useState<{ item: UserNotification; rect: DOMRect } | null>(null);
	// Derived — always in sync with loaded list, zero race conditions.
	const unreadCount = notifications.filter((n) => !n.read_at).length;
	// Ref-based dedup: tracks IDs already processed by the WS handler.
	// Unlike state-updater dedup, a ref is synchronously updated so even
	// two listeners firing in the same React 18 batch see each other's writes.
	const handledWsIds = useRef<Set<string>>(new Set());

	const fetchAll = async () => {
		try {
			const res = await notificationService.getNotifications();
			setNotifications(res.data.notifications);
		} catch {
			// silently ignore
		}
	};

	// Initial load + polling fallback (fetchAll also re-syncs if WS drops)
	useEffect(() => {
		fetchAll();
		const timer = setInterval(fetchAll, POLL_INTERVAL_MS);
		return () => clearInterval(timer);
	}, []);

	// Reload full list when dropdown opens
	useEffect(() => {
		if (open) {
			setLoading(true);
			fetchAll().finally(() => setLoading(false));
		}
	}, [open]);

	// WebSocket: subscribe to private user channel for real-time notifications
	useEffect(() => {
		if (!echo || !user.id) return;

		// Ensure the auth token is fresh before subscribing to the private channel
		const token = localStorage.getItem("access_token");
		if (token) updateEchoAuthToken(token);

		const channel = echo.private(`App.Models.User.${user.id}`);

		channel
			.listen(".notification.sent", (data: UserNotification) => {
				// Ref-based dedup: synchronous check/mark prevents double-fire
				// even when React 18 batches multiple listeners in one cycle.
				if (!data.id || handledWsIds.current.has(data.id)) return;
				handledWsIds.current.add(data.id);

				setNotifications((prev) => [data, ...prev]);
				// unreadCount re-derives automatically — no extra fetch needed.
			});

		return () => {
			echo?.leave(`App.Models.User.${user.id}`);
		};
	}, [user.id]);

	// Close dropdown on outside click
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
		// unreadCount re-derives automatically from the updated list.
	};

	const handleClickItem = async (n: UserNotification) => {
		if (!n.read_at) await handleMarkAsRead(n.id);
		if (n.data.link) {
			setOpen(false);
			navigate(n.data.link);
		}
	};

	const handleTooltipEnter = useCallback((e: React.MouseEvent<HTMLDivElement>, n: UserNotification) => {
		setTooltip({ item: n, rect: e.currentTarget.getBoundingClientRect() });
	}, []);

	const handleTooltipLeave = useCallback(() => setTooltip(null), []);

	const handleMarkAllAsRead = async () => {
		await notificationService.markAllAsRead();
		setNotifications((prev) =>
			prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
		);
		// unreadCount re-derives automatically from the updated list.
	};

	return (
		<div className='relative' ref={containerRef}>
			<button
				type='button'
				onClick={() => { setOpen((v) => !v); setTooltip(null); }}
				className='relative flex h-11 w-11 items-center justify-center rounded-xl transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'
				aria-label='Thông báo'>
				<Bell className='h-6 w-6 text-gray-700' />
				{unreadCount > 0 && (
					<span
						className='absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white'
						style={{ minHeight: 18 }}>
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className='absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-[var(--neo-radius)] border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
					<div className='flex items-center justify-between border-b-2 border-black px-4 py-3'>
						<h3
							className='font-extrabold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							Thông báo {unreadCount > 0 && `(${unreadCount})`}
						</h3>
						{unreadCount > 0 && (
							<button
								type='button'
								onClick={handleMarkAllAsRead}
								className='flex items-center gap-1 text-xs font-semibold text-[var(--color-text-primary)] transition hover:opacity-70'>
								<CheckCheck className='h-3.5 w-3.5' />
								Đọc tất cả
							</button>
						)}
					</div>

					<div className='max-h-80 overflow-y-auto'>
						{loading && (
							<div className='p-4 text-center text-sm text-gray-500'>Đang tải...</div>
						)}
						{!loading && notifications.length === 0 && (
							<div className='p-6 text-center text-sm text-gray-500'>
								Chưa có thông báo nào.
							</div>
						)}
						{!loading &&
							notifications.map((n) => (
								<div
									key={n.id}
									onClick={() => handleClickItem(n)}
									onMouseEnter={(e) => handleTooltipEnter(e, n)}
									onMouseLeave={handleTooltipLeave}
									className={`cursor-pointer border-b border-gray-100 p-3 transition-colors last:border-0 ${
										!n.read_at
											? "bg-[var(--color-primary-100)] hover:bg-[var(--color-primary-100)]/80"
											: "hover:bg-gray-50"
									}`}>
									<div className='flex items-start gap-2.5'>
										<span
											className={`mt-1.5 block h-2 w-2 shrink-0 rounded-full ${
												!n.read_at
													? "bg-[var(--color-primary-dark)]"
													: "bg-transparent"
											}`}
										/>
										<div className='min-w-0 flex-1'>
											<p className='truncate text-sm font-bold text-black'>
												{n.data.title}
											</p>
											<p className='mt-0.5 line-clamp-2 text-xs text-gray-600'>
												{n.data.message}
											</p>
											<p className='mt-1 text-[11px] text-gray-400'>
												{formatNotificationTime(n.created_at)}
											</p>
										</div>
									</div>
								</div>
							))}
					</div>

					<div className='border-t-2 border-black bg-[var(--color-surface)] p-2 text-center'>
						<Link
							to='/thong-bao'
							onClick={() => setOpen(false)}
							className='inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-extrabold text-[var(--color-text-primary)] transition hover:bg-white'>
							Xem tất cả
						</Link>
					</div>
				</div>
			)}
		{/* ── Tooltip nội dung đầy đủ ─────────────────────────────────────── */}
		{tooltip && open && (() => {
			const GAP = 10;
			const TIP_W = 288;
			// Hiện bên trái dropdown; nếu không đủ chỗ thì hiện bên phải
			const spaceLeft = tooltip.rect.left - GAP;
			const left = spaceLeft >= TIP_W
				? tooltip.rect.left - TIP_W - GAP
				: tooltip.rect.right + GAP;
			// Căn top theo item, đảm bảo không vượt đáy màn hình
			const maxTop = window.innerHeight - 120;
			const top = Math.min(tooltip.rect.top, maxTop);

			return (
				<div
					className='pointer-events-none fixed z-[200] w-72 rounded-xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0_#111]'
					style={{ top, left }}>
					<p className='text-sm font-bold leading-snug text-black'>
						{tooltip.item.data.title}
					</p>
					<p className='mt-1.5 text-xs leading-relaxed text-gray-600'>
						{tooltip.item.data.message}
					</p>
				</div>
			);
		})()}
		</div>
	);
}
