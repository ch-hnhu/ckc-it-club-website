import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Eye,
	EyeOff,
	Filter,
	Image,
	MoreHorizontal,
	Pin,
	PinOff,
	Plus,
	RefreshCw,
	SquarePen,
	Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import { cn } from "@/lib/utils";
import postService from "@/services/post.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostStatus = "published" | "hidden";
export type PostVisibility = "public" | "members_only";

export interface PostTag {
	id: number;
	name: string;
	color: string | null;
}

export interface PostAuthor {
	id: number;
	full_name: string | null;
	email: string;
	avatar: string | null;
	student_code: string | null;
}

export interface PostMedia {
	id: number;
	file_type: "image" | "video";
	file_path: string;
}

export interface PostRecord {
	id: number;
	user: PostAuthor;
	content: string;
	status: PostStatus;
	visibility: PostVisibility;
	is_pinned: boolean;
	comments_count: number;
	reactions_count: number;
	tags: PostTag[];
	media: PostMedia[];
	created_at: string;
	updated_at: string;
}

export interface PostStats {
	total: number;
	published: number;
	hidden: number;
	pinned: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	dateStyle: "medium",
	timeStyle: "short",
});

function formatDate(value: string | null) {
	if (!value) return "--";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "--";
	return dateFormatter.format(date);
}

function truncate(value: string, max = 80) {
	return value.length <= max ? value : `${value.slice(0, max).trimEnd()}…`;
}

function getAuthorInitials(author: PostAuthor) {
	return (author.full_name ?? author.email).charAt(0).toUpperCase();
}

function getStatusBadge(status: PostStatus) {
	return status === "published" ? (
		<Badge
			variant="outline"
			className="rounded-full px-3 py-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
			Hiển thị
		</Badge>
	) : (
		<Badge
			variant="outline"
			className="rounded-full px-3 py-1 border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10">
			Đã ẩn
		</Badge>
	);
}

function getVisibilityLabel(v: PostVisibility) {
	return v === "public" ? "Công khai" : "Thành viên";
}

type SortKey = "id" | "status" | "created_at";

const statusFilterOptions: Array<{ value: PostStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "published", label: "Đang hiển thị" },
	{ value: "hidden", label: "Đã ẩn" },
];

// ─── Mock stats (replace with API call) ──────────────────────────────────────

