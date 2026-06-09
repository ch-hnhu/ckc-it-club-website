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
	RotateCcw,
	SquarePen,
	Trash2,
} from "lucide-react";
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
import { CompactBadgeList } from "@/components/ui/compact-badge-list";
import { cn } from "@/lib/utils";
import { renderMarkdownContent } from "@/lib/markdown";
import postService from "@/services/post.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PostStatus = "published" | "hidden";
export type PostVisibility = "public" | "members_only";

export interface PostTag {
	id: number;
	name: string;
	color: string | null;
}

export interface PostChannel {
	id: number;
	name: string;
	slug: string;
}

export interface PostAuthor {
	id: number;
	full_name: string | null;
	email: string;
	avatar: string | null;
	student_code: string | null;
}

export interface PostRecord {
	id: number;
	user: PostAuthor;
	channel: PostChannel | null;
	content: string;
	status: PostStatus;
	visibility: PostVisibility;
	comments_count: number;
	reactions_count: number;
	tags: PostTag[];
	media_urls: string[];
	created_at: string;
	updated_at: string;
	deleted_at?: string | null;
}

export interface PostStats {
	total: number;
	published: number;
	hidden: number;
	archived: number;
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

function getVisibilityBadge(v: PostVisibility) {
	return v === "public" ? (
		<Badge
			variant="outline"
			className="rounded-full px-3 py-1 border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10">
			Công khai
		</Badge>
	) : (
		<Badge
			variant="outline"
			className="rounded-full px-3 py-1 border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10">
			Thành viên
		</Badge>
	);
}

type SortKey = "id" | "status" | "created_at" | "reactions_count" | "user_name" | "channel_name" | "content";

const statusFilterOptions: Array<{ value: PostStatus | "all"; label: string }> = [
	{ value: "all", label: "Tất cả trạng thái" },
	{ value: "published", label: "Đang hiển thị" },
	{ value: "hidden", label: "Đã ẩn" },
];

// ─── Mock stats (replace with API call) ──────────────────────────────────────

const emptyStats: PostStats = { total: 0, published: 0, hidden: 0, archived: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

function PostListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý bài đăng" }]);

	const [posts, setPosts] = useState<PostRecord[]>([]);
	const [stats, setStats] = useState<PostStats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
	const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<PostRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isBulkDeleting, setIsBulkDeleting] = useState(false);
	const [showTrash, setShowTrash] = useState(false);
	const [restoringPostId, setRestoringPostId] = useState<number | null>(null);
	const [forceDeleteTarget, setForceDeleteTarget] = useState<PostRecord | null>(null);
	const [isForceDeleting, setIsForceDeleting] = useState(false);
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

