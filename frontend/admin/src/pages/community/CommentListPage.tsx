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
	MessageSquare,
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
import commentService from "@/services/comment.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommentableType = "post" | "blog";

export interface CommentAuthor {
	id: number;
	full_name: string | null;
	email: string;
	avatar: string | null;
	student_code: string | null;
}

export interface CommentRecord {
	id: number;
	user: CommentAuthor;
	commentable_type: CommentableType;
	commentable_id: number;
	parent_id: number | null;
	content: string;
	is_hidden: boolean;
	reactions_count: number;
	created_at: string;
	updated_at: string;
}

export interface CommentStats {
	total: number;
	visible: number;
	hidden: number;
	replies: number;
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

function truncate(str: string, max = 80) {
	return str.length <= max ? str : `${str.slice(0, max).trimEnd()}…`;
}

function getAuthorInitials(a: CommentAuthor) {
	return (a.full_name ?? a.email).charAt(0).toUpperCase();
}

type VisibilityFilter = "all" | "visible" | "hidden";
type TypeFilter = "all" | "post" | "blog";
type SortKey = "id" | "created_at";

const emptyStats: CommentStats = { total: 0, visible: 0, hidden: 0, replies: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

function CommentListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý bình luận" }]);

	const [comments, setComments] = useState<CommentRecord[]>([]);
	const [stats, setStats] = useState<CommentStats>(emptyStats);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
	const [selectedComment, setSelectedComment] = useState<CommentRecord | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<CommentRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; order: "asc" | "desc" | null }>({
		key: "created_at",
		order: "desc",
	});

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(comments.map((c) => c.id));

	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(t);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, visibilityFilter, typeFilter, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		Promise.all([
			commentService.getComments({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key ?? undefined,
				order: sortConfig.order ?? undefined,
				visibility: visibilityFilter !== "all" ? visibilityFilter : undefined,
				type: typeFilter !== "all" ? typeFilter : undefined,
			}),
			commentService.getStats(),
		]).then(([commentsRes, statsRes]) => {
			if (cancelled) return;
			setComments(commentsRes.data);
			setMeta((p) => ({
				...p,
				last_page: commentsRes.meta.last_page,
				total: commentsRes.meta.total,
			}));
			setStats(statsRes.data);
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách bình luận.");
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});

