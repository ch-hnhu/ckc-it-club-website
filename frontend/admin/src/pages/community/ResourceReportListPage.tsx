import { useEffect, useState } from "react";
import {
	AlertTriangle,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import resourceReportService, {
	type ResourceReportRecord,
	type ResourceReportStats,
} from "@/services/resource-report.service";

// ─── Constants ───────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
	inappropriate: "Nội dung không phù hợp",
	broken_link: "Link hỏng hoặc không truy cập được",
	copyright: "Vi phạm bản quyền",
	other: "Khác",
};

const STATUS_OPTIONS = [
	{ value: "all", label: "Tất cả" },
	{ value: "pending", label: "Chờ xử lý" },
	{ value: "dismissed", label: "Đã bỏ qua" },
	{ value: "resolved_hidden", label: "Đã ẩn tài nguyên" },
];

function StatusBadge({ status }: { status: ResourceReportRecord["status"] }) {
	const map: Record<string, { label: string; className: string }> = {
		pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
		dismissed: { label: "Đã bỏ qua", className: "bg-gray-100 text-gray-600 border-gray-200" },
		resolved_hidden: { label: "Đã ẩn tài nguyên", className: "bg-rose-100 text-rose-700 border-rose-200" },
	};
	const s = map[status] ?? { label: status, className: "" };
	return <Badge variant="outline" className={`text-xs font-semibold ${s.className}`}>{s.label}</Badge>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResourceReportListPage() {
	useBreadcrumb([{ title: "Báo cáo vi phạm tài nguyên", link: "/community/resource-reports" }]);

	const [reports, setReports] = useState<ResourceReportRecord[]>([]);
	const [stats, setStats] = useState<ResourceReportStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 20 });

	const [hideTarget, setHideTarget] = useState<ResourceReportRecord | null>(null);
	const [resolutionNote, setResolutionNote] = useState("");
	const [isHiding, setIsHiding] = useState(false);

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, statusFilter]);

	useEffect(() => {
		resourceReportService.getStats().then((r) => setStats(r.data)).catch(() => {});
	}, [reports]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		resourceReportService
			.getReports({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
			})
			.then((res) => {
				if (cancelled) return;
				setReports(res.data);
				setMeta((p) => ({ ...p, ...res.meta }));
			})
			.catch(() => toast.error("Không thể tải danh sách báo cáo."))
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [meta.current_page, meta.per_page, debouncedSearch, statusFilter]);

	const handleDismiss = async (report: ResourceReportRecord) => {
		try {
			const res = await resourceReportService.dismiss(report.id);
			setReports((prev) => prev.map((r) => r.id === report.id ? res.data : r));
			toast.success("Đã bỏ báo cáo.");
		} catch {
			toast.error("Không thể cập nhật báo cáo.");
		}
	};

	const openHideDialog = (report: ResourceReportRecord) => {
		setResolutionNote("");
		setHideTarget(report);
	};

	const handleConfirmHide = async () => {
		if (!hideTarget || !resolutionNote.trim()) return;
		setIsHiding(true);
		try {
			const res = await resourceReportService.hide(hideTarget.id, resolutionNote.trim());
			setReports((prev) => prev.map((r) => r.id === hideTarget.id ? res.data : r));
			toast.success("Đã ẩn tài nguyên và gửi thông báo cho người đăng.");
			setHideTarget(null);
		} catch {
			toast.error("Không thể ẩn tài nguyên.");
		} finally {
			setIsHiding(false);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div className="space-y-1">
				<h2 className="text-2xl font-semibold tracking-tight">Quản lý báo cáo vi phạm tài nguyên</h2>
				<p className="text-sm text-muted-foreground">
					Xem xét và xử lý các báo cáo vi phạm tài nguyên từ thành viên.
				</p>
			</div>

			<section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				{[
					{ label: "Tổng báo cáo", value: stats?.total, color: "text-foreground" },
					{ label: "Chờ xử lý", value: stats?.pending, color: "text-yellow-600" },
					{ label: "Đã xử lý", value: (stats?.dismissed ?? 0) + (stats?.resolved_hidden ?? 0), color: "text-green-600" },
				].map((s) => (
					<div key={s.label} className="rounded-lg border bg-card p-4 shadow-sm">
						<p className="min-h-[2.5rem] text-sm font-medium text-muted-foreground">{s.label}</p>
						<div className={`text-3xl font-bold ${s.color}`}>
							{s.value ?? <Skeleton className="mt-2 h-8 w-12" />}
						</div>
					</div>
				))}
			</section>

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
							<SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
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
								<TableHead className="w-[80px]">ID</TableHead>
								<TableHead className="min-w-[200px]">Tài nguyên</TableHead>
								<TableHead className="min-w-[160px]">Người báo cáo</TableHead>
								<TableHead className="w-[200px]">Lý do</TableHead>
								<TableHead className="w-[240px] max-w-[240px]">Mô tả</TableHead>
								<TableHead className="w-[150px]">Trạng thái</TableHead>
								<TableHead className="w-[140px]">Ngày báo cáo</TableHead>
								<TableHead className="w-[52px]" />
							</TableRow>
						</TableHeader>

						<TableBody>
							{loading ? (
								Array.from({ length: meta.per_page }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell>
									</TableRow>
								))
							) : reports.length > 0 ? (
								reports.map((report) => (
									<TableRow key={report.id} className={report.resource?.status === "hidden" ? "opacity-60" : ""}>
										<TableCell className="font-medium text-muted-foreground">#{report.id}</TableCell>

										<TableCell>
											{report.resource ? (
												<div className="flex items-start gap-1.5">
													<a
														href={`http://localhost:5173/tai-nguyen/${report.resource.id}`}
														target="_blank"
														rel="noopener noreferrer"
														className="block max-w-[180px] truncate text-sm font-medium hover:underline"
														title={report.resource.title}
													>
														{report.resource.title}
													</a>
													<ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
												</div>
											) : (
												<span className="text-xs italic text-muted-foreground/50">Tài nguyên đã xóa</span>
											)}
											{report.resource?.status === "hidden" && (
												<span className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
													<EyeOff className="h-3 w-3" /> Đã ẩn
												</span>
											)}
										</TableCell>

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

										<TableCell>
											<Badge variant="secondary" className="text-xs">
												{REASON_LABELS[report.reason] ?? report.reason}
											</Badge>
										</TableCell>

										<TableCell className="max-w-[240px]">
											{report.description ? (
												<span className="block truncate text-sm text-muted-foreground" title={report.description}>
													{report.description}
												</span>
											) : (
												<span className="text-xs italic text-muted-foreground/50">—</span>
											)}
										</TableCell>

										<TableCell><StatusBadge status={report.status} /></TableCell>

										<TableCell className="text-sm text-muted-foreground">
											{new Date(report.created_at).toLocaleDateString("vi-VN")}
										</TableCell>

										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-56">
													<DropdownMenuLabel>Hành động</DropdownMenuLabel>
													<DropdownMenuSeparator />
													{report.status === "pending" && (
														<>
															<DropdownMenuItem onClick={() => handleDismiss(report)}>
																Ổn, bỏ báo cáo
															</DropdownMenuItem>
															<DropdownMenuItem
																className="text-rose-600 focus:text-rose-600"
																onClick={() => openHideDialog(report)}
															>
																<EyeOff className="h-4 w-4" />
																Không ổn, ẩn tài nguyên
															</DropdownMenuItem>
														</>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={8} className="py-12 text-center">
										<AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
										<p className="text-sm text-muted-foreground">Không có báo cáo nào.</p>
									</TableCell>
								</TableRow>
							)}
						</TableBody>

						<TableFooter className="bg-transparent">
							<TableRow>
								<TableCell colSpan={8}>
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

			{/* Hide with reason dialog */}
			<Dialog open={Boolean(hideTarget)} onOpenChange={(o) => !o && setHideTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{hideTarget && (
						<>
							<DialogHeader><DialogTitle>Ẩn tài nguyên</DialogTitle></DialogHeader>
							<div className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Tài nguyên <span className="font-semibold text-foreground">"{hideTarget.resource?.title}"</span> sẽ bị ẩn.
									Lý do sẽ được gửi kèm thông báo cho người đăng.
								</p>
								<Textarea
									placeholder="VD: Tài liệu vi phạm bản quyền theo báo cáo của thành viên"
									value={resolutionNote}
									onChange={(e) => setResolutionNote(e.target.value)}
									className="min-h-[80px]"
								/>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setHideTarget(null)} disabled={isHiding}>Hủy</Button>
								<Button variant="destructive" onClick={handleConfirmHide} disabled={isHiding || !resolutionNote.trim()}>
									{isHiding ? "Đang xử lý..." : "Xác nhận ẩn và gửi thông báo"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
