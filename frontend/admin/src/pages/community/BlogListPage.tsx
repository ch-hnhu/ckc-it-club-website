import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	BookOpen,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	Filter,
	MoreHorizontal,
	Plus,
	Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { CompactBadgeList } from "@/components/ui/compact-badge-list";
import { cn } from "@/lib/utils";
import blogService from "@/services/blog.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BlogStatus = "draft" | "pending_review" | "published" | "archived";

export interface BlogTag {
	id: number;
	name: string;
	color: string | null;
}

export interface BlogAuthor {
	id: number;
	full_name: string | null;
	email: string;
	avatar: string | null;
}

export interface BlogRecord {
	id: number;
	user: BlogAuthor;
	title: string;
	slug: string;
	excerpt: string | null;
	featured_image: string | null;
	status: BlogStatus;
	published_at: string | null;
	view_count: number;
	comments_count: number;
	reactions_count: number;
	tags: BlogTag[];
	created_at: string;
	updated_at: string;
}

export interface BlogStats {
	total: number;
	published: number;
	draft: number;
	archived: number;
	pending_review?: number;
}

export interface BlogDetail extends BlogRecord {
	content: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getAuthorInitials(a: BlogAuthor) {
	return (a.full_name ?? a.email).charAt(0).toUpperCase();
}

const STATUS_MAP: Record<BlogStatus, { label: string; className: string }> = {
	published: {
		label: "Đã xuất bản",
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
	},
	draft: {
		label: "Bản nháp",
		className: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
	},
	pending_review: {
		label: "Chờ duyệt",
		className: "border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10",
	},
	archived: {
		label: "Lưu trữ",
		className: "border-slate-500/20 bg-slate-500/10 text-slate-600 hover:bg-slate-500/10",
	},
};

function getStatusBadge(status: BlogStatus) {
	const { label, className } = STATUS_MAP[status];
	return (
		<Badge variant="outline" className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

type SortKey = "id" | "title" | "status" | "view_count" | "published_at" | "created_at" | "user_name" | "tags_count";

const statusOptions: Array<{ value: BlogStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "published", label: "Đã xuất bản" },
	{ value: "pending_review", label: "Chờ duyệt" },
	{ value: "draft", label: "Bản nháp" },
	{ value: "archived", label: "Lưu trữ" },
];

const emptyStats: BlogStats = { total: 0, published: 0, draft: 0, archived: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

function BlogListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý blog" }]);

	const navigate = useNavigate();

	const [blogs, setBlogs] = useState<BlogRecord[]>([]);
	const [stats, setStats] = useState<BlogStats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<BlogStatus | "all">("all");
	const [deleteTarget, setDeleteTarget] = useState<BlogRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; order: "asc" | "desc" | null }>({
		key: "created_at",
		order: "desc",
	});

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(blogs.map((b) => b.id));

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
			blogService.getBlogs({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key ?? undefined,
				order: sortConfig.order ?? undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
			}),
			blogService.getStats(),
		]).then(([blogsRes, statsRes]) => {
			if (cancelled) return;
			setBlogs(blogsRes.data);
			setMeta((p) => ({
				...p,
				last_page: blogsRes.meta.last_page,
				total: blogsRes.meta.total,
			}));
			setStats(statsRes.data);
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách blog.");
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

	const handleChangeStatus = async (blog: BlogRecord, next: BlogStatus) => {
		try {
			await blogService.updateStatus(blog.id, next);
			setBlogs((prev) => prev.map((b) => b.id === blog.id ? { ...b, status: next } : b));
			toast.success(`Đã chuyển blog sang "${STATUS_MAP[next].label}".`);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể cập nhật trạng thái blog.");
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await blogService.deleteBlog(deleteTarget.id);
			setBlogs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa blog.");
		} catch {
			toast.error("Không thể xóa blog. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const getNextActions = (status: BlogStatus): Array<{ next: BlogStatus; label: string }> => {
		if (status === "draft") return [{ next: "published", label: "Xuất bản" }];
		if (status === "pending_review") return [{ next: "published", label: "Duyệt & Xuất bản" }, { next: "draft", label: "Trả về nháp" }];
		if (status === "published") return [{ next: "archived", label: "Lưu trữ" }, { next: "draft", label: "Thu hồi về nháp" }];
		if (status === "archived") return [{ next: "published", label: "Khôi phục" }];
		return [];
	};

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Header */}
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold tracking-tight">
						Quản lý bài viết Blog của CLB
					</h2>
					<p className="text-muted-foreground">
						Soạn thảo, xuất bản và quản lý toàn bộ bài viết chính thức của CLB. Kiểm soát trạng thái từng bài từ bản nháp đến xuất bản.
					</p>
				</div>

				{/* Stats */}
				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{([
						{ label: "Tổng blog", value: stats.total, color: "sky", desc: "Tổng số bài viết trong hệ thống." },
						{ label: "Đã xuất bản", value: stats.published, color: "emerald", desc: "Bài viết đang hiển thị công khai." },
						{ label: "Bản nháp", value: stats.draft, color: "amber", desc: "Bài viết chưa được xuất bản." },
						{ label: "Lưu trữ", value: stats.archived, color: "slate", desc: "Bài viết đã được lưu trữ." },
					] as const).map(({ label, value, color, desc }) => (
						<div key={label} className={cn("rounded-2xl border p-5 shadow-sm",
							color === "sky" && "border-sky-500/15 bg-sky-500/5",
							color === "emerald" && "border-emerald-500/15 bg-emerald-500/5",
							color === "amber" && "border-amber-500/15 bg-amber-500/5",
							color === "slate" && "border-slate-500/15 bg-slate-500/5",
						)}>
							<p className="text-sm font-semibold text-foreground">{label}</p>
							<p className={cn("mt-1 text-3xl font-semibold tracking-tight",
								color === "sky" && "text-sky-700 dark:text-sky-300",
								color === "emerald" && "text-emerald-700 dark:text-emerald-300",
								color === "amber" && "text-amber-700 dark:text-amber-300",
								color === "slate" && "text-slate-600 dark:text-slate-400",
							)}>{value}</p>
							<p className="mt-1 text-xs text-muted-foreground">{desc}</p>
						</div>
					))}
				</section>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<Input
							placeholder="Lọc theo tiêu đề hoặc tác giả..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 w-full sm:w-64 md:w-80"
						/>
						<div className="flex items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8">
										<Filter className="h-4 w-4" />
										{statusOptions.find((o) => o.value === statusFilter)?.label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-[200px]">
									<DropdownMenuLabel>Trạng thái blog</DropdownMenuLabel>
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
								onClick={() => navigate("/community/blogs/create")}>
								<Plus className="h-4 w-4" />
								Thêm blog
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
									<TableHead className="min-w-[160px]">
										<Button variant="ghost" onClick={() => handleSort("user_name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tác giả {getSortIcon("user_name")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[260px]">
										<Button variant="ghost" onClick={() => handleSort("title")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tiêu đề {getSortIcon("title")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("tags_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tags {getSortIcon("tags_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[140px]">
										<Button variant="ghost" onClick={() => handleSort("status")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Trạng thái {getSortIcon("status")}
										</Button>
									</TableHead>
									<TableHead className="w-[110px]">
										<Button variant="ghost" onClick={() => handleSort("view_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Lượt xem {getSortIcon("view_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[150px]">
										<Button variant="ghost" onClick={() => handleSort("published_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Xuất bản lúc {getSortIcon("published_at")}
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
								) : blogs.length > 0 ? (
									blogs.map((blog) => (
										<TableRow key={blog.id}>
											<TableCell>
												<Checkbox checked={isSelected(blog.id)}
													onCheckedChange={(c) => toggleOne(blog.id, c === true)} />
											</TableCell>
											<TableCell className="font-medium text-muted-foreground">
												BLG-{blog.id}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<Avatar className="h-7 w-7">
														<AvatarImage src={blog.user.avatar ?? undefined} />
														<AvatarFallback className="text-xs">{getAuthorInitials(blog.user)}</AvatarFallback>
													</Avatar>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium leading-none">{blog.user.full_name ?? "Ẩn danh"}</p>
														<p className="mt-0.5 truncate text-xs text-muted-foreground">{blog.user.email}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1">
													<p className="truncate text-sm font-medium">{blog.title}</p>
													{blog.excerpt && (
														<p className="truncate text-xs text-muted-foreground">{truncate(blog.excerpt)}</p>
													)}
												</div>
											</TableCell>
											<TableCell>
												<CompactBadgeList
													items={blog.tags.map((tag) => ({ key: tag.id, label: tag.name }))}
													emptyLabel="--"
												/>
											</TableCell>
											<TableCell>{getStatusBadge(blog.status)}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{blog.view_count.toLocaleString("vi-VN")}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{formatDate(blog.published_at)}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[190px]">
														<DropdownMenuItem onClick={() => navigate(`/community/blogs/${blog.id}`)}>
															<Eye className="h-4 w-4" />
															Xem chi tiết
														</DropdownMenuItem>
														{getNextActions(blog.status).map(({ next, label }) => (
															<DropdownMenuItem key={next} onClick={() => void handleChangeStatus(blog, next)}>
																<BookOpen className="h-4 w-4" />
																{label}
															</DropdownMenuItem>
														))}
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(blog)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa blog
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
											Không tìm thấy bài viết nào phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={9}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {blogs.length} trên tổng {meta.total} bài viết.
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
							<DialogHeader><DialogTitle>Xác nhận xóa blog</DialogTitle></DialogHeader>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>Bạn sắp xóa blog <span className="font-semibold text-foreground">"{deleteTarget.title}"</span>.</p>
								<p>Hành động này không thể hoàn tác. Toàn bộ bình luận và cảm xúc liên quan cũng sẽ bị xóa.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa blog"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default BlogListPage;
