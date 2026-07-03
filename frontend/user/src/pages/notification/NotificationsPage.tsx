import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, ChevronLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import notificationService from "@/services/notification.service";
import type { AuthUser } from "@/services/auth.service";
import type { UserNotification } from "@/types/notification.types";
import { buildAvatar, formatNotificationTime } from "@/lib/utils";
import { AvatarImage } from "@/components/ui/AvatarImage";

const PER_PAGE = 20;

type MainLayoutContext = {
	user: AuthUser | null;
	loadingUser: boolean;
};

function NotificationsPage() {
	const navigate = useNavigate();
	const { user, loadingUser } = useOutletContext<MainLayoutContext>();
	const hasAccessToken = Boolean(localStorage.getItem("access_token"));
	const [notifications, setNotifications] = useState<UserNotification[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [total, setTotal] = useState(0);
	const [unreadCount, setUnreadCount] = useState(0);
	const sentinelRef = useRef<HTMLDivElement>(null);

	const loadPage = useCallback(async (pageNum: number) => {
		setLoading(true);
		setError("");
		try {
			const res = await notificationService.getNotifications(pageNum, PER_PAGE);
			const { notifications: items, has_more, total: nextTotal, unread_count } = res.data;
			setNotifications((prev) => (pageNum === 1 ? items : [...prev, ...items]));
			setHasMore(has_more);
			setTotal(nextTotal);
			setUnreadCount(unread_count);
			return true;
		} catch {
			setError("Không thể tải thông báo. Vui lòng thử lại sau.");
			return false;
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (loadingUser || !user) return;

		setPage(1);
		setNotifications([]);
		setHasMore(true);
		void loadPage(1);
	}, [loadPage, loadingUser, user]);

	const handleLoadMore = useCallback(async () => {
		if (loading || !hasMore) return;

		const nextPage = page + 1;
		const ok = await loadPage(nextPage);
		if (ok) setPage(nextPage);
	}, [hasMore, loadPage, loading, page]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || loadingUser || !user) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					void handleLoadMore();
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [handleLoadMore, loadingUser, user]);

	const handleMarkAsRead = async (id: string) => {
		await notificationService.markAsRead(id);
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
		);
		setUnreadCount((count) => Math.max(0, count - 1));
	};

	const handleClickItem = async (notification: UserNotification) => {
		if (!notification.read_at) await handleMarkAsRead(notification.id);
		if (notification.data.link) navigate(notification.data.link);
	};

	const handleMarkAllAsRead = async () => {
		await notificationService.markAllAsRead();
		setNotifications((prev) =>
			prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
		);
		setUnreadCount(0);
	};

	if (loadingUser && hasAccessToken) {
		return (
			<section className='neo-section bg-[var(--color-surface)] pt-28'>
				<div className='neo-container'>
					<div className='neo-card neo-card-static mx-auto flex max-w-xl items-center justify-center gap-3 p-8 text-sm font-bold text-gray-600'>
						<Loader2 className='h-5 w-5 animate-spin' />
						Đang kiểm tra tài khoản...
					</div>
				</div>
			</section>
		);
	}

	if (!hasAccessToken || !user) {
		return (
			<section className='neo-section bg-[var(--color-surface)] pt-28'>
				<div className='neo-container'>
					<div className='neo-card neo-card-static mx-auto max-w-xl bg-[var(--color-pastel-yellow)] p-8 text-center'>
						<Bell className='mx-auto h-10 w-10' />
						<h1 className='mt-4 text-2xl font-extrabold'>Thông báo của bạn</h1>
						<p className='mt-2 text-sm text-gray-700'>
							Đăng nhập để xem các cập nhật từ cộng đồng CKC IT Club.
						</p>
						<Link to='/login?returnTo=/thong-bao' className='neo-btn neo-btn-primary mt-6'>
							Đăng nhập
						</Link>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className='neo-section min-h-screen bg-[var(--color-surface)] pt-28'>
			<div className='neo-container max-w-4xl'>
				<Link
					to='/'
					className='mb-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--color-text-primary)] transition hover:opacity-70'>
					<ChevronLeft className='h-4 w-4' />
					Trang chủ
				</Link>

				<div className='neo-card neo-card-static bg-[var(--color-pastel-green)] p-5 sm:p-6'>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<span className='neo-tag bg-white'>Notification Center</span>
							<h1 className='mt-3 text-3xl font-extrabold sm:text-4xl'>
								Thông báo
							</h1>
							{total > 0 && (
								<p className='mt-2 text-sm font-semibold text-gray-700'>
									{total} thông báo
									{unreadCount > 0 && ` · ${unreadCount} chưa đọc`}
								</p>
							)}
						</div>

						{unreadCount > 0 && (
							<button
								type='button'
								onClick={handleMarkAllAsRead}
								className='neo-btn neo-btn-secondary self-start sm:self-center'>
								<CheckCheck className='h-4 w-4' />
								Đánh dấu đã đọc
							</button>
						)}
					</div>
				</div>

				<div className='neo-card neo-card-static mt-6 overflow-hidden bg-white'>
					{notifications.length === 0 && !loading && (
						<div className='flex flex-col items-center gap-3 px-6 py-16 text-center text-gray-600'>
							<Bell className='h-10 w-10 opacity-50' />
							<p className='text-sm font-bold'>Chưa có thông báo nào.</p>
						</div>
					)}

					{notifications.map((notification) => {
						const isUnread = !notification.read_at;
						const actor = notification.data.actor;

						return (
							<button
								type='button'
								key={notification.id}
								onClick={() => handleClickItem(notification)}
								className={`flex w-full items-start gap-3 border-b-2 border-black px-4 py-4 text-left transition-colors last:border-b-0 sm:px-5 ${
									isUnread
										? "bg-[var(--color-primary-100)] hover:bg-[var(--color-pastel-green)]"
										: "bg-white hover:bg-[var(--color-surface)]"
								}`}>
								<span className='relative shrink-0'>
									<AvatarImage
										fallbackName={actor.full_name}
										src={buildAvatar(actor.full_name, actor.avatar)}
										alt={actor.full_name}
										className='h-11 w-11 rounded-full border-2 border-black object-cover'
									/>
									{isUnread && (
										<span className='absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-black bg-[var(--color-primary-dark)]' />
									)}
								</span>

								<span className='min-w-0 flex-1'>
									<span className='block text-sm font-extrabold text-black'>
										{notification.data.title}
									</span>
									<span className='mt-1 block text-sm leading-6 text-gray-600'>
										{notification.data.message}
									</span>
									<span className='mt-2 block text-xs font-bold text-gray-400'>
										{formatNotificationTime(notification.created_at)}
									</span>
								</span>
							</button>
						);
					})}

					{loading && (
						<div className='flex items-center justify-center gap-2 px-6 py-5 text-sm font-bold text-gray-500'>
							<Loader2 className='h-4 w-4 animate-spin' />
							Đang tải...
						</div>
					)}
				</div>

				{error && (
					<p className='mt-4 rounded-xl border-2 border-black bg-[var(--color-pastel-pink)] px-4 py-3 text-center text-sm font-bold'>
						{error}
					</p>
				)}

				<div ref={sentinelRef} className='h-2' />

				{hasMore && notifications.length > 0 && (
					<div className='mt-6 flex justify-center'>
						<button
							type='button'
							onClick={handleLoadMore}
							disabled={loading}
							className='neo-btn neo-btn-secondary disabled:cursor-not-allowed disabled:opacity-60'>
							{loading ? "Đang tải..." : "Tải thêm 20 thông báo"}
						</button>
					</div>
				)}

				{!hasMore && notifications.length > 0 && (
					<p className='mt-6 text-center text-xs font-bold text-gray-500'>
						Đã hiển thị tất cả {total} thông báo.
					</p>
				)}
			</div>
		</section>
	);
}

export default NotificationsPage;
