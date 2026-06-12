import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Edit,
	Eye,
	ImageIcon,
	MoreHorizontal,
	ScanLine,
	Search,
	UserCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import EventCheckInDialog from "@/pages/event/EventCheckInDialog";
import { STATUS_MAP } from "@/pages/event/event-status";
import type { EventRecord, EventStatus } from "@/pages/event/EventListPage";
import eventService from "@/services/event.service";
import { cn } from "@/lib/utils";
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pageSizeOptions = [10, 20, 30, 50];

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null | undefined) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

const REGISTRATION_STATUS_MAP: Record<RegistrationStatus, { label: string; className: string }> = {
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
};

const registrationFilterOptions: Array<{ value: RegistrationStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "registered", label: "Đã đăng ký" },
	{ value: "attended", label: "Đã điểm danh" },
	{ value: "cancelled", label: "Đã hủy" },
];

function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
	return (
		<div className='flex flex-col gap-1 rounded-lg border bg-muted/20 p-4'>
			<p className='text-xs font-medium uppercase text-muted-foreground'>{label}</p>
			<div className='text-sm font-medium break-words'>{value}</div>
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
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<RegistrationStatus | "all">("all");
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [isCheckInOpen, setIsCheckInOpen] = useState(false);
	const [manualTarget, setManualTarget] = useState<EventRegistrationRecord | null>(null);
	const [isManualSubmitting, setIsManualSubmitting] = useState(false);

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

	useEffect(() => {
		setLoading(true);
		void Promise.all([fetchEvent(), fetchRegistrations()]).finally(() => setLoading(false));
	}, [fetchEvent, fetchRegistrations]);

	useEffect(() => {
		setPage(1);
	}, [search, statusFilter, perPage]);

	const refreshAfterCheckIn = useCallback(() => {
		void fetchRegistrations();
		void fetchEvent();
	}, [fetchEvent, fetchRegistrations]);

	const filteredRegistrations = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return registrations.filter((registration) => {
			const matchesSearch =
				!normalizedSearch ||
				registration.user?.full_name?.toLowerCase().includes(normalizedSearch) ||
				registration.user?.email.toLowerCase().includes(normalizedSearch);

			const matchesStatus = statusFilter === "all" || registration.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [registrations, search, statusFilter]);

	const lastPage = Math.max(1, Math.ceil(filteredRegistrations.length / perPage));
	const currentPage = Math.min(page, lastPage);
	const paginatedRegistrations = filteredRegistrations.slice(
		(currentPage - 1) * perPage,
		currentPage * perPage,
	);

	const attendedCount = useMemo(
		() => registrations.filter((registration) => registration.status === "attended").length,
		[registrations],
	);

	// Backend chỉ cho điểm danh khi sự kiện không ở trạng thái nháp/đã hủy
	const canCheckIn = canManageEvent && event != null && !["draft", "cancelled"].includes(event.status);

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
										{!event.is_registration_required ? (
											<Badge
												variant='outline'
												className='border-slate-500/30 bg-slate-500/10 text-slate-700'>
												Không yêu cầu đăng ký
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
					<CardContent className='grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-3'>
						<InfoRow label='Thời gian bắt đầu' value={formatDate(event.start_at)} />
						<InfoRow label='Thời gian kết thúc' value={formatDate(event.end_at)} />
						<InfoRow label='Địa điểm' value={event.location || "--"} />
						<InfoRow
							label='Ban tổ chức'
							value={event.department?.name ?? "--"}
						/>
						<InfoRow
							label='Người tạo'
							value={event.creator?.full_name ?? "--"}
						/>
						<InfoRow
							label='Đăng ký / Điểm danh'
							value={
								event.is_registration_required
									? `${event.registrations_count.toLocaleString("vi-VN")}${
										event.max_attendees
											? ` / ${event.max_attendees.toLocaleString("vi-VN")}`
											: ""
									} đăng ký · ${event.check_ins_count.toLocaleString("vi-VN")} check-in`
									: "Không yêu cầu đăng ký"
							}
						/>
						<InfoRow label='Mô tả' value={event.description || "--"} />
						<InfoRow label='Ngày tạo' value={formatDate(event.created_at)} />
						<InfoRow label='Ngày cập nhật' value={formatDate(event.updated_at)} />
					</CardContent>
				</Card>

				{/* Participants section */}
				<div className='flex flex-col gap-4'>
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
									onValueChange={(value) => setStatusFilter(value as RegistrationStatus | "all")}>
									<SelectTrigger className='h-8 w-[180px]'>
										<SelectValue placeholder='Lọc trạng thái' />
									</SelectTrigger>
									<SelectContent>
										{registrationFilterOptions.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
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
								{paginatedRegistrations.map((registration, index) => {
									const registrationBadge = REGISTRATION_STATUS_MAP[registration.status];

									return (
										<TableRow
											key={registration.id}
											className='transition-colors duration-150 hover:bg-muted/40'>
											<TableCell className='text-muted-foreground'>
												{(currentPage - 1) * perPage + index + 1}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-2.5'>
													<Avatar className='h-7 w-7'>
														<AvatarImage src={registration.user?.avatar ?? undefined} />
														<AvatarFallback className='text-xs'>
															{(registration.user?.full_name ?? "?").charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className='font-medium'>
														{registration.user?.full_name ?? "Ẩn danh"}
													</div>
												</div>
											</TableCell>
											<TableCell className='text-muted-foreground'>
												{registration.user?.email ?? "--"}
											</TableCell>
											<TableCell>
												<Badge
													variant='outline'
													className={cn("rounded-full", registrationBadge.className)}>
													{registrationBadge.label}
												</Badge>
											</TableCell>
											<TableCell>{formatDate(registration.registered_at)}</TableCell>
											<TableCell>
												{registration.check_in ? (
													<div className='space-y-0.5 text-sm'>
														<p>{formatDate(registration.check_in.checked_in_at)}</p>
														<p className='text-xs text-muted-foreground'>
															{registration.check_in.method === "qr" ? "Quét QR" : "Thủ công"}
															{registration.check_in.checked_in_by
																? ` · bởi ${registration.check_in.checked_in_by}`
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
															onClick={() => navigate(`/users/${registration.user?.id}`)}
															disabled={!registration.user}>
															<Eye className='h-4 w-4' />
															Xem hồ sơ
														</DropdownMenuItem>
														<DropdownMenuItem
															disabled={!canCheckIn || registration.status !== "registered"}
															onClick={() => setManualTarget(registration)}>
															<UserCheck className='h-4 w-4' />
															Điểm danh thủ công
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})}
								{paginatedRegistrations.length === 0 ? (
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
												Đang hiện {paginatedRegistrations.length} trên tổng {filteredRegistrations.length} người tham gia.
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
				</div>
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
