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
	EyeOff,
	ExternalLink,
	MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
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
import blogReportService, {
	type BlogReportRecord,
	type BlogReportStats,
} from "@/services/blog-report.service";

// ─── Constants ───────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
	spam: "Spam",
	offensive: "Nội dung xúc phạm",
	misinformation: "Thông tin sai lệch",
	inappropriate: "Không phù hợp",
	other: "Khác",
};

const STATUS_OPTIONS = [
	{ value: "all", label: "Tất cả" },
	{ value: "pending", label: "Chờ xử lý" },
	{ value: "reviewing", label: "Đang xem xét" },
	{ value: "resolved", label: "Đã xử lý" },
	{ value: "dismissed", label: "Bỏ qua" },
];

const NEXT_STATUS: Record<BlogReportRecord["status"], { value: BlogReportRecord["status"]; label: string }[]> = {
	pending: [
		{ value: "reviewing", label: "Chuyển sang Đang xem xét" },
		{ value: "dismissed", label: "Bỏ qua báo cáo" },
	],
	reviewing: [
		{ value: "resolved", label: "Đánh dấu Đã xử lý" },
		{ value: "dismissed", label: "Bỏ qua báo cáo" },
	],
	resolved: [{ value: "reviewing", label: "Mở lại xem xét" }],
	dismissed: [{ value: "reviewing", label: "Mở lại xem xét" }],
};

