import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { CalendarCheck, CalendarDays, Download, Loader2, MapPin, Ticket, TicketX, Users, X } from "lucide-react";
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

function toSafeFileName(value: string) {
	const normalized = value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return normalized || "event-ticket";
}

const TicketModal: React.FC<{ qrToken: string; event: EventDetail; onClose: () => void }> = ({
	qrToken,
	event,
	onClose,
}) => {
	const qrRef = useRef<SVGSVGElement | null>(null);

	const handleDownloadQr = () => {
		const svg = qrRef.current;

		if (!svg) {
			toast.error("Không thể tải mã QR. Vui lòng thử lại.");
			return;
		}

		const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
		clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		clonedSvg.setAttribute("width", "512");
		clonedSvg.setAttribute("height", "512");

		const svgText = new XMLSerializer().serializeToString(clonedSvg);
		const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
		const svgUrl = URL.createObjectURL(svgBlob);
		const image = new Image();

		image.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = 512;
			canvas.height = 512;
			const context = canvas.getContext("2d");

			if (!context) {
				URL.revokeObjectURL(svgUrl);
				toast.error("Không thể tải mã QR. Vui lòng thử lại.");
				return;
			}

			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			URL.revokeObjectURL(svgUrl);

			const link = document.createElement("a");
			link.href = canvas.toDataURL("image/png");
			link.download = `ve-qr-${toSafeFileName(event.title)}.png`;
			link.click();
			toast.success("Đã tải mã QR vé sự kiện.");
		};

		image.onerror = () => {
			URL.revokeObjectURL(svgUrl);
			toast.error("Không thể tải mã QR. Vui lòng thử lại.");
		};

		image.src = svgUrl;
	};

	return (
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
				<QRCodeSVG ref={qrRef} value={qrToken} size={200} />
			</div>
			<button
				type='button'
				onClick={handleDownloadQr}
				className='neo-btn neo-btn-secondary mx-auto mt-4 inline-flex h-10 items-center gap-2 px-4 text-sm'>
				<Download className='h-4 w-4' />
				Tải QR
			</button>
			<p className='mt-4 text-xs text-gray-500'>{formatEventDateTime(event.start_at)}</p>
			{event.location && <p className='text-xs text-gray-500'>{event.location}</p>}
			<p className='mt-4 text-xs font-medium text-gray-400'>
				Xuất trình mã QR này tại bàn check-in để điểm danh tham dự.
			</p>
		</div>
	</div>
	);
};

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

	// Thành viên CLB = có bất kỳ vai trò nào ngoài "user" thường
	const isClubMember = Boolean(user?.roles?.some((role) => role !== "user"));

	// Chỉ email sinh viên Cao Thắng mới được đăng ký; thành viên CLB được miễn kiểm tra email
	const registrationBlocked =
		Boolean(user) &&
		!isClubMember &&
		!user?.email?.toLowerCase().endsWith("@caothang.edu.vn");

	// Sự kiện chỉ dành cho thành viên CLB — tài khoản chỉ có vai trò "user" không được đăng ký
	const membersOnlyBlocked = Boolean(event?.is_members_only) && Boolean(user) && !isClubMember;

	// Khoảng thời gian mở đăng ký (null = không giới hạn ở phía đó)
	const registrationNotYetOpen = Boolean(
		event?.registration_start_at && new Date(event.registration_start_at) > new Date(),
	);
	const registrationClosed = Boolean(
		event?.registration_end_at && new Date(event.registration_end_at) < new Date(),
	);

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
		if (membersOnlyBlocked) {
			toast.error("Sự kiện này chỉ dành cho thành viên câu lạc bộ.");
			return;
		}
		if (registrationNotYetOpen) {
			toast.error("Sự kiện chưa mở đăng ký. Vui lòng quay lại sau.");
			return;
		}
		if (registrationClosed) {
			toast.error("Đã hết thời gian đăng ký tham gia sự kiện.");
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

	const handleShowTicket = async () => {
		if (!event) return;

		if (event.my_qr_token) {
			setShowTicket(true);
			return;
		}

		setActionLoading(true);
		try {
			const res = await eventService.getMyTicket(event.id);
			setEvent((prev) =>
				prev
					? {
							...prev,
							my_registration_status: "registered",
							my_qr_token: res.data.qr_token,
						}
					: prev,
			);
			setShowTicket(true);
		} catch {
			toast.error("Không thể tải vé QR. Vui lòng thử lại.");
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
							<div className='flex items-start gap-3'>
								<Ticket className='mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
								<div>
									<p className='text-xs font-bold uppercase tracking-wide text-gray-400'>Mở đăng ký</p>
									<p className='text-sm font-semibold text-black'>
										{event.registration_start_at
											? formatEventDateTime(event.registration_start_at)
											: "Ngay khi đăng sự kiện"}
									</p>
								</div>
							</div>
							<div className='flex items-start gap-3'>
								<TicketX className='mt-0.5 h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
								<div>
									<p className='text-xs font-bold uppercase tracking-wide text-gray-400'>Đóng đăng ký</p>
									<p className='text-sm font-semibold text-black'>
										{event.registration_end_at
											? formatEventDateTime(event.registration_end_at)
											: "Đến khi sự kiện bắt đầu"}
									</p>
								</div>
							</div>
						</div>

						{/* Actions */}
						{(event.status === "published" ||
							(event.status === "ongoing" && event.my_registration_status === "registered")) && (
							<div className='mt-6 flex flex-wrap items-center gap-3'>
								{event.my_registration_status === "registered" ? (
									<>
										<button
											onClick={handleShowTicket}
											disabled={actionLoading}
											className='inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											{actionLoading ? (
												<Loader2 className='h-4 w-4 animate-spin' />
											) : (
												<Ticket className='h-4 w-4' />
											)}
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
											disabled={
												actionLoading ||
												event.is_full ||
												registrationBlocked ||
												membersOnlyBlocked ||
												registrationNotYetOpen ||
												registrationClosed
											}
											className='inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50'>
											{actionLoading && <Loader2 className='h-4 w-4 animate-spin' />}
											{membersOnlyBlocked
												? "Dành cho thành viên CLB"
												: registrationNotYetOpen
													? "Chưa mở đăng ký"
													: registrationClosed
														? "Đã hết hạn đăng ký"
														: event.is_full
															? "Sự kiện đã đủ số lượng"
															: "Đăng ký tham gia"}
										</button>
										{registrationBlocked && (
											<p className='text-sm font-medium text-gray-500'>
												Chỉ tài khoản email sinh viên Cao Thắng (@caothang.edu.vn) mới được đăng
												ký tham gia sự kiện.
											</p>
										)}
										{membersOnlyBlocked && (
											<p className='text-sm font-medium text-gray-500'>
												Sự kiện này chỉ dành cho thành viên câu lạc bộ.
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
