import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Ban,
	CalendarCheck,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	Filter,
	ImageIcon,
	MoreHorizontal,
	Plus,
	Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
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
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import { cn } from "@/lib/utils";
import { STATUS_MAP } from "@/pages/event/event-status";
import eventService from "@/services/event.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type EventStatus = "draft" | "published" | "ongoing" | "ended" | "cancelled";

export interface EventCreator {
	id: number;
	full_name: string | null;
	avatar: string | null;
}

export interface EventDepartment {
	id: number;
	name: string;
}

export interface EventRecord {
	id: number;
	title: string;
	slug: string;
	description: string | null;
	thumbnail: string | null;
	start_at: string | null;
	end_at: string | null;
	registration_start_at: string | null;
	registration_end_at: string | null;
	location: string | null;
	max_attendees: number | null;
	is_members_only: boolean;
	status: EventStatus;
	creator: EventCreator | null;
	department: EventDepartment | null;
	registrations_count: number;
	check_ins_count: number;
	created_at: string;
	updated_at: string;
}

export interface EventStats {
	total: number;
	draft: number;
	published: number;
	ongoing: number;
	ended: number;
	cancelled: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Trang public (frontend/user) — nơi bài đăng sự kiện hiển thị với thành viên
const USER_SITE_URL = import.meta.env.VITE_USER_SITE_URL || "http://localhost:5174";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

function truncate(str: string, max = 70) {
	return str.length <= max ? str : `${str.slice(0, max).trimEnd()}…`;
}


function getStatusBadge(status: EventStatus) {
	const { label, className } = STATUS_MAP[status];
	return (
		<Badge variant="outline" className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

type SortKey =
	| "id"
	| "title"
	| "status"
	| "start_at"
	| "registrations_count"
	| "created_at"
	| "department_name"
	| "creator_name";

const statusOptions: Array<{ value: EventStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "draft", label: "Bản nháp" },
	{ value: "published", label: "Đã đăng" },
	{ value: "ongoing", label: "Đang diễn ra" },
	{ value: "ended", label: "Đã kết thúc" },
	{ value: "cancelled", label: "Đã hủy" },
];

// ─── Component ───────────────────────────────────────────────────────────────

function EventListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý sự kiện" }]);

	const navigate = useNavigate();

	const [events, setEvents] = useState<EventRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
	const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; order: "asc" | "desc" | null }>({
		key: "start_at",
		order: "desc",
	});

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(events.map((e) => e.id));

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, statusFilter, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		eventService.getEvents({
			page: meta.current_page,
			per_page: meta.per_page,
			search: debouncedSearch || undefined,
			sort: sortConfig.key ?? undefined,
			order: sortConfig.order ?? undefined,
			status: statusFilter !== "all" ? statusFilter : undefined,
		}).then((res) => {
			if (cancelled) return;
			setEvents(res.data);
			setMeta((p) => ({
				...p,
				last_page: res.meta.last_page,
				total: res.meta.total,
			}));
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách sự kiện.");
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});