function StatusBadge({ status }: { status: BlogReportRecord["status"] }) {
	const map: Record<string, { label: string; className: string }> = {
		pending:   { label: "Chờ xử lý",    className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
		reviewing: { label: "Đang xem xét", className: "bg-blue-100 text-blue-800 border-blue-200" },
		resolved:  { label: "Đã xử lý",     className: "bg-green-100 text-green-800 border-green-200" },
		dismissed: { label: "Bỏ qua",        className: "bg-gray-100 text-gray-600 border-gray-200" },
	};
	const s = map[status] ?? { label: status, className: "" };
	return (
		<Badge variant="outline" className={`text-xs font-semibold ${s.className}`}>
			{s.label}
		</Badge>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BlogReportListPage() {
	useBreadcrumb([{ title: "Báo cáo vi phạm blog", link: "/community/blog-reports" }]);

	const [reports, setReports] = useState<BlogReportRecord[]>([]);
	const [stats, setStats] = useState<BlogReportStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
	const [sortKey, setSortKey] = useState<"id" | "blog_title" | "reporter_name" | "reason" | "description" | "status" | "created_at">("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(reports.map((r) => r.id));

	// Debounce
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, statusFilter, sortKey, sortOrder]);

	// Load stats
	useEffect(() => {
		blogReportService.getStats().then((r) => setStats(r.data)).catch(() => {});
	}, [reports]);

	// Load list
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		blogReportService
			.getReports({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
				sort: sortKey,
				order: sortOrder,
			})
			.then((res) => {
				if (cancelled) return;
				setReports(res.data as unknown as BlogReportRecord[]);
				setMeta((p) => ({ ...p, ...res.meta }));
			})
			.catch(() => toast.error("Không thể tải danh sách báo cáo."))
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [meta.current_page, meta.per_page, debouncedSearch, statusFilter, sortKey, sortOrder]);

	// ── Handlers ────────────────────────────────────────────────────────────

	const handleSort = (key: typeof sortKey) => {
		if (sortKey === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
		else { setSortKey(key); setSortOrder("desc"); }
	};

	const getSortIcon = (key: typeof sortKey) =>
		sortKey !== key ? <ArrowUpDown className="ml-2 h-4 w-4" /> :
		sortOrder === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> :
		<ArrowDown className="ml-2 h-4 w-4" />;

	const handleUpdateStatus = async (report: BlogReportRecord, status: BlogReportRecord["status"]) => {
		try {
			const res = await blogReportService.updateStatus(report.id, status);
			setReports((prev) => prev.map((r) => r.id === report.id ? res.data : r));
			toast.success("Đã cập nhật trạng thái.");
		} catch {
			toast.error("Không thể cập nhật trạng thái.");
		}
	};

	const handleHideBlog = async (report: BlogReportRecord) => {
		try {
			const res = await blogReportService.hideBlog(report.id);
			setReports((prev) => prev.map((r) => r.id === report.id ? res.data : r));
			toast.success("Đã ẩn blog và đánh dấu đã xử lý.");
		} catch {
			toast.error("Không thể ẩn blog.");
		}
	};

	// ── Render ──────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6 p-6">
			{/* Header */}
			<div className="space-y-1">
				<h2 className="text-2xl font-semibold tracking-tight">Quản lý báo cáo vi phạm blog</h2>
				<p className="text-sm text-muted-foreground">
					Xem xét và xử lý các báo cáo vi phạm blog từ cộng đồng.
				</p>
			</div>

			{/* Stats */}
			<section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{[
					{ label: "Tổng báo cáo",           value: stats?.total,                                              color: "text-foreground" },
					{ label: "Chờ xử lý",               value: stats?.pending,                                            color: "text-yellow-600" },
					{ label: "Đang xem xét",            value: stats?.reviewing,                                          color: "text-blue-600" },
					{ label: "Đã xử lý / Bỏ qua",       value: (stats?.resolved ?? 0) + (stats?.dismissed ?? 0),         color: "text-green-600" },
				].map((s) => (
					<div key={s.label} className="rounded-lg border bg-card p-4 shadow-sm">
						<p className="min-h-[2.5rem] text-sm font-medium text-muted-foreground">{s.label}</p>
						<div className={`text-3xl font-bold ${s.color}`}>
							{s.value ?? <Skeleton className="mt-2 h-8 w-12" />}
						</div>
					</div>
				))}
			</section>

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
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="h-8 w-40">
								<SelectValue />
							</SelectTrigger>
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
								<TableHead className="w-[80px]">
									<Button variant="ghost" onClick={() => handleSort("id")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										ID {getSortIcon("id")}
									</Button>
								</TableHead>
								<TableHead className="min-w-[200px]">
									<Button variant="ghost" onClick={() => handleSort("blog_title")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
										Blog {getSortIcon("blog_title")}
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
								<TableHead className="w-[140px]">
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
										<TableCell colSpan={9}><Skeleton className="h-4 w-full" /></TableCell>
									</TableRow>
								))
							) : reports.length > 0 ? (
								reports.map((report) => (
									<TableRow key={report.id} className={report.blog?.status === "hidden" ? "opacity-60" : ""}>
										<TableCell className="w-[44px]">
											<Checkbox
												checked={isSelected(report.id)}
												onCheckedChange={(c) => toggleOne(report.id, c === true)}
											/>
										</TableCell>

										<TableCell className="font-medium text-muted-foreground">
											#{report.id}
										</TableCell>

										{/* Blog */}
										<TableCell>
											{report.blog ? (
												<div className="flex items-start gap-1.5">
													<a
														href={`http://localhost:5174/blog/${report.blog.slug}`}
														target="_blank"
														rel="noopener noreferrer"
														className="block max-w-[180px] truncate text-sm font-medium hover:underline"
														title={report.blog.title}
													>
														{report.blog.title}
													</a>
													<ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
												</div>
											) : (
												<span className="text-xs italic text-muted-foreground/50">Blog đã xóa</span>
											)}
											{report.blog?.status === "hidden" && (
												<span className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
													<EyeOff className="h-3 w-3" /> Đã ẩn
												</span>
											)}
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
												<span className="block truncate text-sm text-muted-foreground" title={report.description}>
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

										{/* Ngày */}
										<TableCell className="text-sm text-muted-foreground">
											{new Date(report.created_at).toLocaleDateString("vi-VN")}
										</TableCell>

										{/* Actions */}
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-52">
													<DropdownMenuLabel>Hành động</DropdownMenuLabel>
													<DropdownMenuSeparator />
													{report.blog && (
														<DropdownMenuItem asChild>
															<a
																href={`http://localhost:5174/blog/${report.blog.slug}`}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center gap-2"
															>
																<ExternalLink className="h-4 w-4" />
																Xem blog
															</a>
														</DropdownMenuItem>
													)}
													{report.blog && report.blog.status !== "hidden" && (
														<DropdownMenuItem
															className="text-orange-600 focus:text-orange-600"
															onClick={() => handleHideBlog(report)}
														>
															<EyeOff className="h-4 w-4" />
															Ẩn blog
														</DropdownMenuItem>
													)}
													{(NEXT_STATUS[report.status] ?? []).length > 0 && <DropdownMenuSeparator />}
													{(NEXT_STATUS[report.status] ?? []).map((opt) => (
														<DropdownMenuItem
															key={opt.value}
															onClick={() => handleUpdateStatus(report, opt.value)}
														>
															{opt.label}
														</DropdownMenuItem>
													))}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={9} className="py-12 text-center">
										<AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
										<p className="text-sm text-muted-foreground">Không có báo cáo nào.</p>
									</TableCell>
								</TableRow>
							)}
						</TableBody>

						<TableFooter className="bg-transparent">
							<TableRow>
								<TableCell colSpan={9}>
									<div className="flex items-center justify-between px-2">
										<p className="flex-1 text-sm text-muted-foreground">
											Đang hiển thị {reports.length} trên tổng {meta.total} báo cáo.
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
													onClick={() => setMeta((p) => ({ ...p, current_page: 1 }))}
													disabled={meta.current_page === 1}>
													<ChevronsLeft className="h-4 w-4" />
												</Button>
												<Button variant="outline" className="h-8 w-8 p-0"
													onClick={() => setMeta((p) => ({ ...p, current_page: Math.max(1, p.current_page - 1) }))}
													disabled={meta.current_page === 1}>
													<ChevronLeft className="h-4 w-4" />
												</Button>
												<Button variant="outline" className="h-8 w-8 p-0"
													onClick={() => setMeta((p) => ({ ...p, current_page: Math.min(p.last_page, p.current_page + 1) }))}
													disabled={meta.current_page === meta.last_page}>
													<ChevronRight className="h-4 w-4" />
												</Button>
												<Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
													onClick={() => setMeta((p) => ({ ...p, current_page: p.last_page }))}
													disabled={meta.current_page === meta.last_page}>
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
	);
}
