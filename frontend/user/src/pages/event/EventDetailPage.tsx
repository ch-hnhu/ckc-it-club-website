import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { CalendarCheck, CalendarDays, Download, ExternalLink, Loader2, MapPin, MessageSquareText, Star, Ticket, TicketX, Users, X } from "lucide-react";
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
import type { EventDetail, EventFeedbackItem } from "@/types/event.types";
import { EventStatusBadge } from "@/components/event/EventCard";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { formatEventDateTime } from "@/lib/eventFormat";
import { renderMarkdownContent } from "@/lib/markdown";

const GALLERY_PAGE_SIZE = 3;
const FEEDBACK_PAGE_SIZE = 3;

const StarDisplay: React.FC<{ rating: number; size?: "sm" | "md" }> = ({ rating, size = "md" }) => {
	const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
	return (
		<div className='flex items-center gap-0.5'>
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={`${dim} ${
						star <= rating
							? "fill-[var(--color-pastel-amber)] text-[var(--color-pastel-amber)]"
							: "text-gray-300"
					}`}
				/>
			))}
		</div>
	);
};

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

	const handleDownloadQr = async () => {
		const svg = qrRef.current;
		if (!svg) {
			toast.error("Không thể tải mã QR. Vui lòng thử lại.");
			return;
		}

		try {
			// Đảm bảo web-font đã sẵn sàng để vẽ chữ đúng kiểu thiết kế.
			if (document.fonts?.ready) await document.fonts.ready;

			// 1. Render QR (SVG) ra ảnh để vẽ lên vé.
			const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
				const cloned = svg.cloneNode(true) as SVGSVGElement;
				cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
				cloned.setAttribute("width", "480");
				cloned.setAttribute("height", "480");
				const url = URL.createObjectURL(
					new Blob([new XMLSerializer().serializeToString(cloned)], {
						type: "image/svg+xml;charset=utf-8",
					}),
				);
				const img = new Image();
				img.onload = () => {
					URL.revokeObjectURL(url);
					resolve(img);
				};
				img.onerror = () => {
					URL.revokeObjectURL(url);
					reject(new Error("qr render failed"));
				};
				img.src = url;
			});

			// 2. Bố cục vé (giống modal trên web): card trắng, viền đen, bóng đổ.
			const HEADING = '"Be Vietnam Pro", sans-serif';
			const BODY = '"Inter", sans-serif';
			const W = 600;
			const shadow = 14;
			const pad = 48;
			const cardW = W - shadow;
			const contentW = cardW - pad * 2;
			const cx = cardW / 2;

			const measure = document.createElement("canvas").getContext("2d")!;
			const wrap = (text: string, font: string, maxW: number): string[] => {
				measure.font = font;
				const lines: string[] = [];
				let line = "";
				for (const word of text.split(/\s+/)) {
					const test = line ? `${line} ${word}` : word;
					if (measure.measureText(test).width > maxW && line) {
						lines.push(line);
						line = word;
					} else {
						line = test;
					}
				}
				if (line) lines.push(line);
				return lines;
			};

			const titleFont = `600 22px ${HEADING}`;
			const detailFont = `500 15px ${BODY}`;
			const noteFont = `500 13px ${BODY}`;
			const note = "Xuất trình mã QR này tại bàn check-in để điểm danh tham dự.";

			const titleLines = wrap(event.title, titleFont, contentW);
			const detailLines: string[] = [];
			const dateText = formatEventDateTime(event.start_at);
			if (dateText) detailLines.push(...wrap(dateText, detailFont, contentW));
			if (event.location) detailLines.push(...wrap(event.location, detailFont, contentW));
			const noteLines = wrap(note, noteFont, contentW);
			const qrBox = 300;

			// Tính chiều cao động theo số dòng (mỗi mốc là baseline / cạnh trên).
			let y = 52;
			const headingY = y + 24; // baseline tiêu đề (~28px)
			y += 44; // hết chữ tiêu đề
			const accentY = y; // cạnh trên thanh accent
			y += 7 + 26; // chiều cao thanh + khoảng cách xuống tên sự kiện
			const titleY = y + 18; // baseline dòng tên sự kiện đầu tiên
			y += titleLines.length * 30 + 4;
			const detailY = y + 15;
			y += detailLines.length ? detailLines.length * 22 + 24 : 10;
			const qrY = y;
			y += qrBox + 28;
			const noteY = y + 13;
			y += noteLines.length * 20 + 44;
			const H = y;

			// 3. Vẽ lên canvas hi-res (2x).
			const scale = 2;
			const canvas = document.createElement("canvas");
			canvas.width = W * scale;
			canvas.height = H * scale;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				toast.error("Không thể tải mã QR. Vui lòng thử lại.");
				return;
			}
			ctx.scale(scale, scale);
			ctx.textBaseline = "alphabetic";

			const roundRect = (x: number, ry: number, w: number, h: number, r: number) => {
				ctx.beginPath();
				ctx.moveTo(x + r, ry);
				ctx.arcTo(x + w, ry, x + w, ry + h, r);
				ctx.arcTo(x + w, ry + h, x, ry + h, r);
				ctx.arcTo(x, ry + h, x, ry, r);
				ctx.arcTo(x, ry, x + w, ry, r);
				ctx.closePath();
			};

			// Nền trong suốt → fill toàn canvas trắng cho ảnh PNG.
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, W, H);

			// Bóng đổ neo-brutalist.
			ctx.fillStyle = "#111111";
			roundRect(shadow, shadow, cardW, H - shadow - 2, 26);
			ctx.fill();
			// Card trắng + viền đen.
			ctx.fillStyle = "#ffffff";
			roundRect(0, 0, cardW, H - shadow - 2, 26);
			ctx.fill();
			ctx.lineWidth = 4;
			ctx.strokeStyle = "#111111";
			roundRect(0, 0, cardW, H - shadow - 2, 26);
			ctx.stroke();

			ctx.textAlign = "center";

			// Tiêu đề.
			ctx.fillStyle = "#111111";
			ctx.font = `800 28px ${HEADING}`;
			ctx.fillText("Vé tham dự sự kiện", cx, headingY);

			// Thanh accent lime.
			ctx.fillStyle = "#a3e635";
			roundRect(cx - 32, accentY, 64, 7, 4);
			ctx.fill();

			// Tên sự kiện.
			ctx.fillStyle = "#374151";
			ctx.font = titleFont;
			titleLines.forEach((line, i) => ctx.fillText(line, cx, titleY + i * 30));

			// Thời gian & địa điểm.
			if (detailLines.length) {
				ctx.fillStyle = "#6b7280";
				ctx.font = detailFont;
				detailLines.forEach((line, i) => ctx.fillText(line, cx, detailY + i * 22));
			}

			// Khung QR.
			const boxX = cx - qrBox / 2;
			ctx.fillStyle = "#ffffff";
			roundRect(boxX, qrY, qrBox, qrBox, 18);
			ctx.fill();
			ctx.lineWidth = 4;
			ctx.strokeStyle = "#111111";
			roundRect(boxX, qrY, qrBox, qrBox, 18);
			ctx.stroke();
			const qrInner = qrBox - 40;
			ctx.drawImage(qrImg, cx - qrInner / 2, qrY + 20, qrInner, qrInner);

			// Ghi chú.
			ctx.fillStyle = "#9ca3af";
			ctx.font = noteFont;
			noteLines.forEach((line, i) => ctx.fillText(line, cx, noteY + i * 20));

			const link = document.createElement("a");
			link.href = canvas.toDataURL("image/png");
			link.download = `ve-qr-${toSafeFileName(event.title)}.png`;
			link.click();
			toast.success("Đã tải mã QR vé sự kiện.");
		} catch {
			toast.error("Không thể tải mã QR. Vui lòng thử lại.");
		}
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

	const [feedbacks, setFeedbacks] = useState<EventFeedbackItem[]>([]);
	const [feedbackPage, setFeedbackPage] = useState(1);
	const [feedbackHasMore, setFeedbackHasMore] = useState(false);
	const [loadingMoreFeedback, setLoadingMoreFeedback] = useState(false);
	const [ratingInput, setRatingInput] = useState(0);
	const [hoverRating, setHoverRating] = useState(0);
	const [commentInput, setCommentInput] = useState("");
	const [submittingFeedback, setSubmittingFeedback] = useState(false);
	const [galleryVisible, setGalleryVisible] = useState(GALLERY_PAGE_SIZE);
	const [lightbox, setLightbox] = useState<string | null>(null);

	// Deep-link tới phản hồi của một người (mở từ trang admin: ?feedback_user=<id>)
	const [searchParams, setSearchParams] = useSearchParams();
	const focusFeedbackUserId = searchParams.get("feedback_user")
		? Number(searchParams.get("feedback_user"))
		: null;
	const [highlightedFeedbackId, setHighlightedFeedbackId] = useState<number | null>(null);
	const feedbackItemRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

	// Khi sự kiện đã kết thúc: nạp danh sách đánh giá và điền sẵn đánh giá của người dùng (nếu có)
	useEffect(() => {
		if (!event || event.status !== "ended") return;

		if (event.my_feedback) {
			setRatingInput(event.my_feedback.rating);
			setCommentInput(event.my_feedback.comment ?? "");
		}

		if ((event.feedback_summary?.total ?? 0) > 0) {
			let cancelled = false;
			eventService
				.getFeedbacks(event.id, { page: 1, per_page: FEEDBACK_PAGE_SIZE })
				.then((res) => {
					if (cancelled) return;
					setFeedbacks(res.data);
					setFeedbackPage(1);
					setFeedbackHasMore(res.meta.current_page < res.meta.last_page);
				})
				.catch(() => {});
			return () => {
				cancelled = true;
			};
		}
	}, [event?.id, event?.status, event?.my_feedback, event?.feedback_summary?.total]);

	const handleLoadMoreFeedbacks = useCallback(async () => {
		if (!event) return;
		const next = feedbackPage + 1;
		setLoadingMoreFeedback(true);
		try {
			const res = await eventService.getFeedbacks(event.id, { page: next, per_page: FEEDBACK_PAGE_SIZE });
			setFeedbacks((prev) => [...prev, ...res.data]);
			setFeedbackPage(next);
			setFeedbackHasMore(res.meta.current_page < res.meta.last_page);
		} catch {
			toast.error("Không thể tải thêm đánh giá. Vui lòng thử lại.");
		} finally {
			setLoadingMoreFeedback(false);
		}
	}, [event, feedbackPage]);

	const clearFeedbackParam = useCallback(() => {
		setSearchParams(
			(prev) => {
				const next = new URLSearchParams(prev);
				next.delete("feedback_user");
				return next;
			},
			{ replace: true },
		);
	}, [setSearchParams]);

	// Tự tải thêm trang phản hồi tới khi tìm thấy người được chỉ định, rồi cuộn + làm nổi
	useEffect(() => {
		if (focusFeedbackUserId == null) return;
		if (!event || event.status !== "ended") return;

		if ((event.feedback_summary?.total ?? 0) === 0) {
			toast("Người này chưa có phản hồi cho sự kiện.");
			clearFeedbackParam();
			return;
		}

		if (feedbacks.length === 0) return; // đang tải trang đầu

		const target = feedbacks.find((fb) => fb.user?.id === focusFeedbackUserId);
		if (target) {
			setHighlightedFeedbackId(target.id);
			requestAnimationFrame(() => {
				feedbackItemRefs.current[target.id]?.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			});
			clearFeedbackParam();
			return;
		}

		if (feedbackHasMore && !loadingMoreFeedback) {
			void handleLoadMoreFeedbacks();
			return;
		}

		if (!feedbackHasMore) {
			toast("Không tìm thấy phản hồi của người này.");
			clearFeedbackParam();
		}
	}, [
		focusFeedbackUserId,
		event,
		feedbacks,
		feedbackHasMore,
		loadingMoreFeedback,
		handleLoadMoreFeedbacks,
		clearFeedbackParam,
	]);

	useEffect(() => {
		if (highlightedFeedbackId == null) return;
		const timer = window.setTimeout(() => setHighlightedFeedbackId(null), 3000);
		return () => window.clearTimeout(timer);
	}, [highlightedFeedbackId]);

	const handleSubmitFeedback = async () => {
		if (!event) return;
		if (ratingInput < 1) {
			toast.error("Vui lòng chọn số sao đánh giá.");
			return;
		}

		setSubmittingFeedback(true);
		try {
			await eventService.submitFeedback(event.id, {
				rating: ratingInput,
				comment: commentInput.trim() || null,
			});
			toast.success("Cảm ơn bạn đã gửi đánh giá!");

			const [detail, list] = await Promise.all([
				eventService.getEvent(event.slug),
				eventService.getFeedbacks(event.id, { page: 1, per_page: FEEDBACK_PAGE_SIZE }),
			]);
			setEvent(detail.data);
			setFeedbacks(list.data);
			setFeedbackPage(1);
			setFeedbackHasMore(list.meta.current_page < list.meta.last_page);
		} catch (err) {
			const message =
				(err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
				"Không thể gửi đánh giá. Vui lòng thử lại.";
			toast.error(message);
		} finally {
			setSubmittingFeedback(false);
		}
	};

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

						{/* Góp ý — chỉ hiển thị khi có link form góp ý và người dùng đã tham dự sự kiện */}
						{event.feedback_form_url && event.my_attended && (
							<div className='mt-6 flex flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-[3px_3px_0_#111] sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex flex-col gap-1'>
									<div className='flex items-center gap-2'>
										<MessageSquareText className='h-5 w-5 text-[var(--color-text-primary)]' />
										<p className='font-heading text-sm font-extrabold text-black'>
											Đóng góp ý kiến cho sự kiện
										</p>
									</div>
									<p className='text-sm text-gray-700'>
										Ý kiến của bạn giúp ban tổ chức cải thiện những sự kiện tiếp theo.
									</p>
								</div>
								<a
									href={event.feedback_form_url}
									target='_blank'
									rel='noopener noreferrer'
									className='inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
									<MessageSquareText className='h-4 w-4' />
									Gửi góp ý
									<ExternalLink className='h-4 w-4' />
								</a>
							</div>
						)}

						{/* Gallery */}
						{event.gallery && event.gallery.length > 0 && (
							<section className='mt-10 border-t-2 border-gray-200 pt-8'>
								<h2 className='font-heading text-xl font-extrabold text-black'>Thư viện ảnh</h2>
								<div className='mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3'>
									{event.gallery.slice(0, galleryVisible).map((img) => (
										<button
											key={img.id}
											type='button'
											onClick={() => setLightbox(img.image_url)}
											className='group relative aspect-square overflow-hidden rounded-xl border-2 border-black bg-gray-100 shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											<img
												src={img.image_url}
												alt={img.caption ?? ""}
												className='h-full w-full object-cover'
											/>
											{img.caption && (
												<div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left'>
													<p className='truncate text-xs font-semibold text-white'>{img.caption}</p>
												</div>
											)}
										</button>
									))}
								</div>
								{galleryVisible < event.gallery.length && (
									<div className='mt-5 flex justify-center'>
										<button
											type='button'
											onClick={() => setGalleryVisible((v) => v + GALLERY_PAGE_SIZE)}
											className='inline-flex h-10 items-center gap-2 rounded-xl border-2 border-black bg-white px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											Xem thêm ảnh ({event.gallery.length - galleryVisible})
										</button>
									</div>
								)}
							</section>
						)}

						{/* Feedback */}
						{event.status === "ended" && (
							<section className='mt-10 border-t-2 border-gray-200 pt-8'>
								<h2 className='font-heading text-xl font-extrabold text-black'>Đánh giá sự kiện</h2>

								{event.feedback_summary && event.feedback_summary.total > 0 && (
									<div className='mt-5 flex items-center gap-5 rounded-2xl border-2 border-black bg-white p-5 shadow-[3px_3px_0_#111]'>
										<div className='shrink-0 text-center'>
											<p className='font-heading text-4xl font-extrabold text-black'>
												{event.feedback_summary.average_rating.toFixed(1)}
											</p>
											<StarDisplay rating={Math.round(event.feedback_summary.average_rating)} />
											<p className='mt-1 text-xs text-gray-500'>
												{event.feedback_summary.total} đánh giá
											</p>
										</div>
										<div className='flex-1 space-y-1'>
											{[5, 4, 3, 2, 1].map((star) => {
												const count = event.feedback_summary?.distribution[String(star)] ?? 0;
												const pct =
													event.feedback_summary && event.feedback_summary.total > 0
														? (count / event.feedback_summary.total) * 100
														: 0;
												return (
													<div key={star} className='flex items-center gap-2 text-xs'>
														<span className='w-3 text-gray-500'>{star}</span>
														<Star className='h-3 w-3 fill-[var(--color-pastel-amber)] text-[var(--color-pastel-amber)]' />
														<div className='h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200'>
															<div
																className='h-full rounded-full bg-[var(--color-pastel-amber)]'
																style={{ width: `${pct}%` }}
															/>
														</div>
														<span className='w-6 text-right text-gray-500'>{count}</span>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{/* Feedback form for attendees */}
								{user && event.my_attended && (
									<div className='mt-5 rounded-2xl border-2 border-black bg-[var(--color-pastel-yellow)] p-5 shadow-[3px_3px_0_#111]'>
										<p className='font-heading text-sm font-extrabold text-black'>
											{event.my_feedback
												? "Cập nhật đánh giá của bạn"
												: "Bạn đã tham dự — hãy để lại đánh giá!"}
										</p>
										<div className='mt-3 flex items-center gap-1'>
											{[1, 2, 3, 4, 5].map((star) => (
												<button
													key={star}
													type='button'
													onMouseEnter={() => setHoverRating(star)}
													onMouseLeave={() => setHoverRating(0)}
													onClick={() => setRatingInput(star)}
													className='p-0.5'
													aria-label={`${star} sao`}>
													<Star
														className={`h-7 w-7 transition ${
															(hoverRating || ratingInput) >= star
																? "fill-[var(--color-pastel-amber)] text-[var(--color-pastel-amber)]"
																: "text-gray-300"
														}`}
													/>
												</button>
											))}
										</div>
										<textarea
											value={commentInput}
											onChange={(e) => setCommentInput(e.target.value)}
											rows={3}
											maxLength={1000}
											placeholder='Chia sẻ cảm nhận của bạn về sự kiện (không bắt buộc)...'
											className='mt-3 w-full resize-none rounded-xl border-2 border-black bg-white p-3 text-sm text-black outline-none transition focus:shadow-[2px_2px_0_#111]'
										/>
										<button
											onClick={handleSubmitFeedback}
											disabled={submittingFeedback}
											className='mt-3 inline-flex h-10 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50'>
											{submittingFeedback && <Loader2 className='h-4 w-4 animate-spin' />}
											{event.my_feedback ? "Cập nhật đánh giá" : "Gửi đánh giá"}
										</button>
									</div>
								)}

								{/* Feedback list */}
								<div className='mt-5 space-y-3'>
									{feedbacks.map((fb) => (
										<div
											key={fb.id}
											ref={(el) => {
												feedbackItemRefs.current[fb.id] = el;
											}}
											className={`rounded-2xl border-2 border-black bg-white p-4 shadow-[2px_2px_0_#111] transition ${
												highlightedFeedbackId === fb.id
													? "ring-4 ring-[var(--color-primary)] ring-offset-2"
													: ""
											}`}>
											<div className='flex items-center justify-between gap-2'>
												<div className='flex items-center gap-2.5'>
													{fb.user?.avatar ? (
														<AvatarImage
															fallbackName={fb.user?.full_name}
															src={fb.user.avatar}
															alt=''
															className='h-8 w-8 rounded-full border-2 border-black object-cover'
														/>
													) : (
														<div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-[var(--color-pastel-blue)] text-xs font-extrabold text-black'>
															{(fb.user?.full_name ?? "?").charAt(0).toUpperCase()}
														</div>
													)}
													<div>
														<p className='text-sm font-bold text-black'>
															{fb.user?.full_name ?? "Ẩn danh"}
														</p>
														<StarDisplay rating={fb.rating} size='sm' />
													</div>
												</div>
												<span className='text-xs text-gray-400'>
													{formatEventDateTime(fb.created_at)}
												</span>
											</div>
											{fb.comment && (
												<p className='mt-2 text-sm leading-6 text-gray-700'>{fb.comment}</p>
											)}
										</div>
									))}
									{(!event.feedback_summary || event.feedback_summary.total === 0) && (
										<p className='text-sm text-gray-500'>Chưa có đánh giá nào cho sự kiện này.</p>
									)}
									{feedbackHasMore && (
										<div className='flex justify-center pt-1'>
											<button
												type='button'
												onClick={handleLoadMoreFeedbacks}
												disabled={loadingMoreFeedback}
												className='inline-flex h-10 items-center gap-2 rounded-xl border-2 border-black bg-white px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50'>
												{loadingMoreFeedback && <Loader2 className='h-4 w-4 animate-spin' />}
												Xem thêm đánh giá
											</button>
										</div>
									)}
								</div>
							</section>
						)}
					</>
				)}
			</main>

			{showTicket && event?.my_qr_token && (
				<TicketModal qrToken={event.my_qr_token} event={event} onClose={() => setShowTicket(false)} />
			)}

			{lightbox && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
					onClick={() => setLightbox(null)}>
					<button
						type='button'
						onClick={() => setLightbox(null)}
						className='absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white text-white transition hover:bg-white/10'>
						<X className='h-5 w-5' />
					</button>
					<img
						src={lightbox}
						alt=''
						className='max-h-[90vh] max-w-full rounded-xl border-2 border-white object-contain'
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</div>
	);
};

export default EventDetailPage;