		return () => { cancelled = true; };
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, sortConfig, visibilityFilter, typeFilter]);

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

	const handleToggleVisibility = (comment: CommentRecord) => {
		setComments((prev) => prev.map((c) => c.id === comment.id ? { ...c, is_hidden: !c.is_hidden } : c));
		toast.success(comment.is_hidden ? "Đã hiện bình luận." : "Đã ẩn bình luận.");
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await commentService.deleteComment(deleteTarget.id);
			setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa bình luận.");
		} catch {
			toast.error("Không thể xóa bình luận. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const activeFilterCount =
		Number(Boolean(search.trim())) +
		Number(visibilityFilter !== "all") +
		Number(typeFilter !== "all");

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Hero */}
				<section className="overflow-hidden rounded-[30px] border border-orange-500/15 bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(255,251,247,0.96)_44%,rgba(255,253,250,0.98)_100%)] shadow-sm dark:bg-[linear-gradient(135deg,rgba(249,115,22,0.12),rgba(18,12,8,0.96)_45%,rgba(12,8,5,0.98)_100%)]">
					<div className="px-6 py-7 md:px-8 md:py-9">
						<div className="max-w-3xl space-y-4">
							<Badge className="w-fit rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-orange-800 hover:bg-orange-500/10 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-200">
								Kiểm duyệt bình luận
							</Badge>
							<div className="space-y-2">
								<h1 className="text-foreground text-[1.85rem] font-semibold leading-tight md:text-[2.4rem] md:leading-[1.1]">
									Quản lý bình luận cộng đồng
								</h1>
								<p className="text-sm leading-7 text-orange-950/70 md:text-base dark:text-orange-50/65">
									Xem và kiểm duyệt toàn bộ bình luận trên bài đăng và blog. Ẩn hoặc xóa bình luận vi phạm nội quy.
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-3 pt-1">
								<Button
									variant="outline"
									className="h-10 rounded-2xl border-orange-500/20 bg-background/80 px-4 text-orange-800 shadow-sm hover:bg-orange-500/10 dark:bg-background/70 dark:text-orange-200"
									onClick={() => { setSearch(""); setVisibilityFilter("all"); setTypeFilter("all"); }}>
									<RefreshCw className="size-4" />
									Đặt lại bộ lọc
								</Button>
								<div className="inline-flex h-10 items-center gap-2 rounded-2xl border border-orange-500/20 bg-background/72 px-4 text-sm font-medium text-orange-800 dark:text-orange-200">
									<Filter className="size-4" />
									{activeFilterCount} điều kiện đang áp dụng
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Stats */}
				<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{([
						{ label: "Tổng bình luận", value: stats.total, color: "orange", desc: "Tổng số bình luận trên toàn hệ thống." },
						{ label: "Đang hiển thị", value: stats.visible, color: "emerald", desc: "Bình luận công khai, thành viên có thể xem." },
						{ label: "Đã ẩn", value: stats.hidden, color: "rose", desc: "Bình luận bị admin ẩn do vi phạm." },
						{ label: "Trả lời", value: stats.replies, color: "sky", desc: "Số bình luận là reply (có parent)." },
					] as const).map(({ label, value, color, desc }) => (
						<div key={label} className={`rounded-2xl border p-5 shadow-sm ${
							color === "orange" ? "border-orange-500/15 bg-orange-500/5" :
							color === "emerald" ? "border-emerald-500/15 bg-emerald-500/5" :
							color === "rose" ? "border-rose-500/15 bg-rose-500/5" :
							"border-sky-500/15 bg-sky-500/5"
						}`}>
							<p className="text-sm font-semibold text-foreground">{label}</p>
							<p className={`mt-1 text-3xl font-semibold tracking-tight ${
								color === "orange" ? "text-orange-700 dark:text-orange-300" :
								color === "emerald" ? "text-emerald-700 dark:text-emerald-300" :
								color === "rose" ? "text-rose-700 dark:text-rose-300" :
								"text-sky-700 dark:text-sky-300"
							}`}>{value}</p>
							<p className="mt-1 text-xs text-muted-foreground">{desc}</p>
						</div>
					))}
				</section>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<Input
							placeholder="Lọc theo tên tác giả hoặc nội dung..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 w-full sm:w-64 md:w-80"
						/>
						<div className="flex items-center gap-2">
							{/* Filter trạng thái */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8">
										<Filter className="h-4 w-4" />
										{visibilityFilter === "all" ? "Tất cả" : visibilityFilter === "visible" ? "Đang hiển thị" : "Đã ẩn"}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-[180px]">
									<DropdownMenuLabel>Trạng thái hiển thị</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{(["all", "visible", "hidden"] as VisibilityFilter[]).map((v) => (
										<DropdownMenuItem key={v} onClick={() => setVisibilityFilter(v)}
											className={visibilityFilter === v ? "bg-muted font-medium" : ""}>
											{v === "all" ? "Tất cả" : v === "visible" ? "Đang hiển thị" : "Đã ẩn"}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Filter loại */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-8">
										<MessageSquare className="h-4 w-4" />
										{typeFilter === "all" ? "Tất cả loại" : typeFilter === "post" ? "Bài đăng" : "Blog"}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-[160px]">
									<DropdownMenuLabel>Thuộc về</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{(["all", "post", "blog"] as TypeFilter[]).map((v) => (
										<DropdownMenuItem key={v} onClick={() => setTypeFilter(v)}
											className={typeFilter === v ? "bg-muted font-medium" : ""}>
											{v === "all" ? "Tất cả loại" : v === "post" ? "Bài đăng" : "Blog"}
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
										<Checkbox aria-label="Chọn tất cả" checked={allSelected}
											onCheckedChange={(c) => toggleAll(c === true)} />
									</TableHead>
									<TableHead className="w-[90px]">
										<Button variant="ghost" onClick={() => handleSort("id")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											ID {getSortIcon("id")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[160px] text-sm font-medium">Tác giả</TableHead>
									<TableHead className="min-w-[260px] text-sm font-medium">Nội dung</TableHead>
									<TableHead className="w-[130px] text-sm font-medium">Thuộc về</TableHead>
									<TableHead className="w-[120px] text-sm font-medium">Trạng thái</TableHead>
									<TableHead className="w-[100px] text-sm font-medium">Tương tác</TableHead>
									<TableHead className="w-[150px]">
										<Button variant="ghost" onClick={() => handleSort("created_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Ngày đăng {getSortIcon("created_at")}
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
								) : comments.length > 0 ? (
									comments.map((comment) => (
										<TableRow key={comment.id}>
											<TableCell>
												<Checkbox checked={isSelected(comment.id)}
													onCheckedChange={(c) => toggleOne(comment.id, c === true)} />
											</TableCell>
											<TableCell className="font-medium text-muted-foreground">
												CMT-{comment.id}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2.5">
													<Avatar className="h-7 w-7">
														<AvatarImage src={comment.user.avatar ?? undefined} />
														<AvatarFallback className="text-xs">{getAuthorInitials(comment.user)}</AvatarFallback>
													</Avatar>
													<div className="min-w-0">
														<p className="truncate text-sm font-medium leading-none">{comment.user.full_name ?? "Ẩn danh"}</p>
														<p className="mt-0.5 truncate text-xs text-muted-foreground">
															{comment.user.student_code ?? comment.user.email}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="space-y-1">
													<p className="text-sm">{truncate(comment.content)}</p>
													{comment.parent_id && (
														<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
															<MessageSquare className="h-3 w-3" />
															Reply #{comment.parent_id}
														</span>
													)}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant="outline" className={`rounded-full px-2 py-0 text-xs ${
													comment.commentable_type === "post"
														? "border-violet-500/20 bg-violet-500/10 text-violet-700"
														: "border-sky-500/20 bg-sky-500/10 text-sky-700"
												}`}>
													{comment.commentable_type === "post" ? "Bài đăng" : "Blog"} #{comment.commentable_id}
												</Badge>
											</TableCell>
											<TableCell>
												{comment.is_hidden ? (
													<Badge variant="outline" className="rounded-full px-3 py-1 border-rose-500/20 bg-rose-500/10 text-rose-700">
														Đã ẩn
													</Badge>
												) : (
													<Badge variant="outline" className="rounded-full px-3 py-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700">
														Hiển thị
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{comment.reactions_count} cảm xúc
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[190px]">
														<DropdownMenuItem onClick={() => setSelectedComment(comment)}>
															<Eye className="h-4 w-4" />
															Xem chi tiết
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => void handleToggleVisibility(comment)}>
															{comment.is_hidden
																? <><Eye className="h-4 w-4" />Hiện bình luận</>
																: <><EyeOff className="h-4 w-4" />Ẩn bình luận</>}
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(comment)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa bình luận
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
											Không tìm thấy bình luận nào phù hợp.
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={9}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {comments.length} trên tổng {meta.total} bình luận.
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
			<Dialog open={Boolean(selectedComment)} onOpenChange={(o) => !o && setSelectedComment(null)}>
				<DialogContent className="sm:max-w-[560px]">
					{selectedComment && (
						<>
							<DialogHeader>
								<DialogTitle>Chi tiết bình luận CMT-{selectedComment.id}</DialogTitle>
							</DialogHeader>
							<div className="space-y-4">
								<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
									<Avatar className="h-9 w-9">
										<AvatarImage src={selectedComment.user.avatar ?? undefined} />
										<AvatarFallback>{getAuthorInitials(selectedComment.user)}</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">{selectedComment.user.full_name ?? "Ẩn danh"}</p>
										<p className="text-xs text-muted-foreground">{selectedComment.user.email}</p>
									</div>
									<div className="ml-auto flex items-center gap-2">
										<Badge variant="outline" className={`rounded-full px-2 py-0 text-xs ${
											selectedComment.commentable_type === "post"
												? "border-violet-500/20 bg-violet-500/10 text-violet-700"
												: "border-sky-500/20 bg-sky-500/10 text-sky-700"
										}`}>
											{selectedComment.commentable_type === "post" ? "Bài đăng" : "Blog"} #{selectedComment.commentable_id}
										</Badge>
									</div>
								</div>
								{selectedComment.parent_id && (
									<div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
										<span className="font-medium">Reply cho:</span> Bình luận #{selectedComment.parent_id}
									</div>
								)}
								<div className="space-y-1.5">
									<p className="text-sm font-medium">Nội dung</p>
									<div className="max-h-[200px] overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm leading-7 whitespace-pre-wrap">
										{selectedComment.content}
									</div>
								</div>
								<div className="grid gap-4 sm:grid-cols-3 text-sm">
									<div className="space-y-0.5">
										<p className="font-medium">Trạng thái</p>
										<p className={selectedComment.is_hidden ? "text-rose-600" : "text-emerald-600"}>
											{selectedComment.is_hidden ? "Đã ẩn" : "Đang hiển thị"}
										</p>
									</div>
									<div className="space-y-0.5">
										<p className="font-medium">Cảm xúc</p>
										<p className="text-muted-foreground">{selectedComment.reactions_count}</p>
									</div>
									<div className="space-y-0.5">
										<p className="font-medium">Ngày đăng</p>
										<p className="text-muted-foreground">{formatDate(selectedComment.created_at)}</p>
									</div>
								</div>
							</div>
							<DialogFooter className="gap-2">
								<Button variant="outline" onClick={() => setSelectedComment(null)}>Đóng</Button>
								<Button
									variant={selectedComment.is_hidden ? "default" : "secondary"}
									onClick={() => { void handleToggleVisibility(selectedComment); setSelectedComment(null); }}>
									{selectedComment.is_hidden
										? <><Eye className="h-4 w-4" />Hiện bình luận</>
										: <><EyeOff className="h-4 w-4" />Ẩn bình luận</>}
								</Button>
								<Button variant="destructive" onClick={() => { setSelectedComment(null); setDeleteTarget(selectedComment); }}>
									<Trash2 className="h-4 w-4" />Xóa
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
							<DialogHeader><DialogTitle>Xác nhận xóa bình luận</DialogTitle></DialogHeader>
							<div className="space-y-2 text-sm text-muted-foreground">
								<p>Bạn sắp xóa bình luận của <span className="font-semibold text-foreground">{deleteTarget.user.full_name ?? deleteTarget.user.email}</span>.</p>
								<p className="rounded-md border bg-muted/30 p-3 italic">"{truncate(deleteTarget.content, 120)}"</p>
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa bình luận"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default CommentListPage;
