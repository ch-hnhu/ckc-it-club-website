import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	Check,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ExternalLink,
	Filter,
	MoreHorizontal,
	Trash2,
	X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import resourceService, {
	type ResourceRecord,
	type ResourceStats,
	type ResourceStatus,
} from "@/services/resource.service";

// ─── Constants ───────────────────────────────────────────────────────────────

const LINK_TYPE_LABELS: Record<string, string> = {
	google_drive: "Google Drive",
	youtube: "YouTube",
	github: "GitHub",
	document: "Tài liệu",
	other: "Khác",
};

const STATUS_MAP: Record<ResourceStatus, { label: string; className: string }> = {
	pending_review: { label: "Chờ duyệt", className: "border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10" },
	published: { label: "Đã đăng", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10" },
	rejected: { label: "Bị từ chối", className: "border-slate-500/20 bg-slate-500/10 text-slate-600 hover:bg-slate-500/10" },
	hidden: { label: "Đã ẩn", className: "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10" },
};

const statusOptions: Array<{ value: ResourceStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "pending_review", label: "Chờ duyệt" },
	{ value: "published", label: "Đã đăng" },
	{ value: "rejected", label: "Bị từ chối" },
	{ value: "hidden", label: "Đã ẩn" },
];

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });
function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

function getInitials(name: string | null, email: string) {
	return (name ?? email).charAt(0).toUpperCase();
}

const emptyStats: ResourceStats = { total: 0, pending_review: 0, published: 0, rejected: 0, hidden: 0 };

type SortKey = "id" | "title" | "status" | "link_type" | "click_count" | "created_at";

// ─── Component ───────────────────────────────────────────────────────────────

function ResourceListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý tài nguyên chia sẻ" }]);

	const [resources, setResources] = useState<ResourceRecord[]>([]);
	const [stats, setStats] = useState<ResourceStats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; order: "asc" | "desc" | null }>({
		key: "created_at",
		order: "desc",
	});

	const [reviewTarget, setReviewTarget] = useState<{ resource: ResourceRecord; status: "published" | "rejected" } | null>(null);
	const [notify, setNotify] = useState(true);
	const [isReviewing, setIsReviewing] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<ResourceRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(resources.map((r) => r.id));

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

		Promise.all([
			resourceService.getResources({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key ?? undefined,
				order: sortConfig.order ?? undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
			}),
			resourceService.getStats(),
		]).then(([resourcesRes, statsRes]) => {
			if (cancelled) return;
			setResources(resourcesRes.data);
			setMeta((p) => ({ ...p, last_page: resourcesRes.meta.last_page, total: resourcesRes.meta.total }));
			setStats(statsRes.data);
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách tài nguyên.");
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

	const openReview = (resource: ResourceRecord, status: "published" | "rejected") => {
		setNotify(true);
		setReviewTarget({ resource, status });
	};

	const handleConfirmReview = async () => {
		if (!reviewTarget) return;
		setIsReviewing(true);
		try {
			await resourceService.updateStatus(reviewTarget.resource.id, reviewTarget.status, notify);
			setResources((prev) => prev.map((r) => r.id === reviewTarget.resource.id ? { ...r, status: reviewTarget.status } : r));
			toast.success(reviewTarget.status === "published" ? "Đã duyệt tài nguyên." : "Đã từ chối tài nguyên.");
			setReviewTarget(null);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể cập nhật trạng thái.");
		} finally {
			setIsReviewing(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await resourceService.deleteResource(deleteTarget.id);
			setResources((prev) => prev.filter((r) => r.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa tài nguyên.");
		} catch {
			toast.error("Không thể xóa tài nguyên.");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				<div className="space-y-2">
					<h2 className="text-2xl font-semibold tracking-tight">Quản lý tài nguyên chia sẻ</h2>
					<p className="text-muted-foreground">
						Duyệt tài nguyên do thành viên gửi lên và quản lý tài nguyên đang được chia sẻ trong CLB.
					</p>
				</div>

				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{([
						{ label: "Tổng tài nguyên", value: stats.total, color: "sky" },
						{ label: "Chờ duyệt", value: stats.pending_review, color: "amber" },
						{ label: "Đã đăng", value: stats.published, color: "emerald" },
						{ label: "Đã ẩn", value: stats.hidden, color: "rose" },
					] as const).map(({ label, value, color }) => (
						<div key={label} className={cn("rounded-2xl border p-5 shadow-sm",
							color === "sky" && "border-sky-500/15 bg-sky-500/5",
							color === "amber" && "border-amber-500/15 bg-amber-500/5",
							color === "emerald" && "border-emerald-500/15 bg-emerald-500/5",
							color === "rose" && "border-rose-500/15 bg-rose-500/5",
						)}>
							<p className="text-sm font-semibold text-foreground">{label}</p>
							<p className={cn("mt-1 text-3xl font-semibold tracking-tight",
								color === "sky" && "text-sky-700 dark:text-sky-300",
								color === "amber" && "text-amber-700 dark:text-amber-300",
								color === "emerald" && "text-emerald-700 dark:text-emerald-300",
								color === "rose" && "text-rose-700 dark:text-rose-300",
							)}>{value}</p>
						</div>
					))}
				</section>

				<div className="flex flex-col gap-4">
					<div className="flex flex-row items-center gap-3">
						<Input
							placeholder="Lọc theo tiêu đề hoặc người gửi..."
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
									<DropdownMenuLabel>Trạng thái</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{statusOptions.map((opt) => (
										<DropdownMenuItem key={opt.value} onClick={() => setStatusFilter(opt.value)}
											className={statusFilter === opt.value ? "bg-muted font-medium" : ""}>
											{opt.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>

					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[44px]">
										<Checkbox aria-label="Chọn tất cả" checked={allSelected} onCheckedChange={(c) => toggleAll(c === true)} />
									</TableHead>
									<TableHead className="w-[80px]">
										<Button variant="ghost" onClick={() => handleSort("id")} className="-ml-4 h-8 hover:bg-muted-foreground/10">ID {getSortIcon("id")}</Button>
									</TableHead>
									<TableHead className="min-w-[160px]">Người gửi</TableHead>
									<TableHead className="min-w-[220px]">
										<Button variant="ghost" onClick={() => handleSort("title")} className="-ml-4 h-8 hover:bg-muted-foreground/10">Tiêu đề {getSortIcon("title")}</Button>
									</TableHead>
									<TableHead className="w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("link_type")} className="-ml-4 h-8 hover:bg-muted-foreground/10">Loại {getSortIcon("link_type")}</Button>
									</TableHead>
									<TableHead className="w-[130px]">
										<Button variant="ghost" onClick={() => handleSort("status")} className="-ml-4 h-8 hover:bg-muted-foreground/10">Trạng thái {getSortIcon("status")}</Button>
									</TableHead>
									<TableHead className="w-[100px]">
										<Button variant="ghost" onClick={() => handleSort("click_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">Lượt mở {getSortIcon("click_count")}</Button>
									</TableHead>
									<TableHead className="w-[150px]">
										<Button variant="ghost" onClick={() => handleSort("created_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">Ngày gửi {getSortIcon("created_at")}</Button>
									</TableHead>
									<TableHead className="w-[52px]" />
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									Array.from({ length: meta.per_page }).map((_, i) => (
										<TableRow key={i}>
											<TableCell><Skeleton className="h-4 w-4" /></TableCell>
											<TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : resources.length > 0 ? (
									resources.map((resource) => (
										<TableRow key={resource.id}>
											<TableCell>
												<Checkbox checked={isSelected(resource.id)} onCheckedChange={(c) => toggleOne(resource.id, c === true)} />
											</TableCell>
											<TableCell className="font-medium text-muted-foreground">RES-{resource.id}</TableCell>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<Avatar className="h-7 w-7">
														<AvatarImage src={resource.uploader?.avatar ?? undefined} />
														<AvatarFallback className="text-xs">
															{resource.uploader ? getInitials(resource.uploader.full_name, resource.uploader.email) : "?"}
														</AvatarFallback>
													</Avatar>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium leading-none">{resource.uploader?.full_name ?? "Ẩn danh"}</p>
														<p className="mt-0.5 truncate text-xs text-muted-foreground">{resource.uploader?.email}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1">
													<p className="truncate text-sm font-medium">{resource.title}</p>
													{resource.description && (
														<p className="truncate text-xs text-muted-foreground">{resource.description}</p>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="secondary" className="text-xs">{LINK_TYPE_LABELS[resource.link_type]}</Badge>
											</TableCell>
											<TableCell>
												<Badge variant="outline" className={cn("rounded-full px-3 py-1", STATUS_MAP[resource.status].className)}>
													{STATUS_MAP[resource.status].label}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">{resource.click_count.toLocaleString("vi-VN")}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{formatDate(resource.created_at)}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[200px]">
														<DropdownMenuItem asChild>
															<a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
																<ExternalLink className="h-4 w-4" />
																Mở liên kết
															</a>
														</DropdownMenuItem>
														{resource.status === "pending_review" && (
															<>
																<DropdownMenuSeparator />
																<DropdownMenuItem onClick={() => openReview(resource, "published")}>
																	<Check className="h-4 w-4" />
																	Chấp nhận
																</DropdownMenuItem>
																<DropdownMenuItem
																	className="text-rose-600 focus:bg-rose-500/10 focus:text-rose-600"
																	onClick={() => openReview(resource, "rejected")}>
																	<X className="h-4 w-4" />
																	Từ chối
																</DropdownMenuItem>
															</>
														)}
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(resource)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa tài nguyên
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
											Không tìm thấy tài nguyên nào phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={9}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {resources.length} trên tổng {meta.total} tài nguyên.
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

			{/* Review confirm */}
			<Dialog open={Boolean(reviewTarget)} onOpenChange={(o) => !o && setReviewTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{reviewTarget && (
						<>
							<DialogHeader>
								<DialogTitle>
									{reviewTarget.status === "published" ? "Chấp nhận tài nguyên" : "Từ chối tài nguyên"}
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>
									Tài nguyên <span className="font-semibold text-foreground">"{reviewTarget.resource.title}"</span> sẽ được{" "}
									{reviewTarget.status === "published" ? "đăng công khai" : "từ chối"}.
								</p>
								<label className="flex items-center gap-2 text-sm">
									<Checkbox checked={notify} onCheckedChange={(c) => setNotify(c === true)} />
									Gửi thông báo cho người gửi
								</label>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setReviewTarget(null)} disabled={isReviewing}>Hủy</Button>
								<Button onClick={handleConfirmReview} disabled={isReviewing}>
									{isReviewing ? "Đang xử lý..." : "Xác nhận"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{deleteTarget && (
						<>
							<DialogHeader><DialogTitle>Xác nhận xóa tài nguyên</DialogTitle></DialogHeader>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>Bạn sắp xóa tài nguyên <span className="font-semibold text-foreground">"{deleteTarget.title}"</span>.</p>
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa tài nguyên"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default ResourceListPage;
