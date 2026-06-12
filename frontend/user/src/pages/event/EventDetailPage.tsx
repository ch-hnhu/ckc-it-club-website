import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CalendarCheck, CalendarDays, Loader2, MapPin, Ticket, Users, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { AuthUser } from "@/services/auth.service";
import { eventService } from "@/services/event.service";
import type { EventDetail } from "@/types/event.types";
import { EventStatusBadge } from "@/components/event/EventCard";
import { formatEventDateTime } from "@/lib/eventFormat";
import { renderMarkdownContent } from "@/lib/markdown";

const DetailSkeleton: React.FC = () => (
	<div className='animate-pulse space-y-5'>
		<div className='h-6 w-32 rounded-lg bg-gray-200' />
		<div className='h-9 w-3/4 rounded-lg bg-gray-200' />
		<div className='h-64 w-full rounded-2xl bg-gray-200 md:h-80' />
		<div className='space-y-2'>
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className='h-3.5 rounded bg-gray-200' style={{ width: `${96 - i * 3}%` }} />
			))}
		</div>
	</div>
);

const TicketModal: React.FC<{ qrToken: string; event: EventDetail; onClose: () => void }> = ({
	qrToken,
	event,
	onClose,
}) => (
	<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
		<div className='relative w-full max-w-sm rounded-2xl border-2 border-black bg-white p-7 text-center shadow-[6px_6px_0_#111]'>
			<button
				onClick={onClose}
				className='absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
				<X className='h-4 w-4' />
			</button>
			<Ticket className='mx-auto mb-3 h-8 w-8 text-[var(--color-text-primary)]' />
			<h2 className='font-heading text-lg font-extrabold text-black'>Vé tham dự sự kiện</h2>
			<p className='mt-1 line-clamp-2 text-sm font-semibold text-gray-700'>{event.title}</p>
			<div className='mx-auto mt-5 flex w-fit items-center justify-center rounded-2xl border-2 border-black bg-white p-4'>
				<QRCodeSVG value={qrToken} size={200} />
			</div>
			<p className='mt-4 text-xs text-gray-500'>{formatEventDateTime(event.start_at)}</p>
			{event.location && <p className='text-xs text-gray-500'>{event.location}</p>}
			<p className='mt-4 text-xs font-medium text-gray-400'>
				Xuất trình mã QR này tại bàn check-in để điểm danh tham dự.
			</p>
		</div>
	</div>
);

