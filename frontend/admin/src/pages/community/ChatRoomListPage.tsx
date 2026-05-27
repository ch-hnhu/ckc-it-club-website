import { useCallback, useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Bot,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Crown,
	ImageIcon,
	LogOut,
	MessagesSquare,
	Pencil,
	Trash2,
	UserMinus,
	UserPlus,
	Users,
} from "lucide-react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import chatService from "@/services/chat.service";

// ─── Types (exported so service can import) ───────────────────────────────────

export interface ChatRoomRecord {
	id: number;
	type: "direct" | "group";
	name: string | null;
	member_count: number;
	message_count: number;
	system_events_count: number;
	last_message_at: string | null;
	created_at: string;
}

export interface ChatRoomStats {
	total: number;
	group_count: number;
	direct_count: number;
	system_events: number;
}

export interface ChatSystemMessageRecord {
	id: number;
	event_type: string | null;
	content: string | null;
	created_at: string;
	creator: {
		id: number;
		full_name: string;
		email: string;
		avatar: string | null;
	} | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null | undefined) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

type EventTypeMeta = {
	label: string;
	icon: React.ElementType;
	className: string;
};

const EVENT_TYPE_MAP: Record<string, EventTypeMeta> = {
	room_created:   { label: "Tạo phòng",       icon: MessagesSquare, className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10" },
	member_joined:  { label: "Tham gia",         icon: UserPlus,       className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10" },
	member_left:    { label: "Rời nhóm",         icon: LogOut,         className: "border-slate-500/20 bg-slate-500/10 text-slate-600 hover:bg-slate-500/10" },
	member_added:   { label: "Thêm thành viên",  icon: UserPlus,       className: "border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10" },
	member_removed: { label: "Xóa thành viên",   icon: UserMinus,      className: "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10" },
	avatar_changed: { label: "Đổi ảnh nhóm",     icon: ImageIcon,      className: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10" },
	room_renamed:   { label: "Đổi tên nhóm",     icon: Pencil,         className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/10" },
	role_changed:   { label: "Đổi vai trò",      icon: Crown,          className: "border-orange-500/20 bg-orange-500/10 text-orange-700 hover:bg-orange-500/10" },
};

const FALLBACK_EVENT: EventTypeMeta = {
	label: "Sự kiện",
	icon: Bot,
	className: "border-slate-500/20 bg-slate-500/10 text-slate-600 hover:bg-slate-500/10",
};

function getEventMeta(eventType: string | null): EventTypeMeta {
	if (!eventType) return FALLBACK_EVENT;
	return EVENT_TYPE_MAP[eventType] ?? { ...FALLBACK_EVENT, label: eventType };
}

type RoomSortKey = "id" | "name" | "member_count" | "system_events_count" | "last_message_at" | "created_at";

// ─── Sub-component: stat card ─────────────────────────────────────────────────

function StatCard({
	label,
	value,
	loading,
	icon: Icon,
	accent,
}: {
	label: string;
	value: number;
	loading: boolean;
	icon: React.ElementType;
	accent: string;
}) {
	return (
		<Card className="border-border/80 shadow-sm">
			<CardContent className="pt-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0 space-y-1">
						<p className="text-sm text-muted-foreground truncate">{label}</p>
						{loading ? (
							<Skeleton className="h-7 w-14" />
						) : (
							<p className="text-2xl font-bold tabular-nums">{value}</p>
						)}
					</div>
					<div className={cn("rounded-lg p-2.5 shrink-0", accent)}>
						<Icon className="h-5 w-5" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Sub-component: pagination footer ─────────────────────────────────────────

function PaginationFooter({
	meta,
	onPageChange,
	onPerPageChange,
	label,
}: {
	meta: { current_page: number; last_page: number; per_page: number; total: number };
	onPageChange: (page: number) => void;
	onPerPageChange: (perPage: number) => void;
	label: string;
}) {
	return (
		<div className="flex items-center justify-between px-2">
			<p className="flex-1 text-sm text-muted-foreground">
				Tổng {meta.total} {label}.
			</p>
			<div className="flex items-center space-x-6 lg:space-x-8">
				<div className="flex items-center space-x-2">
					<p className="text-sm font-medium">Rows per page</p>
					<Select value={`${meta.per_page}`} onValueChange={(v) => onPerPageChange(Number(v))}>
						<SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
						<SelectContent side="top">
							{[10, 20, 25, 50].map((s) => (
								<SelectItem key={s} value={`${s}`}>{s}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex w-[110px] items-center justify-center text-sm font-medium">
					Trang {meta.current_page} / {meta.last_page}
				</div>
				<div className="flex items-center space-x-2">
					<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(1)} disabled={meta.current_page === 1}>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button variant="outline" className="h-8 w-8 p-0"
						onClick={() => onPageChange(Math.max(1, meta.current_page - 1))} disabled={meta.current_page === 1}>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button variant="outline" className="h-8 w-8 p-0"
						onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))} disabled={meta.current_page === meta.last_page}>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(meta.last_page)} disabled={meta.current_page === meta.last_page}>
						<ChevronsRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── Component ────────────────────────────────────────────────────────────────

function ChatRoomListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Phòng chat" }]);

	// ── Stats ──
	const [stats, setStats] = useState<ChatRoomStats>({ total: 0, group_count: 0, direct_count: 0, system_events: 0 });
	const [loadingStats, setLoadingStats] = useState(true);

	// ── Rooms table ──
	const [rooms, setRooms] = useState<ChatRoomRecord[]>([]);
	const [loadingRooms, setLoadingRooms] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "group" | "direct">("all");
	const [sortConfig, setSortConfig] = useState<{ key: RoomSortKey | null; order: "asc" | "desc" | null }>({
		key: "last_message_at",
		order: "desc",
	});
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });

	// ── System messages dialog ──
	const [selectedRoom, setSelectedRoom] = useState<ChatRoomRecord | null>(null);
	const [sysMessages, setSysMessages] = useState<ChatSystemMessageRecord[]>([]);
	const [loadingSys, setLoadingSys] = useState(false);
	const [sysMeta, setSysMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
	const [sysEventFilter, setSysEventFilter] = useState("all");

	// ── Delete confirm ──
	const [deleteTarget, setDeleteTarget] = useState<{ roomId: number; msg: ChatSystemMessageRecord } | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// ── Debounce search ──
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(timer);
	}, [search]);

	// ── Reset page on filter/sort change ──
	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, typeFilter, sortConfig]);

	// ── Load stats ──
	useEffect(() => {
		setLoadingStats(true);
		chatService.getStats()
			.then((res) => { if (res.data) setStats(res.data); })
			.catch(() => {})
			.finally(() => setLoadingStats(false));
	}, []);

	// ── Load rooms ──
	useEffect(() => {
		let cancelled = false;
		setLoadingRooms(true);
		chatService.getRooms({
			page: meta.current_page,
			per_page: meta.per_page,
			search: debouncedSearch || undefined,
			type: typeFilter !== "all" ? typeFilter : undefined,
			sort: sortConfig.key ?? undefined,
			order: sortConfig.order ?? undefined,
		})
			.then((res) => {
				if (cancelled) return;
				setRooms(res.data ?? []);
				if (res.meta) {
					setMeta((p) => ({ ...p, last_page: res.meta.last_page, total: res.meta.total }));
				}
			})
			.catch(() => { if (!cancelled) toast.error("Không thể tải danh sách phòng chat."); })
			.finally(() => { if (!cancelled) setLoadingRooms(false); });
		return () => { cancelled = true; };
	}, [meta.current_page, meta.per_page, debouncedSearch, typeFilter, sortConfig]);

	// ── Load system messages for selected room ──
	const loadSysMessages = useCallback(() => {
		if (!selectedRoom) return;
		setLoadingSys(true);
		chatService.getSystemMessages(selectedRoom.id, {
			page: sysMeta.current_page,
			per_page: sysMeta.per_page,
			event_type: sysEventFilter !== "all" ? sysEventFilter : undefined,
		})
			.then((res) => {
				setSysMessages(res.data ?? []);
				if (res.meta) {
					setSysMeta((p) => ({ ...p, last_page: res.meta.last_page, total: res.meta.total }));
				}
			})
			.catch(() => toast.error("Không thể tải nhật ký sự kiện."))
			.finally(() => setLoadingSys(false));
	}, [selectedRoom, sysMeta.current_page, sysMeta.per_page, sysEventFilter]);

	useEffect(() => { loadSysMessages(); }, [loadSysMessages]);

	// ── Sort (3-state: asc → desc → null) ──
	const handleSort = (key: RoomSortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: RoomSortKey) =>
		sortConfig.key !== key    ? <ArrowUpDown className="ml-2 h-4 w-4" /> :
		sortConfig.order === "asc"  ? <ArrowUp   className="ml-2 h-4 w-4" /> :
		sortConfig.order === "desc" ? <ArrowDown  className="ml-2 h-4 w-4" /> :
		                              <ArrowUpDown className="ml-2 h-4 w-4" />;

	// ── Open / close system messages dialog ──
	const handleOpenSysMessages = (room: ChatRoomRecord) => {
		setSelectedRoom(room);
		setSysMessages([]);
		setSysMeta({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
		setSysEventFilter("all");
	};

	// ── Delete system message ──
	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await chatService.deleteSystemMessage(deleteTarget.roomId, deleteTarget.msg.id);
			toast.success("Đã xóa sự kiện.");
			setDeleteTarget(null);
			loadSysMessages();
			chatService.getStats().then((r) => { if (r.data) setStats(r.data); });
		} catch {
			toast.error("Không thể xóa sự kiện.");
		} finally {
			setIsDeleting(false);
		}
	};

	const roomDisplayName = (room: ChatRoomRecord) =>
		room.name ?? (room.type === "direct" ? "Chat trực tiếp" : `Nhóm #${room.id}`);

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Hero */}
				<section className="overflow-hidden rounded-[30px] border border-sky-500/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(248,252,255,0.96)_44%,rgba(252,254,255,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.10),rgba(8,14,18,0.96)_45%,rgba(5,9,12,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-800 hover:bg-sky-500/10 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
								Phòng chat
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Quản lý phòng chat
								</h1>
								<p className="text-sm leading-7 text-sky-950/70 md:text-base dark:text-sky-50/65">
									Theo dõi các phòng chat trong CLB và nhật ký sự kiện hệ thống — tham gia, rời nhóm, đổi tên, đổi ảnh...
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Stats cards */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard label="Tổng phòng chat" value={stats.total} loading={loadingStats}
						icon={MessagesSquare} accent="bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400" />
					<StatCard label="Phòng nhóm" value={stats.group_count} loading={loadingStats}
						icon={Users} accent="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400" />
					<StatCard label="Chat trực tiếp" value={stats.direct_count} loading={loadingStats}
						icon={UserPlus} accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" />
					<StatCard label="Sự kiện hệ thống" value={stats.system_events} loading={loadingStats}
						icon={Bot} accent="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" />
				</div>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					{/* Filters */}
					<div className="flex flex-wrap items-center gap-3">
						<Input
							placeholder="Tìm kiếm theo tên phòng..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 w-full sm:w-64 md:w-80"
						/>
						<Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
							<SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tất cả loại</SelectItem>
								<SelectItem value="group">Phòng nhóm</SelectItem>
								<SelectItem value="direct">Chat trực tiếp</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Rooms table */}
					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="min-w-[200px]">
										<Button variant="ghost" onClick={() => handleSort("name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tên phòng {getSortIcon("name")}
										</Button>
									</TableHead>
									<TableHead className="w-[120px] text-sm font-medium">Loại</TableHead>
									<TableHead className="w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("member_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Thành viên {getSortIcon("member_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[150px]">
										<Button variant="ghost" onClick={() => handleSort("system_events_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Sự kiện HT {getSortIcon("system_events_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[170px]">
										<Button variant="ghost" onClick={() => handleSort("last_message_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Hoạt động cuối {getSortIcon("last_message_at")}
										</Button>
									</TableHead>
									<TableHead className="w-[110px] text-sm font-medium">Thao tác</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{loadingRooms ? (
									Array.from({ length: 6 }).map((_, i) => (
										<TableRow key={i}>
											<TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : rooms.length > 0 ? (
									rooms.map((room) => (
										<TableRow key={room.id}>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<div className={cn(
														"flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
														room.type === "group"
															? "bg-violet-100 text-violet-600 dark:bg-violet-900/40"
															: "bg-sky-100 text-sky-600 dark:bg-sky-900/40",
													)}>
														{room.type === "group"
															? <Users className="h-4 w-4" />
															: <UserPlus className="h-4 w-4" />}
													</div>
													<div className="min-w-0">
														<p className="text-sm font-medium truncate">{roomDisplayName(room)}</p>
														<p className="text-xs text-muted-foreground">#{room.id}</p>
													</div>
												</div>
											</TableCell>

											<TableCell>
												{room.type === "group" ? (
													<Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs border-violet-500/20 bg-violet-500/10 text-violet-700">
														Nhóm
													</Badge>
												) : (
													<Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs border-sky-500/20 bg-sky-500/10 text-sky-700">
														Trực tiếp
													</Badge>
												)}
											</TableCell>

											<TableCell>
												<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<Users className="h-3.5 w-3.5" />
													{room.member_count}
												</div>
											</TableCell>

											<TableCell>
												{room.system_events_count > 0 ? (
													<Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs border-amber-500/20 bg-amber-500/10 text-amber-700">
														{room.system_events_count} sự kiện
													</Badge>
												) : (
													<span className="text-sm text-muted-foreground">—</span>
												)}
											</TableCell>

											<TableCell className="text-sm text-muted-foreground">
												{formatDate(room.last_message_at)}
											</TableCell>

											<TableCell>
												<Button
													variant="outline"
													size="sm"
													className="h-8 gap-1.5 text-xs"
													onClick={() => handleOpenSysMessages(room)}
												>
													<Bot className="h-3.5 w-3.5" />
													Nhật ký
												</Button>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
											Không có phòng chat nào.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={6}>
										<PaginationFooter
											meta={meta}
											onPageChange={(p) => setMeta((prev) => ({ ...prev, current_page: p }))}
											onPerPageChange={(pp) => setMeta((prev) => ({ ...prev, per_page: pp, current_page: 1 }))}
											label="phòng chat"
										/>
									</TableCell>
								</TableRow>
							</TableFooter>
						</Table>
					</div>
				</div>
			</div>

			{/* System messages dialog */}
			<Dialog open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
				<DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
					<DialogHeader className="shrink-0">
						<DialogTitle className="flex items-center gap-2">
							<Bot className="h-5 w-5 text-muted-foreground" />
							Nhật ký sự kiện —{" "}
							<span className="font-semibold">
								{selectedRoom ? roomDisplayName(selectedRoom) : ""}
							</span>
						</DialogTitle>
					</DialogHeader>

					{/* Filter bar */}
					<div className="flex items-center gap-3 shrink-0 pt-1">
						<Select value={sysEventFilter} onValueChange={(v) => {
							setSysEventFilter(v);
							setSysMeta((p) => ({ ...p, current_page: 1 }));
						}}>
							<SelectTrigger className="h-8 w-[190px] text-sm"><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tất cả sự kiện</SelectItem>
								<SelectItem value="room_created">Tạo phòng</SelectItem>
								<SelectItem value="member_joined">Tham gia</SelectItem>
								<SelectItem value="member_left">Rời nhóm</SelectItem>
								<SelectItem value="member_added">Thêm thành viên</SelectItem>
								<SelectItem value="member_removed">Xóa thành viên</SelectItem>
								<SelectItem value="avatar_changed">Đổi ảnh nhóm</SelectItem>
								<SelectItem value="room_renamed">Đổi tên nhóm</SelectItem>
								<SelectItem value="role_changed">Đổi vai trò</SelectItem>
							</SelectContent>
						</Select>
						<p className="text-sm text-muted-foreground">
							{loadingSys ? "Đang tải..." : `${sysMeta.total} sự kiện`}
						</p>
					</div>

					{/* Table */}
					<div className="flex-1 overflow-auto rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[130px] text-sm font-medium">Thời gian</TableHead>
									<TableHead className="w-[160px] text-sm font-medium">Loại sự kiện</TableHead>
									<TableHead className="min-w-[200px] text-sm font-medium">Nội dung</TableHead>
									<TableHead className="w-[160px] text-sm font-medium">Người thực hiện</TableHead>
									<TableHead className="w-[52px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{loadingSys ? (
									Array.from({ length: 5 }).map((_, i) => (
										<TableRow key={i}>
											<TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : sysMessages.length > 0 ? (
									sysMessages.map((msg) => {
										const evMeta = getEventMeta(msg.event_type);
										const Icon = evMeta.icon;
										return (
											<TableRow key={msg.id}>
												<TableCell className="text-xs text-muted-foreground whitespace-nowrap">
													{formatDate(msg.created_at)}
												</TableCell>
												<TableCell>
													<Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 gap-1.5 text-xs", evMeta.className)}>
														<Icon className="h-3 w-3" />
														{evMeta.label}
													</Badge>
												</TableCell>
												<TableCell>
													<p className="text-sm leading-5 text-muted-foreground line-clamp-2">
														{msg.content ?? "--"}
													</p>
												</TableCell>
												<TableCell>
													{msg.creator ? (
														<div className="space-y-0.5">
															<p className="text-sm font-medium truncate max-w-[140px]">{msg.creator.full_name}</p>
															<p className="text-xs text-muted-foreground truncate max-w-[140px]">{msg.creator.email}</p>
														</div>
													) : (
														<span className="text-xs text-muted-foreground italic">Hệ thống</span>
													)}
												</TableCell>
												<TableCell>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-muted-foreground hover:text-destructive"
														onClick={() => selectedRoom && setDeleteTarget({ roomId: selectedRoom.id, msg })}
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
											Không có sự kiện nào.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination inside dialog */}
					{sysMeta.last_page > 1 && (
						<div className="shrink-0 border-t pt-3">
							<PaginationFooter
								meta={sysMeta}
								onPageChange={(p) => setSysMeta((prev) => ({ ...prev, current_page: p }))}
								onPerPageChange={(pp) => setSysMeta((prev) => ({ ...prev, per_page: pp, current_page: 1 }))}
								label="sự kiện"
							/>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xác nhận xóa sự kiện</AlertDialogTitle>
						<AlertDialogDescription>
							Bản ghi sự kiện hệ thống này sẽ bị xóa vĩnh viễn. Hành động không thể hoàn tác.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Đang xóa..." : "Xóa"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default ChatRoomListPage;
