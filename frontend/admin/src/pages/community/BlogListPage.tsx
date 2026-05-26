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
	RefreshCw,
	Trash2,
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

// ─── Types ───────────────────────────────────────────────────────────────────

export type BlogStatus = "draft" | "published" | "archived";

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

type SortKey = "id" | "status" | "view_count" | "published_at" | "created_at";

const statusOptions: Array<{ value: BlogStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "published", label: "Đã xuất bản" },
	{ value: "draft", label: "Bản nháp" },
	{ value: "archived", label: "Lưu trữ" },
];

const emptyStats: BlogStats = { total: 0, published: 0, draft: 0, archived: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

function BlogListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý blog" }]);

	const [blogs, setBlogs] = useState<BlogRecord[]>([]);
	const [stats, setStats] = useState<BlogStats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<BlogStatus | "all">("all");
	const [selectedBlog, setSelectedBlog] = useState<BlogRecord | null>(null);
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
		// TODO: replace with blogService.getBlogs(...)
		setTimeout(() => {
			if (cancelled) return;
			setBlogs([]);
			setStats(emptyStats);
			setMeta({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
			setLoading(false);
		}, 600);
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
		// TODO: blogService.updateStatus(blog.id, next)
		setBlogs((prev) => prev.map((b) => b.id === blog.id ? { ...b, status: next } : b));
		toast.success(`Đã chuyển blog sang "${STATUS_MAP[next].label}".`);
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			// TODO: blogService.deleteBlog(deleteTarget.id)
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
		if (status === "published") return [{ next: "archived", label: "Lưu trữ" }, { next: "draft", label: "Thu hồi về nháp" }];
		if (status === "archived") return [{ next: "published", label: "Khôi phục" }];
		return [];
	};

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Hero */}
				<section className="overflow-hidden rounded-[30px] border border-sky-500/15 bg-[linear-gradient(135deg,rgba(14,165,233,0.13),rgba(248,252,255,0.96)_44%,rgba(252,253,255,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.13),rgba(10,14,20,0.96)_45%,rgba(8,10,14,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-800 hover:bg-sky-500/10 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200">
								Quản lý Blog
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Quản lý bài viết Blog của CLB
								</h1>
								<p className="text-sm leading-7 text-sky-950/70 md:text-base dark:text-sky-50/65">
									Soạn thảo, xuất bản và quản lý toàn bộ bài viết chính thức của CLB. Kiểm soát trạng thái từng bài từ bản nháp đến xuất bản.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Button
									variant="outline"
									className="h-10 rounded-2xl border-sky-500/20 bg-background/80 px-4 text-sky-800 shadow-sm hover:bg-sky-500/10 dark:bg-background/70 dark:text-sky-200"
									onClick={() => { setSearch(""); setStatusFilter("all"); }}>
									<RefreshCw className="size-4" />
									Đặt lại bộ lọc
								</Button>
							</div>
						</div>
					</div>
				</section>

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
									<TableHead className="min-w-[160px] text-sm font-medium">Tác giả</TableHead>
									<TableHead className="min-w-[260px] text-sm font-medium">Tiêu đề</TableHead>
									<TableHead className="min-w-[120px] text-sm font-medium">Tags</TableHead>
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
												<div className="flex flex-wrap gap-1">
													{blog.tags.slice(0, 2).map((tag) => (
														<Badge key={tag.id} variant="outline" className="rounded-full px-2 py-0 text-xs"
															style={tag.color ? { borderColor: `${tag.color}40`, color: tag.color } : undefined}>
															{tag.name}
														</Badge>
													))}
													{blog.tags.length > 2 && (
														<Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">+{blog.tags.length - 2}</Badge>
													)}
												</div>
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
														<DropdownMenuItem onClick={() => setSelectedBlog(blog)}>
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

			{/* Detail dialog */}
			<Dialog open={Boolean(selectedBlog)} onOpenChange={(o) => !o && setSelectedBlog(null)}>
				<DialogContent className="sm:max-w-[680px]">
					{selectedBlog && (
						<>
							<DialogHeader>
								<DialogTitle>Chi tiết Blog BLG-{selectedBlog.id}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
									<Avatar className="h-9 w-9">
										<AvatarImage src={selectedBlog.user.avatar ?? undefined} />
										<AvatarFallback>{getAuthorInitials(selectedBlog.user)}</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">{selectedBlog.user.full_name ?? "Ẩn danh"}</p>
										<p className="text-xs text-muted-foreground">{selectedBlog.user.email}</p>
									</div>
									<div className="ml-auto">{getStatusBadge(selectedBlog.status)}</div>
								</div>
								<div className="space-y-1">
									<p className="text-sm font-medium">Tiêu đề</p>
									<p className="text-base font-semibold">{selectedBlog.title}</p>
									<p className="text-xs text-muted-foreground">/{selectedBlog.slug}</p>
								</div>
								{selectedBlog.excerpt && (
									<div className="space-y-1">
										<p className="text-sm font-medium">Tóm tắt</p>
										<p className="text-sm text-muted-foreground leading-6">{selectedBlog.excerpt}</p>
									</div>
								)}
								<div className="grid gap-4 sm:grid-cols-3 text-sm">
									<div className="space-y-0.5">
										<p className="font-medium">Lượt xem</p>
										<p className="text-muted-foreground">{selectedBlog.view_count.toLocaleString("vi-VN")}</p>
									</div>
									<div className="space-y-0.5">
										<p className="font-medium">Bình luận</p>
										<p className="text-muted-foreground">{selectedBlog.comments_count}</p>
									</div>
									<div className="space-y-0.5">
										<p className="font-medium">Cảm xúc</p>
										<p className="text-muted-foreground">{selectedBlog.reactions_count}</p>
									</div>
								</div>
								<div className="grid gap-4 sm:grid-cols-2 text-sm">
									<div className="space-y-0.5">
										<p className="font-medium">Xuất bản lúc</p>
										<p className="text-muted-foreground">{formatDate(selectedBlog.published_at)}</p>
									</div>
									<div className="space-y-0.5">
										<p className="font-medium">Cập nhật lần cuối</p>
										<p className="text-muted-foreground">{formatDate(selectedBlog.updated_at)}</p>
									</div>
								</div>
							</div>
							<DialogFooter className="gap-2">
								<Button variant="outline" onClick={() => setSelectedBlog(null)}>Đóng</Button>
								<Button variant="destructive" onClick={() => { setSelectedBlog(null); setDeleteTarget(selectedBlog); }}>
									<Trash2 className="h-4 w-4" />Xóa blog
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
