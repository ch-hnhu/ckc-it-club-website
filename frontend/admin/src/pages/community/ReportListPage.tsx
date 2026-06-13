import { useEffect, useState } from "react";
import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ExternalLink,
	EyeOff,
	MoreHorizontal,
	ShieldAlert,
	XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import unifiedReportService, {
	type UnifiedReportRecord,
} from "@/services/unified-report.service";

// ─── Constants ───────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
	spam:           "Spam",
	offensive:      "Nội dung xúc phạm",
	misinformation: "Thông tin sai lệch",
	inappropriate:  "Không phù hợp",
	other:          "Khác",
};

const STATUS_OPTIONS = [
	{ value: "all",        label: "Tất cả trạng thái" },
	{ value: "pending",    label: "Chờ xử lý" },
	{ value: "reviewing",  label: "Đang xem xét" },
	{ value: "resolved",   label: "Đã xử lý" },
	{ value: "dismissed",  label: "Bỏ qua" },
	{ value: "superseded", label: "Đã xử lý trước đó" },
];

const TYPE_OPTIONS = [
	{ value: "all",  label: "Tất cả loại" },
	{ value: "post", label: "Post" },
	{ value: "blog", label: "Blog" },
];

/** Các trạng thái đã kết thúc — không cho xử lý lại */
const TERMINAL = new Set<UnifiedReportRecord["status"]>(["resolved", "dismissed", "superseded"]);

// ─── Helper components ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UnifiedReportRecord["status"] }) {
	const map: Record<string, { label: string; className: string }> = {
		pending:    { label: "Chờ xử lý",         className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
		reviewing:  { label: "Đang xem xét",       className: "bg-blue-100 text-blue-800 border-blue-200" },
		resolved:   { label: "Đã xử lý",           className: "bg-green-100 text-green-800 border-green-200" },
		dismissed:  { label: "Bỏ qua",             className: "bg-gray-100 text-gray-600 border-gray-200" },
		superseded: { label: "Đã xử lý trước đó",  className: "bg-gray-100 text-gray-400 border-gray-100 italic" },
	};
	const s = map[status] ?? { label: status, className: "" };
	return (
		<Badge variant="outline" className={`text-xs font-semibold ${s.className}`}>
			{s.label}
		</Badge>
	);
}

function TypeBadge({ type }: { type: "post" | "blog" }) {
	return type === "post" ? (
		<Badge variant="outline" className="text-xs font-semibold bg-violet-100 text-violet-700 border-violet-200">
			Post
		</Badge>
	) : (
		<Badge variant="outline" className="text-xs font-semibold bg-sky-100 text-sky-700 border-sky-200">
			Blog
		</Badge>
	);
}

function contentUrl(report: UnifiedReportRecord): string {
	if (!report.content) return "#";
	if (report.type === "post") {
		return `http://localhost:5174/cong-dong/bai-viet/${report.content.id}`;
	}
	return `http://localhost:5174/blog/${report.content.slug ?? report.content.id}`;
}

// ─── Resolve Modal ────────────────────────────────────────────────────────────

type ResolveStep = "choose" | "confirm-hide" | "confirm-dismiss";

interface ResolveModalProps {
	open: boolean;
	report: UnifiedReportRecord | null;
	onClose: () => void;
	onHide: () => Promise<void>;
	onDismiss: () => Promise<void>;
}