		return () => { cancelled = true; };
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, sortConfig, statusFilter]);

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: SortKey) =>
		sortConfig.key !== key ? <ArrowUpDown className="ml-2 h-4 w-4" /> :
		sortConfig.order === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> :
		sortConfig.order === "desc" ? <ArrowDown className="ml-2 h-4 w-4" /> :
		<ArrowUpDown className="ml-2 h-4 w-4" />;

	const handleChangeStatus = async (event: EventRecord, next: EventStatus) => {
		try {
			await eventService.updateStatus(event.id, next);
			setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, status: next } : e));
			toast.success(`Đã chuyển sự kiện sang "${STATUS_MAP[next].label}".`);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể cập nhật trạng thái sự kiện.");
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await eventService.deleteEvent(deleteTarget.id);
			setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa sự kiện.");
		} catch {
			toast.error("Không thể xóa sự kiện. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	type NextAction = { next: EventStatus; label: string; icon: "publish" | "cancel" };

	// Trạng thái "Đang diễn ra"/"Đã kết thúc" được backend tự cập nhật theo thời gian sự kiện
	const getNextActions = (status: EventStatus): NextAction[] => {
		if (status === "draft")     return [{ next: "published", label: "Đăng sự kiện", icon: "publish" }];
		if (status === "published") return [{ next: "cancelled", label: "Hủy sự kiện", icon: "cancel" }];
		if (status === "ongoing")   return [{ next: "cancelled", label: "Hủy sự kiện", icon: "cancel" }];
		if (status === "cancelled") return [{ next: "published", label: "Đăng lại sự kiện", icon: "publish" }];
		return [];
	};

	const actionIcons = {
		publish: <CalendarCheck className="h-4 w-4" />,
		cancel: <Ban className="h-4 w-4" />,
	} as const;

	// Trang chi tiết admin: thông tin sự kiện + danh sách người tham gia + điểm danh QR
	const handleViewDetail = (event: EventRecord) => {
		navigate(`/events/${event.id}`);
	};

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Header */}
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold tracking-tight">
						Quản lý sự kiện của CLB
					</h2>
					<p className="text-muted-foreground">
						Tạo, đăng và theo dõi toàn bộ sự kiện của CLB. Kiểm soát trạng thái từng sự kiện từ bản nháp đến khi kết thúc.
					</p>
				</div>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-row items-center gap-3">
						<Input
							placeholder="Tìm theo tên sự kiện..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 min-w-0 flex-1 max-w-80"
						/>
						<div className="ml-auto flex shrink-0 items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8">
										<Filter className="h-4 w-4" />
										{statusOptions.find((o) => o.value === statusFilter)?.label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-[200px]">
									<DropdownMenuLabel>Trạng thái sự kiện</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{statusOptions.map((opt) => (
										<DropdownMenuItem key={opt.value} onClick={() => setStatusFilter(opt.value)}
											className={statusFilter === opt.value ? "bg-muted font-medium" : ""}>
											{opt.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								size="sm"
								className="h-8 bg-foreground text-background hover:bg-foreground/90"
								onClick={() => navigate("/events/create")}>
								<Plus className="h-4 w-4" />
								Thêm sự kiện
							</Button>
						</div>
					</div>

					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[44px]">
										<Checkbox aria-label="Chọn tất cả" checked={allSelected}
											onCheckedChange={(c) => toggleAll(c === true)} />
									</TableHead>
									<TableHead className="w-[90px]">
										<Button variant="ghost" onClick={() => handleSort("id")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											ID {getSortIcon("id")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[260px]">
										<Button variant="ghost" onClick={() => handleSort("title")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Sự kiện {getSortIcon("title")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[130px]">
										<Button variant="ghost" onClick={() => handleSort("department_name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Ban tổ chức {getSortIcon("department_name")}
										</Button>
									</TableHead>
									<TableHead className="w-[180px]">
										<Button variant="ghost" onClick={() => handleSort("start_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Thời gian {getSortIcon("start_at")}
										</Button>
									</TableHead>
									<TableHead className="w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("registrations_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Đăng ký {getSortIcon("registrations_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[140px]">
										<Button variant="ghost" onClick={() => handleSort("status")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Trạng thái {getSortIcon("status")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[150px]">
										<Button variant="ghost" onClick={() => handleSort("creator_name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Người tạo {getSortIcon("creator_name")}
										</Button>
									</TableHead>
									<TableHead className="w-[52px]" />
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									Array.from({ length: meta.per_page }).map((_, i) => (
										<TableRow key={i}>
											<TableCell><Skeleton className="h-4 w-4" /></TableCell>
											<TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : events.length > 0 ? (
									events.map((event) => (
										<TableRow key={event.id}>
											<TableCell>
												<Checkbox checked={isSelected(event.id)}
													onCheckedChange={(c) => toggleOne(event.id, c === true)} />
											</TableCell>
											<TableCell className="font-medium text-muted-foreground">
												EVT-{event.id}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
														{event.thumbnail ? (
															<img src={event.thumbnail} alt="" className="h-full w-full object-cover" />
														) : (
															<ImageIcon className="h-4 w-4 text-muted-foreground" />
														)}
													</div>
													<div className="min-w-0 space-y-1">
														{event.status === "draft" ? (
															<Link
																to={`/events/${event.id}/edit`}
																className="block truncate text-sm font-medium hover:underline">
																{event.title}
															</Link>
														) : (
															<a
																href={`${USER_SITE_URL}/su-kien/${event.slug}`}
																target="_blank"
																rel="noopener noreferrer"
																className="block truncate text-sm font-medium hover:underline">
																{event.title}
															</a>
														)}
														{event.location && (
															<p className="truncate text-xs text-muted-foreground">{truncate(event.location)}</p>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												{event.department ? (
													<Badge variant="outline" className="rounded-full px-3 py-1">
														{event.department.name}
													</Badge>
												) : (
													<span className="text-sm text-muted-foreground">--</span>
												)}
											</TableCell>
											<TableCell>
												<div className="space-y-0.5 text-sm text-muted-foreground">
													<p>{formatDate(event.start_at)}</p>
													<p className="text-xs">đến {formatDate(event.end_at)}</p>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-0.5 text-sm">
													<p>
														{event.registrations_count.toLocaleString("vi-VN")}
														{event.max_attendees ? ` / ${event.max_attendees.toLocaleString("vi-VN")}` : ""}
														{event.is_members_only ? " · TV CLB" : ""}
													</p>
													<p className="text-xs text-muted-foreground">
														Check-in: {event.check_ins_count.toLocaleString("vi-VN")}
													</p>
												</div>
											</TableCell>
											<TableCell>{getStatusBadge(event.status)}</TableCell>
											<TableCell>
												{event.creator ? (
													<div className="flex items-center gap-2.5">
														<Avatar className="h-7 w-7">
															<AvatarImage src={event.creator.avatar ?? undefined} />
															<AvatarFallback className="text-xs">
																{(event.creator.full_name ?? "?").charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<p className="truncate text-sm font-medium leading-none">
															{event.creator.full_name ?? "Ẩn danh"}
														</p>
													</div>
												) : (
													<span className="text-sm text-muted-foreground">--</span>
												)}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[200px]">
														<DropdownMenuItem onClick={() => handleViewDetail(event)}>
															<Eye className="h-4 w-4" />
															Xem chi tiết
														</DropdownMenuItem>
														{getNextActions(event.status).map(({ next, label, icon }) => (
															<DropdownMenuItem
																key={next}
																onClick={() => void handleChangeStatus(event, next)}
																className={icon === "cancel" ? "text-rose-600 focus:bg-rose-500/10 focus:text-rose-600" : ""}>
																{actionIcons[icon]}
																{label}
															</DropdownMenuItem>
														))}
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(event)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa sự kiện
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
											Không tìm thấy sự kiện nào phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={9}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {events.length} trên tổng {meta.total} sự kiện.
											</p>
											<div className="flex items-center space-x-6 lg:space-x-8">
												<div className="flex items-center space-x-2">
													<p className="text-sm font-medium">Rows per page</p>
													<Select value={`${meta.per_page}`}
														onValueChange={(v) => setMeta((p) => ({ ...p, per_page: Number(v), current_page: 1 }))}>
														<SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
														<SelectContent side="top">
															{[10, 20, 25, 50].map((s) => <SelectItem key={s} value={`${s}`}>{s}</SelectItem>)}
														</SelectContent>
													</Select>
												</div>
												<div className="flex w-[110px] items-center justify-center text-sm font-medium">
													Trang {meta.current_page} / {meta.last_page}
												</div>
												<div className="flex items-center space-x-2">
													<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
														onClick={() => setMeta((p) => ({ ...p, current_page: 1 }))} disabled={meta.current_page === 1}>
														<ChevronsLeft className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="h-8 w-8 p-0"
														onClick={() => setMeta((p) => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))} disabled={meta.current_page === 1}>
														<ChevronLeft className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="h-8 w-8 p-0"
														onClick={() => setMeta((p) => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))} disabled={meta.current_page === meta.last_page}>
														<ChevronRight className="h-4 w-4" />
													</Button>
													<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
														onClick={() => setMeta((p) => ({ ...p, current_page: p.last_page }))} disabled={meta.current_page === meta.last_page}>
														<ChevronsRight className="h-4 w-4" />
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

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{deleteTarget && (
						<>
							<DialogHeader><DialogTitle>Xác nhận xóa sự kiện</DialogTitle></DialogHeader>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>Bạn sắp xóa sự kiện <span className="font-semibold text-foreground">"{deleteTarget.title}"</span>.</p>
								<p>Sự kiện sẽ không còn hiển thị với thành viên. Các lượt đăng ký và check-in liên quan cũng sẽ không truy cập được.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa sự kiện"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default EventListPage;
