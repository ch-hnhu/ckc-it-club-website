import { useCallback, useEffect, useState } from "react";
import {
	ArrowUpDown,
	Bell,
	BellOff,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Info,
	MessageCircle,
	Send,
	SmilePlus,
	Sparkles,
	Trash2,
	Users,
	Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";
import notificationService from "@/services/notification.service";

// ─── Types (exported so service can import) ───────────────────────────────────

export type NotificationTarget = "all" | "role" | "faculty";
export type NotificationType   = "info" | "success" | "warning";
export type CommunityEventType = "comment" | "reaction" | "mention" | "new_post" | "chat" | "system";

export interface SentNotificationRecord {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	target: NotificationTarget;
	target_label: string;
	recipient_count: number;
	sent_at: string;
	sent_by: string;
}

export interface NotificationLogRecord {
	id: string;
	type: string | null;
	community_type: CommunityEventType | null;
	target_type: string | null;
	target_id: number | null;
	message: string | null;
	read_at: string | null;
	created_at: string;
	recipient_id: number | null;
	recipient_name: string | null;
	recipient_email: string | null;
	recipient_avatar: string | null;
	actor_id: number | null;
	actor_name: string | null;
	actor_email: string | null;
	actor_avatar: string | null;
}

export interface NotificationAdminStats {
	total: number;
	unread: number;
	auto_count: number;
	system_count: number;
	read_rate: number;
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

const BROADCAST_TYPE_MAP: Record<NotificationType, { label: string; className: string }> = {
	info: {
		label: "Thông tin",
		className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
	},
	success: {
		label: "Thành công",
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
	},
	warning: {
		label: "Cảnh báo",
		className: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
	},
};

const COMMUNITY_TYPE_MAP: Record<
	CommunityEventType,
	{ label: string; icon: React.ElementType; className: string }
> = {
	comment:  { label: "Bình luận", icon: MessageCircle, className: "border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10" },
	reaction: { label: "Cảm xúc",  icon: SmilePlus,     className: "border-pink-500/20 bg-pink-500/10 text-pink-700 hover:bg-pink-500/10" },
	mention:  { label: "Đề cập",   icon: Bell,           className: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10" },
	new_post: { label: "Bài viết", icon: Sparkles,       className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10" },
	chat:     { label: "Tin nhắn", icon: Zap,            className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10" },
	system:   { label: "Hệ thống", icon: Bell,           className: "border-slate-500/20 bg-slate-500/10 text-slate-700 hover:bg-slate-500/10" },
};

const TARGET_OPTIONS: Array<{ value: NotificationTarget; label: string }> = [
	{ value: "all",     label: "Tất cả thành viên" },
	{ value: "role",    label: "Theo vai trò" },
	{ value: "faculty", label: "Theo khoa" },
];

type LogSortKey = "created_at" | "community_type" | "read_at";

// ─── Compose form ─────────────────────────────────────────────────────────────

interface FormState {
	title: string;
	message: string;
	type: NotificationType;
	target: NotificationTarget;
	target_id: string;
}

const emptyForm: FormState = {
	title: "",
	message: "",
	type: "info",
	target: "all",
	target_id: "",
};

// ─── Sub-component: Stats Card ────────────────────────────────────────────────

function StatCard({
	label,
	value,
	sub,
	loading,
	icon: Icon,
	accent,
}: {
	label: string;
	value: number | string;
	sub?: string;
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
							<Skeleton className="h-7 w-16" />
						) : (
							<p className="text-2xl font-bold tabular-nums">{value}</p>
						)}
						{sub && !loading && (
							<p className="text-xs text-muted-foreground">{sub}</p>
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

// ─── Component ────────────────────────────────────────────────────────────────

function SystemNotificationPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Thông báo hệ thống" }]);

	// ── Stats ──
	const [stats, setStats] = useState<NotificationAdminStats | null>(null);
	const [loadingStats, setLoadingStats] = useState(true);

	// ── Tab 1: Broadcast compose ──
	const [form, setForm] = useState<FormState>(emptyForm);
	const [isSending, setIsSending] = useState(false);
	const [previewCount, setPreviewCount] = useState<number | null>(null);

	// ── Tab 1: Broadcast history ──
	const [history, setHistory] = useState<SentNotificationRecord[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [historyMeta, setHistoryMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const [historySort, setHistorySort] = useState<{
		key: "sent_at" | "title" | "type" | "target" | "recipient_count" | "sent_by";
		order: "asc" | "desc";
	}>({ key: "sent_at", order: "desc" });

	// ── Tab 2: Notification log ──
	const [logItems, setLogItems] = useState<NotificationLogRecord[]>([]);
	const [loadingLog, setLoadingLog] = useState(true);
	const [logMeta, setLogMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 20,
		total: 0,
	});
	const [logSort, setLogSort] = useState<{ key: LogSortKey; order: "asc" | "desc" }>({
		key: "created_at",
		order: "desc",
	});
	const [logFilter, setLogFilter] = useState<{ community_type: string; read_status: string }>({
		community_type: "all",
		read_status: "all",
	});
	const [deleteTarget, setDeleteTarget] = useState<NotificationLogRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// ── Load stats ──
	useEffect(() => {
		setLoadingStats(true);
		notificationService
			.getAdminStats()
			.then((res) => {
				if (res.data) setStats(res.data);
			})
			.catch(() => {/* silently ignore */})
			.finally(() => setLoadingStats(false));
	}, []);

	// ── Load history (broadcast — still placeholder, no backend endpoint yet) ──
	useEffect(() => {
		let cancelled = false;
		setLoadingHistory(true);
		// TODO: connect to a broadcast-history endpoint once available
		setTimeout(() => {
			if (cancelled) return;
			setHistory([]);
			setHistoryMeta({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
			setLoadingHistory(false);
		}, 400);
		return () => { cancelled = true; };
	}, [historyMeta.current_page, historyMeta.per_page, historySort]);

	// ── Load notification log ──
	const loadLog = useCallback(() => {
		setLoadingLog(true);
		notificationService
			.getLog({
				page: logMeta.current_page,
				per_page: logMeta.per_page,
				sort: logSort.key,
				order: logSort.order,
				community_type: logFilter.community_type !== "all" ? logFilter.community_type : undefined,
				read_status:
					logFilter.read_status !== "all"
						? (logFilter.read_status as "read" | "unread")
						: undefined,
			})
			.then((res) => {
				setLogItems(res.data ?? []);
				if (res.meta) {
					setLogMeta((p) => ({
						...p,
						last_page: res.meta!.last_page,
						total: res.meta!.total,
					}));
				}
			})
			.catch(() => toast.error("Không thể tải nhật ký thông báo."))
			.finally(() => setLoadingLog(false));
	}, [logMeta.current_page, logMeta.per_page, logSort, logFilter]);

	useEffect(() => {
		loadLog();
	}, [loadLog]);

	// ── Recipient preview count ──
	useEffect(() => {
		setPreviewCount(null);
		if (form.target === "all") {
			const t = setTimeout(() => setPreviewCount(0), 400);
			return () => clearTimeout(t);
		}
	}, [form.target, form.target_id]);

	// ── Handle broadcast send ──
	const handleSend = async () => {
		if (!form.title.trim()) { toast.error("Tiêu đề không được để trống."); return; }
		if (!form.message.trim()) { toast.error("Nội dung thông báo không được để trống."); return; }
		if (form.target !== "all" && !form.target_id) {
			toast.error("Vui lòng chọn đối tượng nhận thông báo."); return;
		}
		setIsSending(true);
		try {
			// TODO: notificationService.sendMass(form)
			await new Promise((r) => setTimeout(r, 800));
			toast.success("Đã gửi thông báo thành công.");
			setForm(emptyForm);
			setHistoryMeta((p) => ({ ...p, current_page: 1 }));
		} catch {
			toast.error("Không thể gửi thông báo. Vui lòng thử lại.");
		} finally {
			setIsSending(false);
		}
	};

	// ── Handle log sort toggle ──
	const toggleLogSort = (key: LogSortKey) => {
		setLogMeta((p) => ({ ...p, current_page: 1 }));
		setLogSort((prev) =>
			prev.key === key
				? { key, order: prev.order === "asc" ? "desc" : "asc" }
				: { key, order: "desc" },
		);
	};

	// ── Handle log filter change ──
	const handleLogFilter = (field: "community_type" | "read_status", value: string) => {
		setLogMeta((p) => ({ ...p, current_page: 1 }));
		setLogFilter((p) => ({ ...p, [field]: value }));
	};

	// ── Handle delete ──
	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await notificationService.deleteNotification(deleteTarget.id);
			toast.success("Đã xóa thông báo.");
			setDeleteTarget(null);
			// refresh stats + log
			setLoadingStats(true);
			notificationService.getAdminStats().then((r) => {
				if (r.data) setStats(r.data);
			}).finally(() => setLoadingStats(false));
			loadLog();
		} catch {
			toast.error("Không thể xóa thông báo.");
		} finally {
			setIsDeleting(false);
		}
	};

	const charCount = form.message.length;
	const maxChar   = 500;

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Hero */}
				<section className="overflow-hidden rounded-[30px] border border-rose-500/15 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(255,248,250,0.96)_44%,rgba(255,252,253,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(18,8,10,0.96)_45%,rgba(12,5,7,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-rose-800 hover:bg-rose-500/10 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
								Quản lý thông báo
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Trung tâm thông báo hệ thống
								</h1>
								<p className="text-sm leading-7 text-rose-950/70 md:text-base dark:text-rose-50/65">
									Gửi thông báo hàng loạt đến thành viên và theo dõi toàn bộ nhật ký thông báo cộng đồng trong CLB.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Stats cards */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatCard
						label="Tổng thông báo"
						value={stats?.total ?? 0}
						loading={loadingStats}
						icon={Bell}
						accent="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
					/>
					<StatCard
						label="Chưa đọc"
						value={stats?.unread ?? 0}
						sub={stats ? `Tỷ lệ đọc: ${stats.read_rate}%` : undefined}
						loading={loadingStats}
						icon={BellOff}
						accent="bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
					/>
					<StatCard
						label="Sự kiện tự động"
						value={stats?.auto_count ?? 0}
						sub="comment · reaction · mention · chat"
						loading={loadingStats}
						icon={Zap}
						accent="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
					/>
					<StatCard
						label="Admin gửi"
						value={stats?.system_count ?? 0}
						loading={loadingStats}
						icon={Send}
						accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
					/>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="broadcast" className="space-y-6">
					<TabsList className="h-10">
						<TabsTrigger value="broadcast" className="gap-2">
							<Send className="h-4 w-4" />
							Gửi hàng loạt
						</TabsTrigger>
						<TabsTrigger value="log" className="gap-2">
							<Bell className="h-4 w-4" />
							Nhật ký thông báo
						</TabsTrigger>
					</TabsList>

					{/* ── Tab 1: Broadcast ── */}
					<TabsContent value="broadcast" className="space-y-6">

						{/* Compose */}
						<Card className="border-border/80 shadow-sm">
							<CardHeader className="pb-4">
								<CardTitle className="flex items-center gap-2 text-base">
									<Bell className="h-4 w-4" />
									Soạn thông báo
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-5">
								<div className="grid gap-5 md:grid-cols-2">
									{/* Title */}
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="notif-title">
											Tiêu đề <span className="text-destructive">*</span>
										</Label>
										<Input
											id="notif-title"
											placeholder="Ví dụ: CLB thông báo lịch sinh hoạt tháng 6"
											value={form.title}
											onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
											maxLength={150}
										/>
									</div>

									{/* Type */}
									<div className="space-y-2">
										<Label htmlFor="notif-type">Loại thông báo</Label>
										<Select
											value={form.type}
											onValueChange={(v) => setForm((p) => ({ ...p, type: v as NotificationType }))}
										>
											<SelectTrigger id="notif-type"><SelectValue /></SelectTrigger>
											<SelectContent>
												<SelectItem value="info">
													<span className="flex items-center gap-2">
														<span className="h-2 w-2 rounded-full bg-sky-500" />
														Thông tin
													</span>
												</SelectItem>
												<SelectItem value="success">
													<span className="flex items-center gap-2">
														<span className="h-2 w-2 rounded-full bg-emerald-500" />
														Thành công
													</span>
												</SelectItem>
												<SelectItem value="warning">
													<span className="flex items-center gap-2">
														<span className="h-2 w-2 rounded-full bg-amber-500" />
														Cảnh báo
													</span>
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Target */}
									<div className="space-y-2">
										<Label htmlFor="notif-target">Đối tượng nhận</Label>
										<Select
											value={form.target}
											onValueChange={(v) =>
												setForm((p) => ({ ...p, target: v as NotificationTarget, target_id: "" }))
											}
										>
											<SelectTrigger id="notif-target"><SelectValue /></SelectTrigger>
											<SelectContent>
												{TARGET_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{/* Role sub-select */}
									{form.target === "role" && (
										<div className="space-y-2">
											<Label htmlFor="notif-role">Vai trò</Label>
											<Select
												value={form.target_id}
												onValueChange={(v) => setForm((p) => ({ ...p, target_id: v }))}
											>
												<SelectTrigger id="notif-role">
													<SelectValue placeholder="Chọn vai trò..." />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="admin">Quản trị viên</SelectItem>
													<SelectItem value="president">Chủ nhiệm</SelectItem>
													<SelectItem value="vice-president">Phó Chủ nhiệm</SelectItem>
													<SelectItem value="user">Thành viên</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}

									{/* Faculty sub-select */}
									{form.target === "faculty" && (
										<div className="space-y-2">
											<Label htmlFor="notif-faculty">Khoa</Label>
											<Select
												value={form.target_id}
												onValueChange={(v) => setForm((p) => ({ ...p, target_id: v }))}
											>
												<SelectTrigger id="notif-faculty">
													<SelectValue placeholder="Chọn khoa..." />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="cntt">Công nghệ thông tin</SelectItem>
													<SelectItem value="dien">Điện - Điện tử</SelectItem>
													<SelectItem value="co">Cơ khí</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</div>

								{/* Message */}
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor="notif-message">
											Nội dung <span className="text-destructive">*</span>
										</Label>
										<span className={cn("text-xs", charCount > maxChar * 0.9 ? "text-amber-600" : "text-muted-foreground")}>
											{charCount}/{maxChar}
										</span>
									</div>
									<Textarea
										id="notif-message"
										placeholder="Nhập nội dung thông báo..."
										value={form.message}
										onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
										maxLength={maxChar}
										rows={5}
										className="resize-none"
									/>
								</div>

								{/* Preview */}
								{form.title && form.message && (
									<div className={cn(
										"rounded-xl border p-4 space-y-1.5",
										form.type === "info"    && "border-sky-500/20 bg-sky-500/5",
										form.type === "success" && "border-emerald-500/20 bg-emerald-500/5",
										form.type === "warning" && "border-amber-500/20 bg-amber-500/5",
									)}>
										<div className="flex items-center gap-2">
											<Info className={cn("h-4 w-4",
												form.type === "info"    && "text-sky-600",
												form.type === "success" && "text-emerald-600",
												form.type === "warning" && "text-amber-600",
											)} />
											<p className="text-sm font-semibold">{form.title}</p>
										</div>
										<p className="text-sm text-muted-foreground leading-6 pl-6">{form.message}</p>
									</div>
								)}

								{/* Recipient bar */}
								<div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Users className="h-4 w-4" />
										<span>
											{form.target === "all"
												? "Gửi đến tất cả thành viên"
												: form.target === "role"
												? `Gửi đến vai trò: ${form.target_id || "chưa chọn"}`
												: `Gửi đến khoa: ${form.target_id || "chưa chọn"}`}
											{previewCount !== null && (
												<span className="ml-1 font-medium text-foreground">
													(~{previewCount} người)
												</span>
											)}
										</span>
									</div>
									<Button onClick={handleSend} disabled={isSending} className="h-8 gap-2">
										<Send className="h-4 w-4" />
										{isSending ? "Đang gửi..." : "Gửi ngay"}
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Broadcast history */}
						<div className="space-y-3">
							<h3 className="text-base font-semibold">Lịch sử thông báo đã gửi</h3>
							<div className="overflow-hidden rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-[130px]">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 gap-1 px-2 font-medium"
													onClick={() =>
														setHistorySort((p) => ({
															key: "sent_at",
															order: p.key === "sent_at" && p.order === "desc" ? "asc" : "desc",
														}))
													}
												>
													Thời gian gửi
													<ArrowUpDown className="h-3.5 w-3.5" />
												</Button>
											</TableHead>
											<TableHead className="min-w-[200px]">
												<Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-medium"
													onClick={() => setHistorySort((p) => ({ key: "title", order: p.key === "title" && p.order === "desc" ? "asc" : "desc" }))}>
													Tiêu đề <ArrowUpDown className="h-3.5 w-3.5" />
												</Button>
											</TableHead>
											<TableHead className="w-[120px]">
												<Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-medium"
													onClick={() => setHistorySort((p) => ({ key: "type", order: p.key === "type" && p.order === "desc" ? "asc" : "desc" }))}>
													Loại <ArrowUpDown className="h-3.5 w-3.5" />
												</Button>
											</TableHead>
											<TableHead className="w-[160px]">
												<Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-medium"
													onClick={() => setHistorySort((p) => ({ key: "target", order: p.key === "target" && p.order === "desc" ? "asc" : "desc" }))}>
													Đối tượng <ArrowUpDown className="h-3.5 w-3.5" />
												</Button>
											</TableHead>
											<TableHead className="w-[130px]">
												<Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-medium"
													onClick={() => setHistorySort((p) => ({ key: "recipient_count", order: p.key === "recipient_count" && p.order === "desc" ? "asc" : "desc" }))}>
													Số người nhận <ArrowUpDown className="h-3.5 w-3.5" />
												</Button>
											</TableHead>
											<TableHead className="w-[140px]">
												<Button variant="ghost" size="sm" className="h-8 gap-1 px-2 font-medium"
													onClick={() => setHistorySort((p) => ({ key: "sent_by", order: p.key === "sent_by" && p.order === "desc" ? "asc" : "desc" }))}>
													Người gửi <ArrowUpDown className="h-3.5 w-3.5" />
												</Button>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{loadingHistory ? (
											Array.from({ length: 4 }).map((_, i) => (
												<TableRow key={i}>
													<TableCell colSpan={6}><Skeleton className="h-4 w-full" /></TableCell>
												</TableRow>
											))
										) : history.length > 0 ? (
											history.map((item) => (
												<TableRow key={item.id}>
													<TableCell className="text-sm text-muted-foreground">{formatDate(item.sent_at)}</TableCell>
													<TableCell>
														<div className="space-y-0.5">
															<p className="text-sm font-medium">{item.title}</p>
															<p className="text-xs text-muted-foreground line-clamp-1">{item.message}</p>
														</div>
													</TableCell>
													<TableCell>
														<Badge variant="outline" className={cn("rounded-full px-3 py-1", BROADCAST_TYPE_MAP[item.type].className)}>
															{BROADCAST_TYPE_MAP[item.type].label}
														</Badge>
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">{item.target_label}</TableCell>
													<TableCell>
														<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
															<Users className="h-3.5 w-3.5" />
															{item.recipient_count} người
														</div>
													</TableCell>
													<TableCell className="text-sm text-muted-foreground">{item.sent_by}</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
													Chưa có thông báo nào được gửi.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
									<TableFooter className="bg-transparent">
										<TableRow>
											<TableCell colSpan={6}>
												<PaginationFooter
													meta={historyMeta}
													onPageChange={(p) => setHistoryMeta((prev) => ({ ...prev, current_page: p }))}
													onPerPageChange={(pp) => setHistoryMeta((prev) => ({ ...prev, per_page: pp, current_page: 1 }))}
													label="thông báo đã gửi"
												/>
											</TableCell>
										</TableRow>
									</TableFooter>
								</Table>
							</div>
						</div>
					</TabsContent>

					{/* ── Tab 2: Notification Log ── */}
					<TabsContent value="log" className="space-y-4">

						{/* Filters */}
						<div className="flex flex-wrap items-center gap-3">
							<Select
								value={logFilter.community_type}
								onValueChange={(v) => handleLogFilter("community_type", v)}
							>
								<SelectTrigger className="h-9 w-[180px]">
									<SelectValue placeholder="Loại sự kiện" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tất cả loại</SelectItem>
									<SelectItem value="comment">Bình luận</SelectItem>
									<SelectItem value="reaction">Cảm xúc</SelectItem>
									<SelectItem value="mention">Đề cập</SelectItem>
									<SelectItem value="new_post">Bài viết mới</SelectItem>
									<SelectItem value="chat">Tin nhắn</SelectItem>
									<SelectItem value="system">Hệ thống</SelectItem>
								</SelectContent>
							</Select>

							<Select
								value={logFilter.read_status}
								onValueChange={(v) => handleLogFilter("read_status", v)}
							>
								<SelectTrigger className="h-9 w-[150px]">
									<SelectValue placeholder="Trạng thái" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tất cả</SelectItem>
									<SelectItem value="unread">Chưa đọc</SelectItem>
									<SelectItem value="read">Đã đọc</SelectItem>
								</SelectContent>
							</Select>

							<p className="ml-auto text-sm text-muted-foreground">
								{loadingLog ? "Đang tải..." : `${logMeta.total} thông báo`}
							</p>
						</div>

						{/* Log table */}
						<div className="overflow-hidden rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[130px]">
											<Button
												variant="ghost"
												size="sm"
												className="h-8 gap-1 px-2 font-medium"
												onClick={() => toggleLogSort("created_at")}
											>
												Thời gian
												<ArrowUpDown className="h-3.5 w-3.5" />
											</Button>
										</TableHead>
										<TableHead className="w-[130px]">
											<Button
												variant="ghost"
												size="sm"
												className="h-8 gap-1 px-2 font-medium"
												onClick={() => toggleLogSort("community_type")}
											>
												Loại sự kiện
												<ArrowUpDown className="h-3.5 w-3.5" />
											</Button>
										</TableHead>
										<TableHead className="min-w-[200px]">Nội dung</TableHead>
										<TableHead className="w-[160px]">Người nhận</TableHead>
										<TableHead className="w-[160px]">Người tạo</TableHead>
										<TableHead className="w-[110px]">
											<Button
												variant="ghost"
												size="sm"
												className="h-8 gap-1 px-2 font-medium"
												onClick={() => toggleLogSort("read_at")}
											>
												Trạng thái
												<ArrowUpDown className="h-3.5 w-3.5" />
											</Button>
										</TableHead>
										<TableHead className="w-[60px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{loadingLog ? (
										Array.from({ length: 6 }).map((_, i) => (
											<TableRow key={i}>
												<TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell>
											</TableRow>
										))
									) : logItems.length > 0 ? (
										logItems.map((item) => {
											const ct = (item.community_type ?? "system") as CommunityEventType;
											const meta = COMMUNITY_TYPE_MAP[ct] ?? COMMUNITY_TYPE_MAP.system;
											const Icon = meta.icon;
											return (
												<TableRow key={item.id}>
													<TableCell className="text-sm text-muted-foreground whitespace-nowrap">
														{formatDate(item.created_at)}
													</TableCell>
													<TableCell>
														<Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 gap-1.5 text-xs", meta.className)}>
															<Icon className="h-3 w-3" />
															{meta.label}
														</Badge>
													</TableCell>
													<TableCell>
														<p className="text-sm leading-5 line-clamp-2 text-muted-foreground">
															{item.message ?? "--"}
														</p>
														{item.target_type && item.target_id && (
															<p className="text-xs text-muted-foreground/60 mt-0.5">
																{item.target_type} #{item.target_id}
															</p>
														)}
													</TableCell>
													<TableCell>
														{item.recipient_name ? (
															<div className="space-y-0.5">
																<p className="text-sm font-medium truncate max-w-[140px]">{item.recipient_name}</p>
																<p className="text-xs text-muted-foreground truncate max-w-[140px]">{item.recipient_email}</p>
															</div>
														) : (
															<span className="text-sm text-muted-foreground">--</span>
														)}
													</TableCell>
													<TableCell>
														{item.actor_name ? (
															<div className="space-y-0.5">
																<p className="text-sm font-medium truncate max-w-[140px]">{item.actor_name}</p>
																<p className="text-xs text-muted-foreground truncate max-w-[140px]">{item.actor_email}</p>
															</div>
														) : (
															<span className="text-sm text-muted-foreground">Hệ thống</span>
														)}
													</TableCell>
													<TableCell>
														{item.read_at ? (
															<Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
																Đã đọc
															</Badge>
														) : (
															<Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs border-rose-500/20 bg-rose-500/10 text-rose-700">
																Chưa đọc
															</Badge>
														)}
													</TableCell>
													<TableCell>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-muted-foreground hover:text-destructive"
															onClick={() => setDeleteTarget(item)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
												Không có thông báo nào.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								<TableFooter className="bg-transparent">
									<TableRow>
										<TableCell colSpan={7}>
											<PaginationFooter
												meta={logMeta}
												onPageChange={(p) => setLogMeta((prev) => ({ ...prev, current_page: p }))}
												onPerPageChange={(pp) => setLogMeta((prev) => ({ ...prev, per_page: pp, current_page: 1 }))}
												label="thông báo"
											/>
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{/* Delete confirm dialog */}
			<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xác nhận xóa thông báo</AlertDialogTitle>
						<AlertDialogDescription>
							Hành động này không thể hoàn tác. Thông báo sẽ bị xóa vĩnh viễn khỏi hệ thống.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Đang xóa..." : "Xóa thông báo"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ─── Reusable pagination footer ───────────────────────────────────────────────

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
					<Select
						value={`${meta.per_page}`}
						onValueChange={(v) => onPerPageChange(Number(v))}
					>
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
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(1)}
						disabled={meta.current_page === 1}
					>
						<ChevronsLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => onPageChange(Math.max(1, meta.current_page - 1))}
						disabled={meta.current_page === 1}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={() => onPageChange(Math.min(meta.last_page, meta.current_page + 1))}
						disabled={meta.current_page === meta.last_page}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						className="hidden h-8 w-8 p-0 lg:flex"
						onClick={() => onPageChange(meta.last_page)}
						disabled={meta.current_page === meta.last_page}
					>
						<ChevronsRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

export default SystemNotificationPage;