function ResolveReportModal({ open, report, onClose, onHide, onDismiss }: ResolveModalProps) {
	const [step, setStep] = useState<ResolveStep>("choose");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open) setStep("choose");
	}, [open]);

	const run = async (action: () => Promise<void>) => {
		setLoading(true);
		try {
			await action();
		} finally {
			setLoading(false);
		}
	};

	const contentLabel = report?.type === "post" ? "bài viết" : "blog";

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="w-[calc(100vw-2rem)] max-w-[460px] gap-0 p-0" showCloseButton={!loading}>
				<VisuallyHidden>
					<DialogTitle>Xử lý báo cáo</DialogTitle>
				</VisuallyHidden>

				{/* ── Bước 1: Chọn hành động ──────────────────────────────────── */}
				{step === "choose" && (
					<>
						{/* Header */}
						<div className="flex items-center gap-2.5 border-b px-5 py-4">
							<ShieldAlert className="h-5 w-5 shrink-0 text-orange-500" />
							<h2 className="text-base font-semibold leading-none">Xử lý báo cáo</h2>
						</div>

						<div className="px-5 pt-4 pb-5 space-y-3">
							{/* Preview nội dung bị báo cáo */}
							{report?.content && (
								<div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
									<TypeBadge type={report.type} />
									<a
										href={contentUrl(report)}
										target="_blank"
										rel="noopener noreferrer"
										className="flex min-w-0 items-center gap-1 font-medium hover:underline"
										title={report.content.title}
									>
										<span className="truncate">{report.content.title}</span>
										<ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
									</a>
								</div>
							)}

							{/* Hai lựa chọn — layout dọc */}
							<div className="space-y-2">
								<button
									onClick={() => setStep("confirm-hide")}
									className="flex w-full items-start gap-3 rounded-lg border-2 border-transparent bg-red-50 px-4 py-3 text-left transition-colors hover:border-red-200 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
								>
									<EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
									<div>
										<p className="text-sm font-semibold text-red-700">Ẩn nội dung</p>
										<p className="mt-0.5 text-xs text-red-500/80">
											Ẩn {contentLabel} vi phạm. Báo cáo này → <strong>Đã xử lý</strong>, các báo cáo khác đang chờ về cùng nội dung → <strong>Đã xử lý trước đó</strong>.
										</p>
									</div>
								</button>

								<button
									onClick={() => setStep("confirm-dismiss")}
									className="flex w-full items-start gap-3 rounded-lg border-2 border-transparent bg-gray-50 px-4 py-3 text-left transition-colors hover:border-gray-200 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
								>
									<XCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
									<div>
										<p className="text-sm font-semibold text-gray-700">Bỏ qua báo cáo</p>
										<p className="mt-0.5 text-xs text-gray-400">
											Báo cáo này không hợp lệ. Báo cáo khác về cùng nội dung vẫn giữ nguyên → <strong>Chờ xử lý</strong>.
										</p>
									</div>
								</button>
							</div>

							{/* Footer */}
							<div className="flex justify-end border-t pt-3">
								<Button variant="ghost" size="sm" onClick={onClose}>
									Hủy
								</Button>
							</div>
						</div>
					</>
				)}

				{/* ── Bước 2a: Xác nhận ẩn nội dung ──────────────────────────── */}
				{step === "confirm-hide" && (
					<>
						<div className="flex items-center gap-2.5 border-b px-5 py-4">
							<EyeOff className="h-5 w-5 shrink-0 text-red-500" />
							<h2 className="text-base font-semibold leading-none">Xác nhận ẩn nội dung</h2>
						</div>
						<div className="px-5 pt-4 pb-5 space-y-4">
							<p className="text-sm text-muted-foreground leading-relaxed">
								{report?.content ? (
									<>
										{contentLabel.charAt(0).toUpperCase() + contentLabel.slice(1)}{" "}
										<span className="font-medium text-foreground">
											"{report.content.title}"
										</span>{" "}
										sẽ bị ẩn khỏi cộng đồng. Báo cáo này sẽ được đánh dấu{" "}
										<strong className="text-foreground">Đã xử lý</strong>, các báo cáo khác đang chờ xử lý về cùng nội dung sẽ chuyển thành{" "}
										<strong className="text-foreground">Đã xử lý trước đó</strong>.
									</>
								) : (
									"Nội dung sẽ bị ẩn. Báo cáo này được đánh dấu đã xử lý, các báo cáo khác đang chờ xử lý về cùng nội dung chuyển thành đã xử lý trước đó."
								)}
							</p>
							<div className="flex justify-end gap-2 border-t pt-3">
								<Button variant="ghost" size="sm" onClick={() => setStep("choose")} disabled={loading}>
									Quay lại
								</Button>
								<Button variant="destructive" size="sm" disabled={loading} onClick={() => run(onHide)}>
									{loading ? "Đang xử lý…" : "Xác nhận ẩn"}
								</Button>
							</div>
						</div>
					</>
				)}

				{/* ── Bước 2b: Xác nhận bỏ qua ────────────────────────────────── */}
				{step === "confirm-dismiss" && (
					<>
						<div className="flex items-center gap-2.5 border-b px-5 py-4">
							<XCircle className="h-5 w-5 shrink-0 text-gray-500" />
							<h2 className="text-base font-semibold leading-none">Xác nhận bỏ qua báo cáo</h2>
						</div>
						<div className="px-5 pt-4 pb-5 space-y-4">
							<p className="text-sm text-muted-foreground leading-relaxed">
								Báo cáo này sẽ được đánh dấu <strong className="text-foreground">Bỏ qua</strong>.
								Các báo cáo khác về cùng nội dung vẫn giữ nguyên trạng thái{" "}
								<strong className="text-foreground">Chờ xử lý</strong>.
							</p>
							<div className="flex justify-end gap-2 border-t pt-3">
								<Button variant="ghost" size="sm" onClick={() => setStep("choose")} disabled={loading}>
									Quay lại
								</Button>
								<Button size="sm" disabled={loading} onClick={() => run(onDismiss)}>
									{loading ? "Đang xử lý…" : "Xác nhận bỏ qua"}
								</Button>
							</div>
						</div>
					</>
				)}

			</DialogContent>
		</Dialog>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReportListPage() {
	useBreadcrumb([{ title: "Báo cáo vi phạm", link: "/community/reports" }]);

	const [reports, setReports] = useState<UnifiedReportRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
	const [sortKey, setSortKey] = useState<
		"type" | "content_title" | "reporter_name" | "reason" | "description" | "status" | "created_at"
	>("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Resolve modal
	const [resolveModal, setResolveModal] = useState<{
		open: boolean;
		report: UnifiedReportRecord | null;
	}>({ open: false, report: null });

	const rowKeys = reports.map((r) => `${r.type}-${r.id}` as string);
	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(rowKeys);

	// ── Debounce search ──────────────────────────────────────────────────────
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	// Reset page khi thay đổi filter / sort
	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, statusFilter, typeFilter, sortKey, sortOrder]);

	// ── Load danh sách ───────────────────────────────────────────────────────
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		unifiedReportService
			.getReports({
				page:     meta.current_page,
				per_page: meta.per_page,
				search:   debouncedSearch || undefined,
				status:   statusFilter !== "all" ? statusFilter : undefined,
				type:     typeFilter   !== "all" ? typeFilter   : undefined,
				sort:     sortKey,
				order:    sortOrder,
			})
			.then((res) => {
				if (cancelled) return;
				setReports(res.data as unknown as UnifiedReportRecord[]);
				setMeta((p) => ({ ...p, ...res.meta }));
			})
			.catch(() => toast.error("Không thể tải danh sách báo cáo."))
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [
		meta.current_page, meta.per_page,
		debouncedSearch, statusFilter, typeFilter,
		sortKey, sortOrder,
		refreshTrigger,
	]);

	// ── Helpers ──────────────────────────────────────────────────────────────

	const refresh = () => setRefreshTrigger((t) => t + 1);

	const handleSort = (key: typeof sortKey) => {
		if (sortKey === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
		else { setSortKey(key); setSortOrder("desc"); }
	};

	const getSortIcon = (key: typeof sortKey) =>
		sortKey !== key ? <ArrowUpDown className="ml-2 h-4 w-4" /> :
		sortOrder === "asc"  ? <ArrowUp   className="ml-2 h-4 w-4" /> :
		                       <ArrowDown className="ml-2 h-4 w-4" />;

	// ── Action handlers ──────────────────────────────────────────────────────

	const handleHide = async () => {
		if (!resolveModal.report) return;
		await unifiedReportService.hideContent(resolveModal.report.type, resolveModal.report.id);
		toast.success("Đã ẩn nội dung và cập nhật tất cả báo cáo liên quan.");
		setResolveModal({ open: false, report: null });
		refresh();
	};

	const handleDismiss = async () => {
		if (!resolveModal.report) return;
		await unifiedReportService.dismiss(resolveModal.report.type, resolveModal.report.id);
		toast.success("Đã bỏ qua báo cáo.");
		setResolveModal({ open: false, report: null });
		refresh();
	};

	// ── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="space-y-1">
				<h2 className="text-2xl font-semibold tracking-tight">Quản lý báo cáo vi phạm</h2>
				<p className="text-sm text-muted-foreground">
					Xem xét và xử lý các báo cáo vi phạm từ cộng đồng.
				</p>
			</div>

			{/* Filter + Table */}
			<div className="flex flex-col gap-4">
				<div className="flex flex-row items-center gap-3">
					<Input
						placeholder="Tìm theo tên hoặc email người báo cáo..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-8 min-w-0 flex-1 max-w-80"
					/>
					<div className="ml-auto flex shrink-0 items-center gap-2">
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
							<SelectContent>
								{TYPE_OPTIONS.map((o) => (
									<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-8 w-52"><SelectValue /></SelectTrigger>
							<SelectContent>
								{STATUS_OPTIONS.map((o) => (
									<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="overflow-hidden rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[44px]">
									<Checkbox
										aria-label="Chọn tất cả"
										checked={allSelected}
										onCheckedChange={(c) => toggleAll(c === true)}
									/>
								</TableHead>
								<TableHead className="w-[60px] text-sm font-medium">STT</TableHead>
								<TableHead className="min-w-[200px]">
									<Button variant="ghost" onClick={() => handleSort("content_title")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Bài viết {getSortIcon("content_title")}
									</Button>
								</TableHead>
								<TableHead className="w-[90px]">
									<Button variant="ghost" onClick={() => handleSort("type")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Loại {getSortIcon("type")}
									</Button>
								</TableHead>
								<TableHead className="min-w-[160px]">
									<Button variant="ghost" onClick={() => handleSort("reporter_name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Người báo cáo {getSortIcon("reporter_name")}
									</Button>
								</TableHead>
								<TableHead className="w-[180px]">
									<Button variant="ghost" onClick={() => handleSort("reason")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Lý do {getSortIcon("reason")}
									</Button>
								</TableHead>
								<TableHead className="w-[240px] max-w-[240px]">
									<Button variant="ghost" onClick={() => handleSort("description")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Mô tả {getSortIcon("description")}
									</Button>
								</TableHead>
								<TableHead className="w-[160px]">
									<Button variant="ghost" onClick={() => handleSort("status")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Trạng thái {getSortIcon("status")}
									</Button>
								</TableHead>
								<TableHead className="w-[140px]">
									<Button variant="ghost" onClick={() => handleSort("created_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Ngày báo cáo {getSortIcon("created_at")}
									</Button>
								</TableHead>
								<TableHead className="w-[52px]" />
							</TableRow>
						</TableHeader>

						<TableBody>
							{loading ? (
								Array.from({ length: meta.per_page }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={10}><Skeleton className="h-4 w-full" /></TableCell>
									</TableRow>
								))
							) : reports.length > 0 ? (
								reports.map((report, index) => (
									<TableRow
										key={`${report.type}-${report.id}`}
										className={report.content?.status === "hidden" ? "opacity-60" : ""}
									>
										{/* Checkbox */}
										<TableCell className="w-[44px]">
											<Checkbox
												checked={isSelected(`${report.type}-${report.id}`)}
												onCheckedChange={(c) => toggleOne(`${report.type}-${report.id}`, c === true)}
											/>
										</TableCell>

										{/* STT */}
										<TableCell className="font-medium text-muted-foreground">
											{(meta.current_page - 1) * meta.per_page + index + 1}
										</TableCell>

										{/* Bài viết */}
										<TableCell>
											{report.content ? (
												<div className="flex items-start gap-1.5">
													<a
														href={contentUrl(report)}
														target="_blank"
														rel="noopener noreferrer"
														className="block max-w-[180px] truncate text-sm font-medium hover:underline"
														title={report.content.title}
													>
														{report.content.title}
													</a>
													<ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
												</div>
											) : (
												<span className="text-xs italic text-muted-foreground/50">
													{report.type === "post" ? "Bài viết đã xóa" : "Blog đã xóa"}
												</span>
											)}
											{report.content?.status === "hidden" && (
												<span className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
													<EyeOff className="h-3 w-3" /> Đã ẩn
												</span>
											)}
										</TableCell>

										{/* Loại */}
										<TableCell>
											<TypeBadge type={report.type} />
										</TableCell>

										{/* Người báo cáo */}
										<TableCell>
											{report.reporter ? (
												<div>
													<p className="text-sm font-medium">{report.reporter.full_name}</p>
													<p className="text-xs text-muted-foreground">{report.reporter.email}</p>
												</div>
											) : (
												<span className="text-xs italic text-muted-foreground/50">—</span>
											)}
										</TableCell>

										{/* Lý do */}
										<TableCell>
											<Badge variant="secondary" className="text-xs">
												{REASON_LABELS[report.reason] ?? report.reason}
											</Badge>
										</TableCell>

										{/* Mô tả */}
										<TableCell className="max-w-[240px]">
											{report.description ? (
												<span
													className="block truncate text-sm text-muted-foreground"
													title={report.description}
												>
													{report.description}
												</span>
											) : (
												<span className="text-xs italic text-muted-foreground/50">—</span>
											)}
										</TableCell>

										{/* Trạng thái */}
										<TableCell>
											<StatusBadge status={report.status} />
										</TableCell>

										{/* Ngày báo cáo */}
										<TableCell className="text-sm text-muted-foreground">
											{new Date(report.created_at).toLocaleDateString("vi-VN")}
										</TableCell>

										{/* Actions */}
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														className="h-8 w-8 p-0 data-[state=open]:bg-muted"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-44">
													{report.content && (
														<DropdownMenuItem asChild>
															<a
																href={contentUrl(report)}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center gap-2"
															>
																<ExternalLink className="h-4 w-4" />
																Xem {report.type === "post" ? "bài viết" : "blog"}
															</a>
														</DropdownMenuItem>
													)}
													{!TERMINAL.has(report.status) && (
														<DropdownMenuItem
															className="flex items-center gap-2"
															onClick={() => setResolveModal({ open: true, report })}
														>
															<ShieldAlert className="h-4 w-4" />
															Xử lý
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={10} className="py-12 text-center">
										<AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
										<p className="text-sm text-muted-foreground">Không có báo cáo nào.</p>
									</TableCell>
								</TableRow>
							)}
						</TableBody>

						<TableFooter className="bg-transparent">
							<TableRow>
								<TableCell colSpan={10}>
									<div className="flex items-center justify-between px-2">
										<p className="flex-1 text-sm text-muted-foreground">
											Đang hiển thị {reports.length} trên tổng {meta.total} báo cáo.
										</p>
										<div className="flex items-center space-x-6 lg:space-x-8">
											<div className="flex items-center space-x-2">
												<p className="text-sm font-medium">Rows per page</p>
												<Select
													value={`${meta.per_page}`}
													onValueChange={(v) =>
														setMeta((p) => ({ ...p, per_page: Number(v), current_page: 1 }))
													}
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
													variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
													onClick={() => setMeta((p) => ({ ...p, current_page: 1 }))}
													disabled={meta.current_page === 1}
												>
													<ChevronsLeft className="h-4 w-4" />
												</Button>
												<Button
													variant="outline" className="h-8 w-8 p-0"
													onClick={() => setMeta((p) => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))}
													disabled={meta.current_page === 1}
												>
													<ChevronLeft className="h-4 w-4" />
												</Button>
												<Button
													variant="outline" className="h-8 w-8 p-0"
													onClick={() => setMeta((p) => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))}
													disabled={meta.current_page === meta.last_page}
												>
													<ChevronRight className="h-4 w-4" />
												</Button>
												<Button
													variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
													onClick={() => setMeta((p) => ({ ...p, current_page: p.last_page }))}
													disabled={meta.current_page === meta.last_page}
												>
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

			{/* Modal xử lý */}
			<ResolveReportModal
				open={resolveModal.open}
				report={resolveModal.report}
				onClose={() => setResolveModal({ open: false, report: null })}
				onHide={handleHide}
				onDismiss={handleDismiss}
			/>
		</div>
	);
}
