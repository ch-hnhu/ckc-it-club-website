import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
	AlignLeft,
	ArrowLeft,
	BellRing,
	Building2,
	CalendarClock,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ClipboardCheck,
	Edit,
	Eye,
	GripVertical,
	ImageIcon,
	Loader2,
	MapPin,
	MoreHorizontal,
	ScanLine,
	Search,
	Star,
	Ticket,
	Trash2,
	UploadCloud,
	UserCheck,
	Users,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import EventCheckInDialog from "@/pages/event/EventCheckInDialog";
import LinkedBoardsCard from "@/components/projecthub/LinkedBoardsCard";
import { STATUS_MAP } from "@/pages/event/event-status";
import type { EventRecord, EventStatus } from "@/pages/event/EventListPage";
import eventService from "@/services/event.service";
import type {
	EventFeedbackItem,
	EventFeedbackResponse,
	EventGalleryItem,
	EventMemberRecord,
} from "@/services/event.service";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

// ─── Types ───────────────────────────────────────────────────────────────────

export type RegistrationStatus = "registered" | "attended" | "cancelled";

export interface EventRegistrationRecord {
	id: number;
	status: RegistrationStatus;
	registered_at: string | null;
	cancelled_at: string | null;
	user: {
		id: number;
		full_name: string | null;
		email: string;
		avatar: string | null;
	} | null;
	check_in: {
		checked_in_at: string | null;
		method: "qr" | "manual";
		checked_in_by: string | null;
	} | null;
}

// Trạng thái hiển thị trong bảng người tham gia: 3 trạng thái đăng ký + "chưa đăng ký"
// (chỉ xuất hiện với sự kiện dành riêng cho thành viên CLB)
export type ParticipantStatus = RegistrationStatus | "not_registered";

// Một dòng trong bảng: bản ghi đăng ký, hoặc thành viên CLB chưa đăng ký
interface ParticipantRow {
	key: string;
	status: ParticipantStatus;
	registration: EventRegistrationRecord | null;
	user: EventRegistrationRecord["user"];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pageSizeOptions = [10, 20, 30, 50];

const USER_SITE_URL = import.meta.env.VITE_USER_SITE_URL || "http://localhost:5174";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null | undefined) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

// Định dạng gọn "15:00 15/07/2026" để gộp khoảng thời gian vào một ô
function formatDateTimeShort(value: string | null | undefined) {
	if (!value) return "--";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "--";
	const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
	return `${time} ${d.toLocaleDateString("vi-VN")}`;
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
	if (!start && !end) return "--";
	if (!start) return formatDateTimeShort(end);
	if (!end) return formatDateTimeShort(start);
	return `${formatDateTimeShort(start)} → ${formatDateTimeShort(end)}`;
}

const REGISTRATION_STATUS_MAP: Record<ParticipantStatus, { label: string; className: string }> = {
	registered: {
		label: "Đã đăng ký",
		className: "border-sky-500/30 bg-sky-500/10 text-sky-700",
	},
	attended: {
		label: "Đã điểm danh",
		className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
	},
	cancelled: {
		label: "Đã hủy",
		className: "border-rose-500/30 bg-rose-500/10 text-rose-700",
	},
	not_registered: {
		label: "Chưa đăng ký",
		className: "border-muted-foreground/30 bg-muted/60 text-muted-foreground",
	},
};

const registrationFilterOptions: Array<{ value: ParticipantStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "registered", label: "Đã đăng ký" },
	{ value: "attended", label: "Đã điểm danh" },
	{ value: "cancelled", label: "Đã hủy" },
];

// Chỉ thêm bộ lọc "Chưa đăng ký" cho sự kiện dành riêng thành viên CLB
const notRegisteredFilterOption = { value: "not_registered" as const, label: "Chưa đăng ký" };

function InfoRow({
	icon,
	label,
	value,
	highlight,
	className,
}: {
	icon?: React.ReactNode;
	label: React.ReactNode;
	value: React.ReactNode;
	highlight?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-1 rounded-lg border p-4",
				highlight ? "border-sky-500/30 bg-sky-500/10" : "bg-muted/20",
				className,
			)}>
			<p
				className={cn(
					"flex items-center gap-1.5 text-xs font-medium uppercase",
					highlight ? "text-sky-700" : "text-muted-foreground",
				)}>
				{icon}
				{label}
			</p>
			<div className={cn("text-sm font-medium break-words", highlight && "text-sky-800")}>
				{value}
			</div>
		</div>
	);
}

function StarRow({ rating, className }: { rating: number; className?: string }) {
	return (
		<div className={cn("flex items-center gap-0.5", className)}>
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					className={cn(
						"h-4 w-4",
						star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
					)}
				/>
			))}
		</div>
	);
}