const emptyStats: PostStats = { total: 0, published: 0, hidden: 0, pinned: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

function PostListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý bài đăng" }]);

	const navigate = useNavigate();

	const [posts, setPosts] = useState<PostRecord[]>([]);
	const [stats, setStats] = useState<PostStats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
	const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<PostRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({ key: "created_at", order: "desc" });

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		posts.map((p) => p.id),
	);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(timer);
	}, [search]);

	// Reset to page 1 on filter/sort change
	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, statusFilter, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			postService.getPosts({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key ?? undefined,
				order: sortConfig.order ?? undefined,
				status: statusFilter !== "all" ? statusFilter : undefined,
			}),
			postService.getStats(),
		]).then(([postsRes, statsRes]) => {
			if (cancelled) return;
			setPosts(postsRes.data);
			setMeta((p) => ({
				...p,
				last_page: postsRes.meta.last_page,
				total: postsRes.meta.total,
			}));
			setStats(statsRes.data);
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách bài đăng.");
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});

		return () => { cancelled = true; };
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, sortConfig, statusFilter]);

	// ── Sorting ──

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order = sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: SortKey) =>
		sortConfig.key !== key ? (
			<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
		) : sortConfig.order === "asc" ? (
			<ArrowUp className="h-3.5 w-3.5" />
		) : sortConfig.order === "desc" ? (
			<ArrowDown className="h-3.5 w-3.5" />
		) : (
			<ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
		);

	// ── Actions ──

	const handleTogglePin = (post: PostRecord) => {
		setPosts((prev) =>
			prev.map((p) => (p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p)),
		);
		toast.success(post.is_pinned ? "Đã bỏ ghim bài đăng." : "Đã ghim bài đăng lên đầu.");
	};

	const handleToggleStatus = async (post: PostRecord) => {
		const next: PostStatus = post.status === "published" ? "hidden" : "published";
		try {
			await postService.updateStatus(post.id, next);
			setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: next } : p)));
			toast.success(next === "hidden" ? "Đã ẩn bài đăng." : "Đã hiện bài đăng.");
		} catch {
			toast.error("Không thể cập nhật trạng thái bài đăng.");
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await postService.deletePost(deleteTarget.id);
			setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((prev) => prev + 1);
			toast.success("Đã xóa bài đăng.");
		} catch {
			toast.error("Không thể xóa bài đăng. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const activeFilterCount =
		Number(Boolean(search.trim())) + Number(statusFilter !== "all");

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* ── Hero banner ── */}
				<section className="overflow-hidden rounded-[30px] border border-violet-500/15 bg-[linear-gradient(135deg,rgba(139,92,246,0.15),rgba(248,250,255,0.96)_44%,rgba(252,252,255,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(139,92,246,0.15),rgba(12,12,18,0.96)_45%,rgba(8,8,12,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-violet-800 hover:bg-violet-500/10 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200">
								Quản lý bài đăng cộng đồng
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Kiểm duyệt và quản lý bài đăng
								</h1>
								<p className="text-sm leading-7 text-violet-950/70 md:text-base dark:text-violet-50/65">
									Xem toàn bộ bài đăng từ thành viên, kiểm duyệt nội dung, ghim bài nổi bật và xóa bài vi phạm.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Button
									variant="outline"
									className="h-10 rounded-2xl border-violet-500/20 bg-background/80 px-4 text-violet-800 shadow-sm hover:bg-violet-500/10 dark:bg-background/70 dark:text-violet-200"
									onClick={() => { setSearch(""); setStatusFilter("all"); }}>
									<RefreshCw className="size-4" />
									Đặt lại bộ lọc
								</Button>
								<div className="inline-flex h-10 items-center gap-2 rounded-2xl border border-violet-500/20 bg-background/72 px-4 text-sm font-medium text-violet-800 dark:text-violet-200">
									<Filter className="size-4" />
									{activeFilterCount} điều kiện đang áp dụng
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* ── Stats cards ── */}
				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{[
						{
							label: "Tổng bài đăng",
							value: stats.total,
							desc: "Tổng số bài đăng trong hệ thống.",
							color: "violet",
						},
						{
							label: "Đang hiển thị",
							value: stats.published,
							desc: "Bài đăng công khai, thành viên có thể xem.",
							color: "emerald",
						},
						{
							label: "Đã ẩn",
							value: stats.hidden,
							desc: "Bài bị admin ẩn do vi phạm nội quy.",
							color: "rose",
						},
						{
							label: "Đang ghim",
							value: stats.pinned,
							desc: "Bài được ghim lên đầu trang cộng đồng.",
							color: "amber",
						},
					].map(({ label, value, desc, color }) => (
						<div
							key={label}
							className={cn(
								"rounded-2xl border p-5 shadow-sm",
								color === "violet" && "border-violet-500/15 bg-violet-500/5",
								color === "emerald" && "border-emerald-500/15 bg-emerald-500/5",
								color === "rose" && "border-rose-500/15 bg-rose-500/5",
								color === "amber" && "border-amber-500/15 bg-amber-500/5",
							)}>
							<p className="text-sm font-semibold text-foreground">{label}</p>
							<p className={cn(
								"mt-1 text-3xl font-semibold tracking-tight",
								color === "violet" && "text-violet-700 dark:text-violet-300",
								color === "emerald" && "text-emerald-700 dark:text-emerald-300",
								color === "rose" && "text-rose-700 dark:text-rose-300",
								color === "amber" && "text-amber-700 dark:text-amber-300",
							)}>
								{value}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">{desc}</p>
						</div>
					))}
				</section>

				{/* ── Filter bar + Table ── */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-1 items-center gap-2">
							<Input
								placeholder="Lọc theo tên tác giả hoặc nội dung bài đăng..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="h-8 w-full sm:w-64 md:w-80"
							/>
						</div>
						<div className="flex items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8">
										<Filter className="h-4 w-4" />
										{statusFilter === "all"
											? "Tất cả trạng thái"
											: statusFilterOptions.find((o) => o.value === statusFilter)?.label}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-[210px]">
									<DropdownMenuLabel>Trạng thái bài đăng</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{statusFilterOptions.map((opt) => (
										<DropdownMenuItem
											key={opt.value}
											onClick={() => setStatusFilter(opt.value)}
											className={statusFilter === opt.value ? "bg-muted font-medium" : ""}>
											{opt.label}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							<Button
								size="sm"
								className="h-8 bg-foreground text-background hover:bg-foreground/90"
								onClick={() => navigate("/community/posts/create")}>
								<Plus className="h-4 w-4" />
								Thêm bài đăng
							</Button>
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
											onCheckedChange={(checked) => toggleAll(checked === true)}
										/>
									</TableHead>
									<TableHead className="w-[90px]">
										<Button
											variant="ghost"
											onClick={() => handleSort("id")}
											className="-ml-4 h-8 hover:bg-muted-foreground/10">
											ID {getSortIcon("id")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[160px] text-sm font-medium">Tác giả</TableHead>
									<TableHead className="min-w-[220px] text-sm font-medium">Nội dung</TableHead>
									<TableHead className="min-w-[120px] text-sm font-medium">Tags</TableHead>
									<TableHead className="w-[130px]">
										<Button
											variant="ghost"
											onClick={() => handleSort("status")}
											className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Trạng thái {getSortIcon("status")}
										</Button>
									</TableHead>
									<TableHead className="w-[70px] text-center text-sm font-medium">Ghim</TableHead>
									<TableHead className="w-[160px] text-sm font-medium">Tương tác</TableHead>
									<TableHead className="w-[150px]">
										<Button
											variant="ghost"
											onClick={() => handleSort("created_at")}
											className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Ngày đăng {getSortIcon("created_at")}
										</Button>
									</TableHead>
									<TableHead className="w-[52px]" />
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									Array.from({ length: meta.per_page }).map((_, i) => (
										<TableRow key={`skeleton-${i}`}>
											<TableCell><Skeleton className="h-4 w-4" /></TableCell>
											<TableCell colSpan={9}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : posts.length > 0 ? (
									posts.map((post) => (
										<TableRow key={post.id}>
											<TableCell>
												<Checkbox
													aria-label={`Chọn bài ${post.id}`}
													checked={isSelected(post.id)}
													onCheckedChange={(c) => toggleOne(post.id, c === true)}
												/>
											</TableCell>

											<TableCell className="font-medium text-muted-foreground">
												POST-{post.id}
											</TableCell>

											{/* Author */}
											<TableCell>
												<div className="flex items-center gap-2.5">
													<Avatar className="h-7 w-7">
														<AvatarImage src={post.user.avatar ?? undefined} />
														<AvatarFallback className="text-xs">
															{getAuthorInitials(post.user)}
														</AvatarFallback>
													</Avatar>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium leading-none">
															{post.user.full_name ?? "Ẩn danh"}
														</p>
														<p className="mt-0.5 truncate text-xs text-muted-foreground">
															{post.user.student_code ?? post.user.email}
														</p>
													</div>
												</div>
											</TableCell>

											{/* Content preview */}
											<TableCell className="max-w-[300px]">
												<div className="space-y-1">
													<p className="truncate text-sm">{truncate(post.content)}</p>
													{post.media.length > 0 && (
														<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
															<Image className="h-3 w-3" />
															{post.media.length} tệp đính kèm
														</span>
													)}
												</div>
											</TableCell>

											{/* Tags */}
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{post.tags.slice(0, 2).map((tag) => (
														<Badge
															key={tag.id}
															variant="outline"
															className="rounded-full px-2 py-0 text-xs"
															style={tag.color ? { borderColor: `${tag.color}40`, color: tag.color } : undefined}>
															{tag.name}
														</Badge>
													))}
													{post.tags.length > 2 && (
														<Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
															+{post.tags.length - 2}
														</Badge>
													)}
												</div>
											</TableCell>

											{/* Status */}
											<TableCell>{getStatusBadge(post.status)}</TableCell>

											{/* Pin */}
											<TableCell className="text-center">
												{post.is_pinned ? (
													<Pin className="mx-auto h-4 w-4 text-amber-500" />
												) : (
													<span className="text-muted-foreground/30">—</span>
												)}
											</TableCell>

											{/* Reactions + Comments */}
											<TableCell>
												<div className="text-sm text-muted-foreground">
													<span>{post.reactions_count} cảm xúc</span>
													<span className="mx-1">·</span>
													<span>{post.comments_count} bình luận</span>
												</div>
											</TableCell>

											{/* Date */}
											<TableCell className="text-sm text-muted-foreground">
												{formatDate(post.created_at)}
											</TableCell>

											{/* Actions */}
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															className="h-8 w-8 p-0 data-[state=open]:bg-muted"
															aria-label={`Hành động bài ${post.id}`}>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[190px]">
														<DropdownMenuItem onClick={() => setSelectedPost(post)}>
															<SquarePen className="h-4 w-4" />
															Xem chi tiết
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => void handleTogglePin(post)}>
															{post.is_pinned ? (
																<><PinOff className="h-4 w-4" />Bỏ ghim</>
															) : (
																<><Pin className="h-4 w-4" />Ghim bài</>
															)}
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => void handleToggleStatus(post)}>
															{post.status === "published" ? (
																<><EyeOff className="h-4 w-4" />Ẩn bài</>
															) : (
																<><Eye className="h-4 w-4" />Hiện bài</>
															)}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(post)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa bài đăng
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
											Không tìm thấy bài đăng nào phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={10}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {posts.length} trên tổng {meta.total} bài đăng.
											</p>
											<div className="flex items-center space-x-6 lg:space-x-8">
												<div className="flex items-center space-x-2">
													<p className="text-sm font-medium">Rows per page</p>
													<Select
														value={`${meta.per_page}`}
														onValueChange={(v) =>
															setMeta((prev) => ({ ...prev, per_page: Number(v), current_page: 1 }))
														}>
														<SelectTrigger className="h-8 w-[70px]">
															<SelectValue placeholder={meta.per_page} />
														</SelectTrigger>
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

			{/* ── Detail Dialog ── */}
			<Dialog open={Boolean(selectedPost)} onOpenChange={(open) => !open && setSelectedPost(null)}>
				<DialogContent className="sm:max-w-[680px]">
					{selectedPost && (
						<>
							<DialogHeader>
								<DialogTitle>Chi tiết bài đăng POST-{selectedPost.id}</DialogTitle>
							</DialogHeader>

							<div className="space-y-4">
								{/* Author info */}
								<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
									<Avatar className="h-9 w-9">
										<AvatarImage src={selectedPost.user.avatar ?? undefined} />
										<AvatarFallback>{getAuthorInitials(selectedPost.user)}</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">
											{selectedPost.user.full_name ?? "Ẩn danh"}
										</p>
										<p className="text-xs text-muted-foreground">
											{selectedPost.user.email}
											{selectedPost.user.student_code && ` · ${selectedPost.user.student_code}`}
										</p>
									</div>
									<div className="ml-auto flex items-center gap-2">
										{getStatusBadge(selectedPost.status)}
										<Badge variant="outline" className="rounded-full px-2 py-0 text-xs">
											{getVisibilityLabel(selectedPost.visibility)}
										</Badge>
									</div>
								</div>

								{/* Content */}
								<div className="space-y-1.5">
									<p className="text-sm font-medium">Nội dung</p>
									<div className="max-h-[240px] overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-7 whitespace-pre-wrap">
										{selectedPost.content}
									</div>
								</div>

								{/* Tags + Stats */}
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-1.5">
										<p className="text-sm font-medium">Tags</p>
										<div className="flex flex-wrap gap-1.5">
											{selectedPost.tags.length > 0 ? selectedPost.tags.map((tag) => (
												<Badge key={tag.id} variant="outline" className="rounded-full text-xs"
													style={tag.color ? { borderColor: `${tag.color}40`, color: tag.color } : undefined}>
													{tag.name}
												</Badge>
											)) : (
												<span className="text-sm text-muted-foreground">Không có tag</span>
											)}
										</div>
									</div>
									<div className="space-y-1.5">
										<p className="text-sm font-medium">Thống kê</p>
										<div className="space-y-1 text-sm text-muted-foreground">
											<p>{selectedPost.reactions_count} lượt cảm xúc</p>
											<p>{selectedPost.comments_count} bình luận</p>
											<p>{selectedPost.media.length} tệp đính kèm</p>
										</div>
									</div>
								</div>

								{/* Dates */}
								<div className="grid gap-4 sm:grid-cols-2 text-sm">
									<div className="space-y-0.5">
										<p className="font-medium">Ngày đăng</p>
										<p className="text-muted-foreground">{formatDate(selectedPost.created_at)}</p>
									</div>
									<div className="space-y-0.5">
										<p className="font-medium">Cập nhật lần cuối</p>
										<p className="text-muted-foreground">{formatDate(selectedPost.updated_at)}</p>
									</div>
								</div>
							</div>

							<DialogFooter className="gap-2">
								<Button variant="outline" onClick={() => setSelectedPost(null)}>
									Đóng
								</Button>
								<Button
									variant={selectedPost.status === "published" ? "secondary" : "default"}
									onClick={() => { void handleToggleStatus(selectedPost); setSelectedPost(null); }}>
									{selectedPost.status === "published" ? (
										<><EyeOff className="h-4 w-4" />Ẩn bài</>
									) : (
										<><Eye className="h-4 w-4" />Hiện bài</>
									)}
								</Button>
								<Button
									variant="destructive"
									onClick={() => { setSelectedPost(null); setDeleteTarget(selectedPost); }}>
									<Trash2 className="h-4 w-4" />
									Xóa bài
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>

			{/* ── Delete confirm Dialog ── */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{deleteTarget && (
						<>
							<DialogHeader>
								<DialogTitle>Xác nhận xóa bài đăng</DialogTitle>
							</DialogHeader>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>
									Bạn sắp xóa bài đăng{" "}
									<span className="font-semibold text-foreground">POST-{deleteTarget.id}</span>{" "}
									của{" "}
									<span className="font-semibold text-foreground">
										{deleteTarget.user.full_name ?? deleteTarget.user.email}
									</span>.
								</p>
								<p>Hành động này không thể hoàn tác. Toàn bộ bình luận và cảm xúc liên quan cũng sẽ bị xóa.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
									Hủy
								</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa bài đăng"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default PostListPage;