const EventDetailPage: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const { user } = useOutletContext<{ user: AuthUser | null }>();

	const [event, setEvent] = useState<EventDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [showTicket, setShowTicket] = useState(false);

	useEffect(() => {
		if (!slug) return;
		let cancelled = false;
		setLoading(true);
		setError(null);

		eventService
			.getEvent(slug)
			.then((res) => {
				if (cancelled) return;
				setEvent(res.data);
			})
			.catch(() => {
				if (cancelled) return;
				setError("Không tìm thấy sự kiện hoặc đã có lỗi xảy ra.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [slug]);

	// Chỉ tài khoản email sinh viên Cao Thắng mới được đăng ký tham gia sự kiện
	const registrationBlocked =
		Boolean(user) && !user?.email?.toLowerCase().endsWith("@caothang.edu.vn");

	const handleRegister = async () => {
		if (!event) return;
		if (!user) {
			navigate("/login");
			return;
		}
		if (registrationBlocked) {
			toast.error(
				"Chỉ tài khoản email sinh viên Cao Thắng (@caothang.edu.vn) mới được đăng ký tham gia sự kiện.",
			);
			return;
		}

		setActionLoading(true);
		try {
			const res = await eventService.registerEvent(event.id);
			toast.success("Đăng ký tham gia sự kiện thành công.");
			setEvent((prev) =>
				prev
					? {
							...prev,
							my_registration_status: "registered",
							my_qr_token: res.data.qr_token,
							registrations_count: prev.registrations_count + 1,
						}
					: prev,
			);
		} catch (err) {
			const message =
				(err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
				"Không thể đăng ký. Vui lòng thử lại.";
			toast.error(message);
		} finally {
			setActionLoading(false);
		}
	};

	const handleCancelRegistration = async () => {
		if (!event) return;
		setActionLoading(true);
		try {
			await eventService.cancelRegistration(event.id);
			toast.success("Đã hủy đăng ký tham gia sự kiện.");
			setEvent((prev) =>
				prev
					? {
							...prev,
							my_registration_status: "cancelled",
							my_qr_token: null,
							registrations_count: Math.max(0, prev.registrations_count - 1),
						}
					: prev,
			);
		} catch {
			toast.error("Không thể hủy đăng ký. Vui lòng thử lại.");
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<div className='w-full min-h-screen pt-16'>
			<main className='mx-auto w-full max-w-5xl px-4 pb-16 md:px-6'>
				{/* Breadcrumb */}
				<div className='mb-6 pt-6'>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to='/su-kien' className='text-sm font-semibold text-gray-500 hover:text-black'>
										Sự kiện
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<span className='text-gray-400'>/</span>
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<span className='rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-600'>
									Chi tiết
								</span>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>

				{loading ? (
					<DetailSkeleton />
				) : error || !event ? (
					<div className='flex flex-col items-center justify-center rounded-2xl border-2 border-black bg-white px-8 py-16 text-center shadow-[4px_4px_0_#111]'>
						<p className='font-heading text-xl font-extrabold text-black'>
							{error ?? "Không tìm thấy sự kiện."}
						</p>
						<Link
							to='/su-kien'
							className='mt-5 inline-flex h-10 items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Quay lại danh sách sự kiện
						</Link>
					</div>
				) : (
					<>
						{/* Cover */}
						<div className='mb-8 w-full overflow-hidden rounded-2xl bg-gray-100'>
							{event.thumbnail ? (
								<img
									src={event.thumbnail}
									alt={event.title}
									className='aspect-[16/9] w-full object-cover md:aspect-[21/9]'
								/>
							) : (
								<div className='flex aspect-[16/9] w-full items-center justify-center bg-[var(--color-pastel-blue)] md:aspect-[21/9]'>
									<span className='font-heading text-7xl font-extrabold text-[var(--color-text-primary)] opacity-20'>
										{event.title.charAt(0).toUpperCase()}
									</span>
								</div>
							)}
						</div>

						{/* Header */}
						<div className='mb-3'>
							<EventStatusBadge status={event.status} />
						</div>
						<h1 className='font-heading text-2xl font-extrabold leading-tight text-black md:text-4xl'>
							{event.title}
						</h1>

						{event.description && (
							<p className='mt-4 text-base leading-7 text-gray-600'>{event.description}</p>
						)}

						{/* Info card */}
						<div className='mt-6 grid gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-[3px_3px_0_#111] sm:grid-cols-2'>
							<div className='flex items-start gap-3'>
								<CalendarDays className='mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
								<div>
									<p className='text-xs font-bold uppercase tracking-wide text-gray-400'>Bắt đầu</p>
									<p className='text-sm font-semibold text-black'>
										{formatEventDateTime(event.start_at)}
									</p>
								</div>
							</div>
							<div className='flex items-start gap-3'>
								<CalendarCheck className='mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
								<div>
									<p className='text-xs font-bold uppercase tracking-wide text-gray-400'>Kết thúc</p>
									<p className='text-sm font-semibold text-black'>
										{formatEventDateTime(event.end_at)}
									</p>
								</div>
							</div>
							{event.location && (
								<div className='flex items-start gap-3'>
									<MapPin className='mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
									<div>
										<p className='text-xs font-bold uppercase tracking-wide text-gray-400'>Địa điểm</p>
										<p className='text-sm font-semibold text-black'>{event.location}</p>
									</div>
								</div>
							)}
							<div className='flex items-start gap-3'>
								<Users className='mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
								<div>
									<p className='text-xs font-bold uppercase tracking-wide text-gray-400'>Người tham gia</p>
									<p className='text-sm font-semibold text-black'>
										{event.registrations_count}
										{event.max_attendees ? ` / ${event.max_attendees}` : ""} người đã đăng ký
									</p>
								</div>
							</div>
						</div>

						{/* Actions */}
						{event.is_registration_required &&
							(event.status === "published" ||
								(event.status === "ongoing" && event.my_registration_status === "registered")) && (
							<div className='mt-6 flex flex-wrap items-center gap-3'>
								{event.my_registration_status === "registered" ? (
									<>
										<button
											onClick={() => setShowTicket(true)}
											className='inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											<Ticket className='h-4 w-4' />
											Xem vé QR
										</button>
										{event.status === "published" && (
											<button
												onClick={handleCancelRegistration}
												disabled={actionLoading}
												className='inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-white px-6 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50'>
												{actionLoading && <Loader2 className='h-4 w-4 animate-spin' />}
												Hủy đăng ký
											</button>
										)}
									</>
								) : (
									<div className='flex flex-col items-start gap-2'>
										<button
											onClick={handleRegister}
											disabled={actionLoading || event.is_full || registrationBlocked}
											className='inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50'>
											{actionLoading && <Loader2 className='h-4 w-4 animate-spin' />}
											{event.is_full ? "Sự kiện đã đủ số lượng" : "Đăng ký tham gia"}
										</button>
										{registrationBlocked && (
											<p className='text-sm font-medium text-gray-500'>
												Chỉ tài khoản email sinh viên Cao Thắng (@caothang.edu.vn) mới được đăng
												ký tham gia sự kiện.
											</p>
										)}
									</div>
								)}
							</div>
						)}

						{/* Content */}
						{event.content && (
							<div className='so-editor-outer community-markdown mt-10 border-t-2 border-gray-200 pt-8'>
								<div
									className='s-prose'
									dangerouslySetInnerHTML={{ __html: renderMarkdownContent(event.content) }}
								/>
							</div>
						)}
					</>
				)}
			</main>

			{showTicket && event?.my_qr_token && (
				<TicketModal qrToken={event.my_qr_token} event={event} onClose={() => setShowTicket(false)} />
			)}
		</div>
	);
};

export default EventDetailPage;