// ─── Feedback tab ──────────────────────────────────────────────────────────────

const feedbackRatingOptions: Array<{ value: string; label: string }> = [
	{ value: "all", label: "Tất cả số sao" },
	{ value: "5", label: "5 sao" },
	{ value: "4", label: "4 sao" },
	{ value: "3", label: "3 sao" },
	{ value: "2", label: "2 sao" },
	{ value: "1", label: "1 sao" },
];

function FeedbackPanel({ eventId, canManage }: { eventId: number; canManage: boolean }) {
	const [data, setData] = useState<EventFeedbackResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [ratingFilter, setRatingFilter] = useState("all");
	const [deleteTarget, setDeleteTarget] = useState<EventFeedbackItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchFeedbacks = useCallback(() => {
		setLoading(true);
		eventService
			.getFeedbacks(eventId)
			.then((res) => setData(res.data))
			.catch(() => toast.error("Không thể tải đánh giá sự kiện.", { position: "top-right" }))
			.finally(() => setLoading(false));
	}, [eventId]);

	useEffect(() => {
		fetchFeedbacks();
	}, [fetchFeedbacks]);

	const filteredItems = useMemo(() => {
		if (!data) return [];
		const normalized = search.trim().toLowerCase();
		return data.items.filter((item) => {
			const matchesRating = ratingFilter === "all" || String(item.rating) === ratingFilter;
			const matchesSearch =
				!normalized ||
				item.user?.full_name?.toLowerCase().includes(normalized) ||
				item.user?.email.toLowerCase().includes(normalized) ||
				item.comment?.toLowerCase().includes(normalized);
			return matchesRating && matchesSearch;
		});
	}, [data, search, ratingFilter]);

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await eventService.deleteFeedback(eventId, deleteTarget.id);
			setDeleteTarget(null);
			toast.success("Đã xóa đánh giá.", { position: "top-right" });
			fetchFeedbacks();
		} catch {
			toast.error("Không thể xóa đánh giá. Vui lòng thử lại.", { position: "top-right" });
		} finally {
			setIsDeleting(false);
		}
	};

	if (loading) {
		return (
			<div className='flex flex-col gap-4'>
				<Skeleton className='h-40 w-full rounded-xl' />
				<Skeleton className='h-24 w-full rounded-xl' />
			</div>
		);
	}

	if (!data || data.stats.total === 0) {
		return (
			<div className='flex h-40 flex-col items-center justify-center gap-2 rounded-md border text-center'>
				<Star className='h-8 w-8 text-muted-foreground/40' />
				<p className='text-sm font-medium'>Chưa có đánh giá nào.</p>
				<p className='text-sm text-muted-foreground'>
					Đánh giá sẽ xuất hiện sau khi người tham dự gửi phản hồi.
				</p>
			</div>
		);
	}

	const { stats } = data;
	const maxCount = Math.max(...Object.values(stats.distribution), 1);

	return (
		<div className='flex flex-col gap-6'>
			{/* Summary */}
			<div className='grid gap-6 rounded-xl border bg-muted/20 p-6 sm:grid-cols-[auto_1fr]'>
				<div className='flex flex-col items-center justify-center gap-1 sm:border-r sm:pr-6'>
					<span className='text-4xl font-semibold'>{stats.average_rating.toFixed(1)}</span>
					<StarRow rating={Math.round(stats.average_rating)} />
					<span className='text-xs text-muted-foreground'>{stats.total} đánh giá</span>
				</div>
				<div className='flex flex-col justify-center gap-1.5'>
					{[5, 4, 3, 2, 1].map((star) => {
						const count = stats.distribution[String(star)] ?? 0;
						return (
							<div key={star} className='flex items-center gap-2 text-sm'>
								<span className='w-3 text-muted-foreground'>{star}</span>
								<Star className='h-3.5 w-3.5 fill-amber-400 text-amber-400' />
								<div className='h-2 flex-1 overflow-hidden rounded-full bg-muted'>
									<div
										className='h-full rounded-full bg-amber-400'
										style={{ width: `${(count / maxCount) * 100}%` }}
									/>
								</div>
								<span className='w-8 text-right text-muted-foreground'>{count}</span>
							</div>
						);
					})}
					<p className='mt-2 text-xs text-muted-foreground'>
						Tỉ lệ phản hồi: {stats.response_rate}% ({stats.total}/{stats.attended_count} người đã điểm danh)
					</p>
				</div>
			</div>

			{/* Toolbar */}
			<div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
				<div className='relative flex-1 sm:max-w-sm'>
					<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder='Tìm theo tên, email hoặc nội dung...'
						className='h-8 pl-9'
					/>
				</div>
				<Select value={ratingFilter} onValueChange={setRatingFilter}>
					<SelectTrigger className='h-8 w-[160px]'>
						<SelectValue placeholder='Lọc số sao' />
					</SelectTrigger>
					<SelectContent>
						{feedbackRatingOptions.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* List */}
			<div className='flex flex-col gap-3'>
				{filteredItems.map((item) => (
					<div key={item.id} className='flex gap-3 rounded-lg border p-4'>
						<Avatar className='h-9 w-9'>
							<AvatarImage src={item.user?.avatar ?? undefined} />
							<AvatarFallback className='text-xs'>
								{(item.user?.full_name ?? "?").charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className='flex flex-1 flex-col gap-1'>
							<div className='flex flex-wrap items-center justify-between gap-2'>
								<div className='flex items-center gap-2'>
									<span className='text-sm font-medium'>{item.user?.full_name ?? "Ẩn danh"}</span>
									<StarRow rating={item.rating} />
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-xs text-muted-foreground'>{formatDate(item.created_at)}</span>
									{canManage && (
										<button
											type='button'
											onClick={() => setDeleteTarget(item)}
											aria-label='Xóa đánh giá'
											className='rounded p-1 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-600'>
											<Trash2 className='h-4 w-4' />
										</button>
									)}
								</div>
							</div>
							{item.user?.email && (
								<span className='text-xs text-muted-foreground'>{item.user.email}</span>
							)}
							{item.comment ? (
								<p className='text-sm text-muted-foreground'>{item.comment}</p>
							) : (
								<p className='text-sm italic text-muted-foreground/60'>Không có nhận xét.</p>
							)}
						</div>
					</div>
				))}
				{filteredItems.length === 0 && (
					<div className='flex h-32 flex-col items-center justify-center gap-1 rounded-md border text-center'>
						<p className='text-sm font-medium'>Không có đánh giá phù hợp.</p>
						<p className='text-sm text-muted-foreground'>Thử đổi từ khóa hoặc bộ lọc số sao.</p>
					</div>
				)}
			</div>

			<AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa đánh giá này?</AlertDialogTitle>
						<AlertDialogDescription>
							Đánh giá của{" "}
							<span className='font-semibold text-foreground'>
								{deleteTarget?.user?.full_name ?? "người dùng"}
							</span>{" "}
							sẽ bị xóa vĩnh viễn và không thể khôi phục.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								void handleDelete();
							}}
							disabled={isDeleting}>
							{isDeleting ? "Đang xóa..." : "Xóa đánh giá"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ─── Gallery tab ─────────────────────────────────────────────────────────────

function GalleryPanel({ eventId, canManage }: { eventId: number; canManage: boolean }) {
	const [items, setItems] = useState<EventGalleryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<EventGalleryItem | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchGallery = useCallback(() => {
		setLoading(true);
		eventService
			.getGallery(eventId)
			.then((res) => setItems(res.data))
			.catch(() => toast.error("Không thể tải thư viện ảnh.", { position: "top-right" }))
			.finally(() => setLoading(false));
	}, [eventId]);

	useEffect(() => {
		fetchGallery();
	}, [fetchGallery]);

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setUploading(true);
		try {
			const formData = new FormData();
			Array.from(files).forEach((file) => formData.append("images[]", file));
			const res = await eventService.uploadGallery(eventId, formData);
			setItems((prev) => [...prev, ...res.data]);
			toast.success(`Đã tải lên ${res.data.length} ảnh.`, { position: "top-right" });
		} catch {
			toast.error("Không thể tải ảnh lên. Vui lòng thử lại.", { position: "top-right" });
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await eventService.deleteGalleryItem(eventId, deleteTarget.id);
			setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
			setDeleteTarget(null);
			toast.success("Đã xóa ảnh.", { position: "top-right" });
		} catch {
			toast.error("Không thể xóa ảnh. Vui lòng thử lại.", { position: "top-right" });
		} finally {
			setIsDeleting(false);
		}
	};

	const persistOrder = (ordered: EventGalleryItem[]) => {
		eventService
			.reorderGallery(eventId, ordered.map((i) => i.id))
			.catch(() => toast.error("Không thể lưu thứ tự ảnh.", { position: "top-right" }));
	};

	const handleDrop = (targetIndex: number) => {
		if (dragIndex === null || dragIndex === targetIndex) {
			setDragIndex(null);
			return;
		}
		const reordered = [...items];
		const [moved] = reordered.splice(dragIndex, 1);
		reordered.splice(targetIndex, 0, moved);
		setItems(reordered);
		setDragIndex(null);
		persistOrder(reordered);
	};

	return (
		<div className='flex flex-col gap-4'>
			{canManage && (
				<div className='flex items-center justify-between gap-2'>
					<p className='text-sm text-muted-foreground'>
						{items.length} ảnh · Kéo thả để sắp xếp lại thứ tự hiển thị.
					</p>
					<input
						ref={fileInputRef}
						type='file'
						accept='image/*'
						multiple
						className='sr-only'
						onChange={(e) => void handleUpload(e.target.files)}
					/>
					<Button
						size='sm'
						className='h-8 bg-foreground text-background hover:bg-foreground/90'
						disabled={uploading}
						onClick={() => fileInputRef.current?.click()}>
						{uploading ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<UploadCloud className='h-4 w-4' />
						)}
						Tải ảnh lên
					</Button>
				</div>
			)}

			{loading ? (
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className='aspect-square w-full rounded-lg' />
					))}
				</div>
			) : items.length === 0 ? (
				<div className='flex h-40 flex-col items-center justify-center gap-2 rounded-md border text-center'>
					<ImageIcon className='h-8 w-8 text-muted-foreground/40' />
					<p className='text-sm font-medium'>Chưa có ảnh nào trong thư viện.</p>
					{canManage && (
						<p className='text-sm text-muted-foreground'>Nhấn "Tải ảnh lên" để thêm ảnh sự kiện.</p>
					)}
				</div>
			) : (
				<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
					{items.map((item, index) => (
						<div
							key={item.id}
							draggable={canManage}
							onDragStart={() => setDragIndex(index)}
							onDragOver={(e) => e.preventDefault()}
							onDrop={() => handleDrop(index)}
							className={cn(
								"group relative aspect-square overflow-hidden rounded-lg border bg-muted",
								canManage && "cursor-move",
								dragIndex === index && "opacity-50",
							)}>
							<img
								src={item.image_url}
								alt={item.caption ?? ""}
								className='h-full w-full object-cover'
							/>
							{item.caption && (
								<div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2'>
									<p className='truncate text-xs text-white'>{item.caption}</p>
								</div>
							)}
							{canManage && (
								<>
									<div className='absolute left-1.5 top-1.5 rounded bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100'>
										<GripVertical className='h-3.5 w-3.5' />
									</div>
									<button
										type='button'
										onClick={() => setDeleteTarget(item)}
										className='absolute right-1.5 top-1.5 rounded bg-black/50 p-1 text-white opacity-0 transition hover:bg-rose-600 group-hover:opacity-100'>
										<Trash2 className='h-3.5 w-3.5' />
									</button>
								</>
							)}
						</div>
					))}
				</div>
			)}

			<AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa ảnh này?</AlertDialogTitle>
						<AlertDialogDescription>
							Ảnh sẽ bị xóa khỏi thư viện sự kiện và không thể khôi phục.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								void handleDelete();
							}}
							disabled={isDeleting}>
							{isDeleting ? "Đang xóa..." : "Xóa ảnh"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

function EventDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { hasPermission } = useAuth();
	const canManageEvent = hasPermission("events.manage");

	const [event, setEvent] = useState<(EventRecord & { content: string | null }) | null>(null);
	const [registrations, setRegistrations] = useState<EventRegistrationRecord[]>([]);
	const [unregisteredMembers, setUnregisteredMembers] = useState<EventMemberRecord[]>([]);
	const [remindTargetId, setRemindTargetId] = useState<number | null>(null);
	const [isRemindingAll, setIsRemindingAll] = useState(false);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ParticipantStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [isCheckInOpen, setIsCheckInOpen] = useState(false);
	const [manualTarget, setManualTarget] = useState<EventRegistrationRecord | null>(null);
	const [isManualSubmitting, setIsManualSubmitting] = useState(false);
	// Mở trang sự kiện công khai (giao diện user), cuộn tới phản hồi của người được chọn
	const openUserFeedback = useCallback(
		(userId: number) => {
			if (!event) return;
			const url = `${USER_SITE_URL}/su-kien/${event.slug}?feedback_user=${userId}`;
			window.open(url, "_blank", "noopener,noreferrer");
		},
		[event],
	);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Quản lý sự kiện", link: "/events" },
		{ title: "Chi tiết sự kiện" },
	]);

	const fetchEvent = useCallback(async () => {
		if (!id) return;
		try {
			const response = await eventService.getEvent(id);
			setEvent(response.data);
		} catch (error) {
			console.error("Không thể tải chi tiết sự kiện:", error);
			toast.error("Không thể tải chi tiết sự kiện.", { position: "top-right" });
		}
	}, [id]);

	const fetchRegistrations = useCallback(async () => {
		if (!id) return;
		try {
			const response = await eventService.getRegistrations(id);
			setRegistrations(response.data);
		} catch (error) {
			console.error("Không thể tải danh sách người tham gia:", error);
			toast.error("Không thể tải danh sách người tham gia.", { position: "top-right" });
		}
	}, [id]);

	const fetchUnregisteredMembers = useCallback(async () => {
		if (!id) return;
		try {
			const response = await eventService.getUnregisteredMembers(id);
			setUnregisteredMembers(response.data);
		} catch (error) {
			console.error("Không thể tải danh sách thành viên chưa đăng ký:", error);
			toast.error("Không thể tải danh sách thành viên chưa đăng ký.", { position: "top-right" });
		}
	}, [id]);

	useEffect(() => {
		setLoading(true);
		void Promise.all([fetchEvent(), fetchRegistrations()]).finally(() => setLoading(false));
	}, [fetchEvent, fetchRegistrations]);

	// Sự kiện dành riêng thành viên CLB: tải thêm danh sách thành viên chưa đăng ký
	useEffect(() => {
		if (event?.is_members_only) {
			void fetchUnregisteredMembers();
		}
	}, [event?.is_members_only, fetchUnregisteredMembers]);

	useEffect(() => {
		setPage(1);
	}, [search, statusFilter, perPage]);

	const refreshAfterCheckIn = useCallback(() => {
		void fetchRegistrations();
		void fetchEvent();
	}, [fetchEvent, fetchRegistrations]);

	// Gộp danh sách đăng ký + thành viên CLB chưa đăng ký (nếu sự kiện chỉ dành cho thành viên)
	const participantRows = useMemo<ParticipantRow[]>(() => {
		const rows: ParticipantRow[] = registrations.map((registration) => ({
			key: `reg-${registration.id}`,
			status: registration.status,
			registration,
			user: registration.user,
		}));

		if (event?.is_members_only) {
			for (const member of unregisteredMembers) {
				rows.push({
					key: `member-${member.id}`,
					status: "not_registered",
					registration: null,
					user: member,
				});
			}
		}

		return rows;
	}, [registrations, unregisteredMembers, event?.is_members_only]);

	const filteredRows = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return participantRows.filter((row) => {
			const matchesSearch =
				!normalizedSearch ||
				row.user?.full_name?.toLowerCase().includes(normalizedSearch) ||
				row.user?.email.toLowerCase().includes(normalizedSearch);

			const matchesStatus = statusFilter === "all" || row.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [participantRows, search, statusFilter]);

	const lastPage = Math.max(1, Math.ceil(filteredRows.length / perPage));
	const currentPage = Math.min(page, lastPage);
	const paginatedRows = filteredRows.slice(
		(currentPage - 1) * perPage,
		currentPage * perPage,
	);

	const statusFilterOptions = event?.is_members_only
		? [...registrationFilterOptions, notRegisteredFilterOption]
		: registrationFilterOptions;

	const attendedCount = useMemo(
		() => registrations.filter((registration) => registration.status === "attended").length,
		[registrations],
	);

	// Backend chỉ cho điểm danh khi sự kiện không ở trạng thái nháp/đã hủy
	const canCheckIn = canManageEvent && event != null && !["draft", "cancelled"].includes(event.status);

	// Chỉ nhắc nhở được khi sự kiện đã đăng và còn trong thời gian đăng ký
	const canRemind =
		canManageEvent &&
		event != null &&
		event.status === "published" &&
		(!event.registration_end_at || new Date(event.registration_end_at).getTime() >= Date.now());

	const handleRemindMember = async (member: NonNullable<ParticipantRow["user"]>) => {
		if (!id) return;

		setRemindTargetId(member.id);

		try {
			await eventService.remindMembers(id, [member.id]);
			toast.success(`Đã gửi nhắc nhở tới ${member.full_name ?? member.email}.`, {
				position: "top-right",
			});
		} catch (error) {
			const message =
				isAxiosError(error) && error.response?.data?.message
					? String(error.response.data.message)
					: "Không thể gửi nhắc nhở. Vui lòng thử lại.";
			toast.error(message, { position: "top-right" });
		} finally {
			setRemindTargetId(null);
		}
	};

	const handleRemindAll = async () => {
		if (!id) return;

		setIsRemindingAll(true);

		try {
			const response = await eventService.remindMembers(id);
			toast.success(`Đã gửi nhắc nhở tới ${response.data.reminded_count} thành viên chưa đăng ký.`, {
				position: "top-right",
			});
		} catch (error) {
			const message =
				isAxiosError(error) && error.response?.data?.message
					? String(error.response.data.message)
					: "Không thể gửi nhắc nhở. Vui lòng thử lại.";
			toast.error(message, { position: "top-right" });
		} finally {
			setIsRemindingAll(false);
		}
	};

	const handleManualCheckIn = async () => {
		if (!id || !manualTarget) return;

		setIsManualSubmitting(true);

		try {
			await eventService.checkIn(id, { registration_id: manualTarget.id });
			toast.success(`Đã điểm danh cho ${manualTarget.user?.full_name ?? "người tham gia"}.`, {
				position: "top-right",
			});
			setManualTarget(null);
			refreshAfterCheckIn();
		} catch (error) {
			const message =
				isAxiosError(error) && error.response?.data?.message
					? String(error.response.data.message)
					: "Không thể điểm danh. Vui lòng thử lại.";
			toast.error(message, { position: "top-right" });
		} finally {
			setIsManualSubmitting(false);
		}
	};

	if (loading && !event) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-10 w-28' />
				<div className='flex flex-col gap-6'>
					<Skeleton className='h-48 w-full rounded-xl' />
					<Skeleton className='h-96 w-full rounded-xl' />
				</div>
			</div>
		);
	}

	if (!event) {
		return (
			<div className='flex min-h-[420px] flex-col items-center justify-center gap-3 p-6 text-center'>
				<h2 className='text-xl font-semibold'>Không tìm thấy sự kiện</h2>
				<p className='text-sm text-muted-foreground'>
					Dữ liệu chi tiết sự kiện không khả dụng hoặc bạn không có quyền truy cập.
				</p>
				<Button variant='outline' onClick={() => navigate("/events")}>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Button>
			</div>
		);
	}

	const statusBadge = STATUS_MAP[event.status as EventStatus];

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button
				variant='outline'
				onClick={() => navigate("/events")}
				className='w-fit'>
				<ArrowLeft className='h-4 w-4' />
				Quay lại
			</Button>

			<div className='flex flex-col gap-6'>
				{/* Info card */}
				<Card className='shadow-sm'>
					<CardHeader className='pb-2'>
						<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
							<div className='flex items-start gap-4'>
								<div className='flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted'>
									{event.thumbnail ? (
										<img src={event.thumbnail} alt='' className='h-full w-full object-cover' />
									) : (
										<ImageIcon className='h-5 w-5 text-muted-foreground' />
									)}
								</div>
								<div>
									<div className='mb-1 flex flex-wrap items-center gap-2'>
										<Badge variant='secondary' className='border-transparent'>
											EVT-{event.id}
										</Badge>
										<Badge
											variant='outline'
											className={cn("rounded-full px-3 py-1", statusBadge.className)}>
											{statusBadge.label}
										</Badge>
										{event.is_members_only ? (
											<Badge
												variant='outline'
												className='border-amber-500/30 bg-amber-500/10 text-amber-700'>
												Chỉ thành viên CLB
											</Badge>
										) : null}
									</div>
									<CardTitle className='text-lg leading-snug'>{event.title}</CardTitle>
									<CardDescription>Thông tin sự kiện</CardDescription>
								</div>
							</div>
							<Button
								type='button'
								size='sm'
								variant='outline'
								onClick={() => navigate(`/events/${event.id}/edit`)}
								disabled={!canManageEvent}
								className='h-8 w-fit self-start'>
								<Edit className='h-4 w-4' />
								Sửa
							</Button>
						</div>
					</CardHeader>
					<CardContent className='flex flex-col gap-4'>
						{/* Thông tin cốt lõi */}
						<div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
							<InfoRow
								icon={<CalendarClock className='h-3.5 w-3.5' />}
								label='Thời gian diễn ra'
								value={formatDateRange(event.start_at, event.end_at)}
							/>
							<InfoRow
								icon={<MapPin className='h-3.5 w-3.5' />}
								label='Địa điểm'
								value={event.location || "--"}
							/>
							<InfoRow
								icon={<Building2 className='h-3.5 w-3.5' />}
								label='Ban tổ chức'
								value={event.department?.name ?? "--"}
							/>
							<InfoRow
								highlight
								icon={<ClipboardCheck className='h-3.5 w-3.5' />}
								label='Đăng ký / Điểm danh'
								value={`${event.registrations_count.toLocaleString("vi-VN")}${
									event.max_attendees
										? ` / ${event.max_attendees.toLocaleString("vi-VN")}`
										: ""
								} đăng ký · ${event.check_ins_count.toLocaleString("vi-VN")} check-in`}
							/>
							<InfoRow
								className='col-span-2 sm:col-span-2'
								icon={<Ticket className='h-3.5 w-3.5' />}
								label='Thời gian đăng ký'
								value={`${
									event.registration_start_at
										? formatDateTimeShort(event.registration_start_at)
										: "Ngay khi đăng"
								} → ${
									event.registration_end_at
										? formatDateTimeShort(event.registration_end_at)
										: "đến khi sự kiện bắt đầu"
								}`}
							/>
						</div>

						{/* Mô tả */}
						<div className='rounded-lg border p-4'>
							<p className='flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground'>
								<AlignLeft className='h-3.5 w-3.5' />
								Mô tả
							</p>
							<p className='mt-1 whitespace-pre-line text-sm leading-relaxed'>
								{event.description || "--"}
							</p>
						</div>

						{/* Metadata phụ trợ */}
						<p className='border-t pt-3 text-xs text-muted-foreground'>
							Tạo bởi{" "}
							<span className='font-medium text-foreground/80'>
								{event.creator?.full_name ?? "--"}
							</span>{" "}
							· {formatDate(event.created_at)} &nbsp;·&nbsp; Cập nhật {formatDate(event.updated_at)}
						</p>
					</CardContent>
				</Card>

				<LinkedBoardsCard eventId={event.id} />

					{/* Tabs: participants / feedback / gallery */}
				<Tabs defaultValue='registrations' className='gap-4'>
					<TabsList>
						<TabsTrigger value='registrations'>
							<Users className='h-4 w-4' />
							Người tham gia
						</TabsTrigger>
						<TabsTrigger value='feedback'>
							<Star className='h-4 w-4' />
							Phản hồi
						</TabsTrigger>
						<TabsTrigger value='gallery'>
							<ImageIcon className='h-4 w-4' />
							Thư viện ảnh
						</TabsTrigger>
					</TabsList>

					<TabsContent value='registrations' className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex flex-1 items-center justify-between gap-2'>
							<div className='flex flex-1 items-center gap-2'>
								<div className='relative flex-1 sm:max-w-sm'>
									<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										value={search}
										onChange={(eventInput) => setSearch(eventInput.target.value)}
										placeholder='Tìm theo họ tên hoặc email...'
										className='h-8 pl-9'
									/>
								</div>
								<Select
									value={statusFilter}
									onValueChange={(value) => setStatusFilter(value as ParticipantStatus | "all")}>
									<SelectTrigger className='h-8 w-[180px]'>
										<SelectValue placeholder='Lọc trạng thái' />
									</SelectTrigger>
									<SelectContent>
										{statusFilterOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='flex items-center gap-2'>
								{event.is_members_only ? (
									<Button
										size='sm'
										variant='outline'
										onClick={() => void handleRemindAll()}
										disabled={!canRemind || isRemindingAll || unregisteredMembers.length === 0}
										className='h-8'>
										{isRemindingAll ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : (
											<BellRing className='h-4 w-4' />
										)}
										Nhắc nhở tất cả ({unregisteredMembers.length})
									</Button>
								) : null}
								<Button
									size='sm'
									onClick={() => setIsCheckInOpen(true)}
									disabled={!canCheckIn}
									className='h-8 bg-foreground text-background hover:bg-foreground/90'>
									<ScanLine className='h-4 w-4' />
									Điểm danh
								</Button>
							</div>
						</div>
					</div>

					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow className='bg-muted/30 hover:bg-muted/30 [&>th]:text-sm'>
									<TableHead className='w-[72px]'>STT</TableHead>
									<TableHead>Họ tên</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Trạng thái</TableHead>
									<TableHead>Thời gian đăng ký</TableHead>
									<TableHead>Điểm danh</TableHead>
									<TableHead className='w-[64px]'></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedRows.map((row, index) => {
									const rowBadge = REGISTRATION_STATUS_MAP[row.status];

									return (
										<TableRow
											key={row.key}
											className='transition-colors duration-150 hover:bg-muted/40'>
											<TableCell className='text-muted-foreground'>
												{(currentPage - 1) * perPage + index + 1}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-2.5'>
													<Avatar className='h-7 w-7'>
														<AvatarImage src={row.user?.avatar ?? undefined} />
														<AvatarFallback className='text-xs'>
															{(row.user?.full_name ?? "?").charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className='font-medium'>
														{row.user?.full_name ?? "Ẩn danh"}
													</div>
												</div>
											</TableCell>
											<TableCell className='text-muted-foreground'>
												{row.user?.email ?? "--"}
											</TableCell>
											<TableCell>
												<Badge
													variant='outline'
													className={cn("rounded-full", rowBadge.className)}>
													{rowBadge.label}
												</Badge>
											</TableCell>
											<TableCell>
												{row.registration ? (
													formatDate(row.registration.registered_at)
												) : (
													<span className='text-sm text-muted-foreground'>--</span>
												)}
											</TableCell>
											<TableCell>
												{row.registration?.check_in ? (
													<div className='space-y-0.5 text-sm'>
														<p>{formatDate(row.registration.check_in.checked_in_at)}</p>
														<p className='text-xs text-muted-foreground'>
															{row.registration.check_in.method === "qr" ? "Quét QR" : "Thủ công"}
															{row.registration.check_in.checked_in_by
																? ` · bởi ${row.registration.check_in.checked_in_by}`
																: ""}
														</p>
													</div>
												) : (
													<span className='text-sm text-muted-foreground'>--</span>
												)}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant='ghost' className='h-8 w-8 p-0'>
															<MoreHorizontal className='h-4 w-4' />
															<span className='sr-only'>Mở thao tác</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align='end' className='w-[200px]'>
														<DropdownMenuItem
															onClick={() => navigate(`/users/${row.user?.id}`)}
															disabled={!row.user}>
															<Eye className='h-4 w-4' />
															Xem hồ sơ
														</DropdownMenuItem>
														{row.registration ? (
															<>
																<DropdownMenuItem
																	disabled={!row.user}
																	onClick={() => row.user && openUserFeedback(row.user.id)}>
																	<Star className='h-4 w-4' />
																	Xem phản hồi
																</DropdownMenuItem>
																<DropdownMenuItem
																	disabled={!canCheckIn || row.registration.status !== "registered"}
																	onClick={() => setManualTarget(row.registration)}>
																	<UserCheck className='h-4 w-4' />
																	Điểm danh thủ công
																</DropdownMenuItem>
															</>
														) : (
															<DropdownMenuItem
																disabled={!canRemind || !row.user || remindTargetId === row.user.id}
																onClick={() => row.user && void handleRemindMember(row.user)}>
																<BellRing className='h-4 w-4' />
																Nhắc nhở đăng ký
															</DropdownMenuItem>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
								{paginatedRows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className='h-40 text-center'>
											<div className='flex flex-col items-center gap-2'>
												<div className='text-sm font-medium'>Không có người tham gia phù hợp.</div>
												<p className='text-sm text-muted-foreground'>
													Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
												</p>
											</div>
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
							<TableFooter className='bg-transparent'>
								<TableRow>
									<TableCell colSpan={7}>
										<div className='flex flex-col gap-3 px-2 py-1 sm:flex-row sm:items-center sm:justify-between'>
											<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
												Đang hiện {paginatedRows.length} trên tổng {filteredRows.length} người tham gia.
												<span className='text-border'>|</span>
												<span>
													Đã điểm danh{" "}
													<span className='font-medium text-foreground'>
														{attendedCount}/{registrations.length}
													</span>
												</span>
											</div>
											<div className='flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6'>
												<div className='flex items-center gap-2'>
													<p className='text-sm font-medium'>Rows per page</p>
													<Select
														value={`${perPage}`}
														onValueChange={(value) => setPerPage(Number(value))}>
														<SelectTrigger className='h-8 w-[70px]'>
															<SelectValue placeholder={perPage} />
														</SelectTrigger>
														<SelectContent side='top'>
															{pageSizeOptions.map((pageSize) => (
																<SelectItem key={pageSize} value={`${pageSize}`}>
																	{pageSize}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
													Trang {currentPage} / {lastPage}
												</div>
												<div className='flex items-center gap-2'>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() => setPage(1)}
														disabled={currentPage === 1}>
														<ChevronsLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() => setPage((prev) => Math.max(1, prev - 1))}
														disabled={currentPage === 1}>
														<ChevronLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
														disabled={currentPage === lastPage}>
														<ChevronRight className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() => setPage(lastPage)}
														disabled={currentPage === lastPage}>
														<ChevronsRight className='h-4 w-4' />
													</Button>
												</div>
											</div>
										</div>
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
					</TabsContent>

					<TabsContent value='feedback'>
						<FeedbackPanel eventId={event.id} canManage={canManageEvent} />
					</TabsContent>

					<TabsContent value='gallery'>
						<GalleryPanel eventId={event.id} canManage={canManageEvent} />
					</TabsContent>
				</Tabs>
			</div>

			<EventCheckInDialog
				open={isCheckInOpen}
				onOpenChange={setIsCheckInOpen}
				eventId={event.id}
				onCheckedIn={refreshAfterCheckIn}
			/>

			<AlertDialog open={Boolean(manualTarget)} onOpenChange={(open) => !open && setManualTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Điểm danh thủ công?</AlertDialogTitle>
						<AlertDialogDescription>
							Xác nhận điểm danh cho{" "}
							<span className='font-semibold text-foreground'>
								{manualTarget?.user?.full_name ?? "người tham gia"}
							</span>{" "}
							mà không cần quét mã QR.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isManualSubmitting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(eventClick) => {
								eventClick.preventDefault();
								void handleManualCheckIn();
							}}
							disabled={isManualSubmitting}>
							{isManualSubmitting ? "Đang điểm danh..." : "Điểm danh"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default EventDetailPage;