	const { allSelected, isSelected, selectedIds, toggleAll, toggleOne } = useTableSelection(
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
	}, [debouncedSearch, showTrash, statusFilter, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		const listRequest = showTrash ? postService.getTrashedPosts : postService.getPosts;

		Promise.all([
			listRequest({
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
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, showTrash, sortConfig, statusFilter]);

	// ── Sorting ──

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

	// ── Actions ──

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

	const handleRestore = async (post: PostRecord) => {
		setRestoringPostId(post.id);
		try {
			await postService.restorePost(post.id);
			setPosts((prev) => prev.filter((p) => p.id !== post.id));
			setReloadToken((prev) => prev + 1);
			toast.success("Đã khôi phục bài đăng.");
		} catch {
			toast.error("Không thể khôi phục bài đăng. Vui lòng thử lại.");
		} finally {
			setRestoringPostId(null);
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

	const handleForceDelete = async () => {
		if (!forceDeleteTarget) return;
		setIsForceDeleting(true);
		try {
			await postService.forceDeletePost(forceDeleteTarget.id);
			setPosts((prev) => prev.filter((p) => p.id !== forceDeleteTarget.id));
			setForceDeleteTarget(null);
			setReloadToken((prev) => prev + 1);
			toast.success("Đã xóa vĩnh viễn bài đăng.");
		} catch {
			toast.error("Không thể xóa vĩnh viễn bài đăng. Vui lòng thử lại.");
		} finally {
			setIsForceDeleting(false);
		}
	};

	const handleBulkDelete = async () => {
		if (selectedIds.length === 0) return;
		if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} bài đăng đã chọn?`)) return;
		setIsBulkDeleting(true);
		try {
			const res = await postService.bulkDeletePosts(selectedIds);
			setPosts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
			toggleAll(false);
			setReloadToken((prev) => prev + 1);
			toast.success(`Đã xóa ${res.data.deleted} bài đăng.`);
		} catch {
			toast.error("Không thể xóa bài đăng. Vui lòng thử lại.");
		} finally {
			setIsBulkDeleting(false);
		}
	};

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* ── Header ── */}
				<div className="space-y-2">
					<h2 className="text-2xl font-semibold tracking-tight">
						Kiểm duyệt và quản lý bài đăng
					</h2>
					<p className="text-muted-foreground">
						Xem toàn bộ bài đăng từ thành viên, kiểm duyệt nội dung và xử lý bài vi phạm.
					</p>
				</div>

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
							label: "Lưu trữ",
							value: stats.archived,
							desc: "Bài đăng đang ở trạng thái lưu trữ.",
							color: "slate",
						},
					].map(({ label, value, desc, color }) => (
						<div
							key={label}
							className={cn(
								"rounded-2xl border p-5 shadow-sm",
								color === "violet" && "border-violet-500/15 bg-violet-500/5",
								color === "emerald" && "border-emerald-500/15 bg-emerald-500/5",
								color === "rose" && "border-rose-500/15 bg-rose-500/5",
								color === "slate" && "border-slate-500/15 bg-slate-500/5",
							)}>
							<p className="text-sm font-semibold text-foreground">{label}</p>
							<p className={cn(
								"mt-1 text-3xl font-semibold tracking-tight",
								color === "violet" && "text-violet-700 dark:text-violet-300",
								color === "emerald" && "text-emerald-700 dark:text-emerald-300",
								color === "rose" && "text-rose-700 dark:text-rose-300",
								color === "slate" && "text-slate-700 dark:text-slate-300",
							)}>
								{value}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">{desc}</p>
						</div>
					))}
				</section>

				{/* ── Filter bar + Table ── */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-row items-center justify-between gap-3">
						<Input
							placeholder="Lọc theo tên tác giả hoặc nội dung bài đăng..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 min-w-0 flex-1 max-w-80"
						/>
						<div className="flex items-center gap-2 shrink-0">
							<Button
								type="button"
								variant={showTrash ? "secondary" : "outline"}
								size="sm"
								className="h-8"
								onClick={() => setShowTrash((current) => !current)}
								aria-label={showTrash ? "Quay lại danh sách bài đăng" : "Xem bài đăng đã xóa"}>
								<Trash2 className="h-4 w-4" />
								Thùng rác
							</Button>
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
										<Button variant="ghost" onClick={() => handleSort("id")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											ID {getSortIcon("id")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[160px]">
										<Button variant="ghost" onClick={() => handleSort("user_name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tác giả {getSortIcon("user_name")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[220px]">
										<Button variant="ghost" onClick={() => handleSort("content")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Nội dung {getSortIcon("content")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("channel_name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Kênh {getSortIcon("channel_name")}
										</Button>
									</TableHead>
									<TableHead className="w-[130px]">
										<Button variant="ghost" onClick={() => handleSort("status")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Trạng thái {getSortIcon("status")}
										</Button>
									</TableHead>
									<TableHead className="w-[160px]">
										<Button variant="ghost" onClick={() => handleSort("reactions_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tương tác {getSortIcon("reactions_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[150px]">
										<Button variant="ghost" onClick={() => handleSort("created_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											{showTrash ? "Ngày xóa" : "Ngày đăng"} {getSortIcon("created_at")}
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
													{post.media_urls.length > 0 && (
														<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
															<Image className="h-3 w-3" />
															{post.media_urls.length} tệp đính kèm
														</span>
													)}
												</div>
											</TableCell>

											{/* Channel */}
											<TableCell>
												<CompactBadgeList
													items={post.channel ? [{ key: post.channel.id, label: post.channel.name }] : []}
													emptyLabel="—"
												/>
											</TableCell>

											{/* Status */}
											<TableCell>{getStatusBadge(post.status)}</TableCell>

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
												{formatDate(showTrash ? post.deleted_at ?? null : post.created_at)}
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
														{showTrash ? (
															<>
																<DropdownMenuItem
																	onClick={() => void handleRestore(post)}
																	disabled={restoringPostId === post.id}>
																	<RotateCcw className="h-4 w-4" />
																	{restoringPostId === post.id ? "Đang khôi phục..." : "Khôi phục"}
																</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	className="text-destructive focus:bg-destructive/10 focus:text-destructive"
																	onClick={() => setForceDeleteTarget(post)}>
																	<Trash2 className="h-4 w-4 text-destructive" />
																	Xóa vĩnh viễn
																</DropdownMenuItem>
															</>
														) : (
															<>
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
															</>
														)}
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
											{showTrash
												? "Không có bài đăng đã xóa nào phù hợp."
												: "Không tìm thấy bài đăng nào phù hợp."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={10}>
										<div className="flex items-center justify-between px-2">
											<div className="flex flex-1 items-center gap-3 text-sm text-muted-foreground">
												Đang hiển thị {posts.length} trên tổng {meta.total} {showTrash ? "bài đã xóa" : "bài đăng"}.
												{selectedIds.length > 0 && (
													<>
														<span className="text-border">|</span>
														<span className="font-medium text-foreground">
															{selectedIds.length} bài được chọn
														</span>
														<Button
															size="sm"
															variant="destructive"
															disabled={isBulkDeleting}
															onClick={() => void handleBulkDelete()}
															className="h-7">
															<Trash2 className="h-3.5 w-3.5" />
															{isBulkDeleting ? "Đang xóa..." : "Xóa đã chọn"}
														</Button>
													</>
												)}
											</div>
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
										{getVisibilityBadge(selectedPost.visibility)}
									</div>
								</div>

								{/* Content */}
								<div className="space-y-1.5">
									<p className="text-sm font-medium">Nội dung</p>
									<div
										className="blog-content-viewer max-h-[240px] overflow-y-auto rounded-md border bg-muted/30 p-4"
										dangerouslySetInnerHTML={{ __html: renderMarkdownContent(selectedPost.content) }}
									/>
								</div>

								{/* Media */}
								{selectedPost.media_urls.length > 0 && (
									<div className="space-y-1.5">
										<p className="text-sm font-medium">Tệp đính kèm ({selectedPost.media_urls.length})</p>
										<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
											{selectedPost.media_urls.map((url, i) =>
												/\.(mp4|webm|ogg)(\?|$)/i.test(url) ? (
													<video
														key={i}
														src={url}
														controls
														className="w-full rounded-md border object-cover"
													/>
												) : (
													<a key={i} href={url} target="_blank" rel="noopener noreferrer">
														<img
															src={url}
															alt={`Ảnh ${i + 1}`}
															className="w-full rounded-md border object-cover aspect-square"
															onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
														/>
													</a>
												)
											)}
										</div>
									</div>
								)}

								{/* Stats */}
								<div className="space-y-1.5">
									<p className="text-sm font-medium">Thống kê</p>
									<div className="space-y-1 text-sm text-muted-foreground">
										<p>{selectedPost.reactions_count} lượt cảm xúc</p>
										<p>{selectedPost.comments_count} bình luận</p>
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
									{showTrash && (
										<div className="space-y-0.5">
											<p className="font-medium">Ngày xóa</p>
											<p className="text-muted-foreground">{formatDate(selectedPost.deleted_at ?? null)}</p>
										</div>
									)}
								</div>
							</div>

							<DialogFooter className="gap-2">
								<Button variant="outline" onClick={() => setSelectedPost(null)}>
									Đóng
								</Button>
								{showTrash ? (
									<>
										<Button
											onClick={() => {
												void handleRestore(selectedPost);
												setSelectedPost(null);
											}}
											disabled={restoringPostId === selectedPost.id}>
											<RotateCcw className="h-4 w-4" />
											{restoringPostId === selectedPost.id ? "Đang khôi phục..." : "Khôi phục"}
										</Button>
										<Button
											variant="destructive"
											onClick={() => { setSelectedPost(null); setForceDeleteTarget(selectedPost); }}>
											<Trash2 className="h-4 w-4" />
											Xóa vĩnh viễn
										</Button>
									</>
								) : (
									<>
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
									</>
								)}
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

			{/* ── Force Delete confirm Dialog ── */}
			<Dialog open={Boolean(forceDeleteTarget)} onOpenChange={(open) => !open && setForceDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{forceDeleteTarget && (
						<>
							<DialogHeader>
								<DialogTitle>Xác nhận xóa vĩnh viễn</DialogTitle>
							</DialogHeader>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>
									Bạn sắp xóa vĩnh viễn bài đăng{" "}
									<span className="font-semibold text-foreground">POST-{forceDeleteTarget.id}</span>{" "}
									của{" "}
									<span className="font-semibold text-foreground">
										{forceDeleteTarget.user.full_name ?? forceDeleteTarget.user.email}
									</span>.
								</p>
								<p className="font-medium text-destructive">
									Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bài đăng sẽ bị xóa vĩnh viễn khỏi hệ thống.
								</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setForceDeleteTarget(null)} disabled={isForceDeleting}>
									Hủy
								</Button>
								<Button variant="destructive" onClick={() => void handleForceDelete()} disabled={isForceDeleting}>
									{isForceDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
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
