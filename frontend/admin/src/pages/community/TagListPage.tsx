import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	Pencil,
	Plus,
	Tag,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import tagService from "@/services/tag.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TagRecord {
	id: number;
	name: string;
	slug: string;
	color: string | null;
	posts_count: number;
	blogs_count: number;
	created_at: string;
}

// ─── Preset colors ───────────────────────────────────────────────────────────

const PRESET_COLORS = [
	"#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
	"#f97316", "#eab308", "#22c55e", "#14b8a6",
	"#3b82f6", "#06b6d4", "#64748b", "#a855f7",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}


type SortKey = "id" | "name" | "blogs_count" | "created_at";

// ─── Form state ──────────────────────────────────────────────────────────────

interface TagFormState {
	name: string;
	color: string;
}

const emptyForm: TagFormState = { name: "", color: "#6366f1" };

// ─── Component ───────────────────────────────────────────────────────────────

function TagListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý tags" }]);

	const [tags, setTags] = useState<TagRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; order: "asc" | "desc" | null }>({
		key: "created_at", order: "desc",
	});

	// Form / dialog state
	const [formOpen, setFormOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<TagRecord | null>(null);
	const [form, setForm] = useState<TagFormState>(emptyForm);
	const [isSaving, setIsSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<TagRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(tags.map((t) => t.id));

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		tagService.getTags({
			page: meta.current_page,
			per_page: meta.per_page,
			search: debouncedSearch || undefined,
			sort: sortConfig.key ?? undefined,
			order: sortConfig.order ?? undefined,
		}).then((res) => {
			if (cancelled) return;
			setTags(res.data);
			setMeta((p) => ({
				...p,
				last_page: res.meta.last_page,
				total: res.meta.total,
			}));
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách tags.");
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});

		return () => { cancelled = true; };
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, sortConfig]);

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

	// ── Form handlers ──

	const openCreate = () => {
		setEditTarget(null);
		setForm(emptyForm);
		setFormOpen(true);
	};

	const openEdit = (tag: TagRecord) => {
		setEditTarget(tag);
		setForm({ name: tag.name, color: tag.color ?? "#6366f1" });
		setFormOpen(true);
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error("Tên tag không được để trống.");
			return;
		}
		setIsSaving(true);
		try {
			if (editTarget) {
				const res = await tagService.updateTag(editTarget.id, {
					name: form.name,
				});
				setTags((prev) => prev.map((t) =>
					t.id === editTarget.id ? { ...t, ...res.data } : t
				));
				toast.success("Đã cập nhật tag.");
			} else {
				const res = await tagService.createTag({
					name: form.name,
				});
				setTags((prev) => [{ ...res.data, color: form.color }, ...prev]);
				toast.success("Đã tạo tag mới.");
			}
			setFormOpen(false);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể lưu tag. Vui lòng thử lại.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await tagService.deleteTag(deleteTarget.id);
			setTags((prev) => prev.filter((t) => t.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa tag.");
		} catch {
			toast.error("Không thể xóa tag. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const totalUsage = tags.reduce((s, t) => s + t.blogs_count, 0);
	const unusedCount = tags.filter((t) => t.blogs_count === 0).length;

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Header */}
				<div className="space-y-1">
					<h2 className="text-2xl font-semibold tracking-tight">Quản lý Tags</h2>
					<p className="text-muted-foreground text-sm">
						Tạo và quản lý tags dùng chung cho bài đăng và blog của cộng đồng.
					</p>
				</div>

				{/* Stats */}
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="rounded-2xl border border-teal-500/15 bg-teal-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Tổng tags</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-teal-700 dark:text-teal-300">{meta.total}</p>
						<p className="mt-1 text-xs text-muted-foreground">Tags đang tồn tại trong hệ thống.</p>
					</div>
					<div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Lượt sử dụng</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-violet-700 dark:text-violet-300">{totalUsage}</p>
						<p className="mt-1 text-xs text-muted-foreground">Tổng số lần được gán trên blog.</p>
					</div>
					<div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Chưa dùng</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-amber-700 dark:text-amber-300">{unusedCount}</p>
						<p className="mt-1 text-xs text-muted-foreground">Tags chưa được gán vào bài nào.</p>
					</div>
				</div>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<Input
							placeholder="Tìm kiếm theo tên tag..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 w-full sm:w-64 md:w-80"
						/>
						<Button size="sm" onClick={openCreate} className="h-8 shrink-0 bg-foreground text-background hover:bg-foreground/90">
							<Plus className="h-4 w-4" />
							Thêm tag
						</Button>
					</div>

					<div className="overflow-hidden rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[44px]">
										<Checkbox aria-label="Chọn tất cả" checked={allSelected}
											onCheckedChange={(c) => toggleAll(c === true)} />
									</TableHead>
									<TableHead className="w-[80px]">
										<Button variant="ghost" onClick={() => handleSort("id")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											ID {getSortIcon("id")}
										</Button>
									</TableHead>
									<TableHead>
										<Button variant="ghost" onClick={() => handleSort("name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tên tag {getSortIcon("name")}
										</Button>
									</TableHead>
									<TableHead className="w-[180px] text-sm font-medium">Slug</TableHead>
									<TableHead className="w-[100px]">
										<Button variant="ghost" onClick={() => handleSort("blogs_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Blog {getSortIcon("blogs_count")}
										</Button>
									</TableHead>
									<TableHead className="w-[140px]">
										<Button variant="ghost" onClick={() => handleSort("created_at")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Ngày tạo {getSortIcon("created_at")}
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
											<TableCell colSpan={7}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : tags.length > 0 ? (
									tags.map((tag) => (
										<TableRow key={tag.id}>
											<TableCell>
												<Checkbox checked={isSelected(tag.id)}
													onCheckedChange={(c) => toggleOne(tag.id, c === true)} />
											</TableCell>
											<TableCell className="font-medium text-muted-foreground">#{tag.id}</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className="rounded-full border-transparent px-3 py-0.5 text-sm font-medium text-black dark:text-black"
													style={{
														backgroundColor: tag.color ?? "#64748b",
													}}>
													<Tag className="mr-1.5 h-3 w-3" />
													{tag.name}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground font-mono">{tag.slug}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{tag.blogs_count}</TableCell>
											<TableCell className="text-sm text-muted-foreground">{formatDate(tag.created_at)}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[160px]">
														<DropdownMenuItem onClick={() => openEdit(tag)}>
															<Pencil className="h-4 w-4" />
															Sửa tag
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(tag)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa tag
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
											Không tìm thấy tag nào. Hãy thêm tag đầu tiên!
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={8}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {tags.length} trên tổng {meta.total} tags.
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

			{/* Create / Edit dialog */}
			<Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
				<DialogContent className="sm:max-w-[460px]">
					<DialogHeader>
						<DialogTitle>{editTarget ? "Sửa tag" : "Thêm tag mới"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="tag-name">Tên tag <span className="text-destructive">*</span></Label>
							<Input
								id="tag-name"
								placeholder="Ví dụ: Lập trình web"
								value={form.name}
								onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							/>
						</div>
						<div className="space-y-2">
							<Label>Màu sắc</Label>
							<div className="flex flex-wrap gap-2">
								{PRESET_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										onClick={() => setForm((p) => ({ ...p, color }))}
										className={`h-7 w-7 rounded-full ring-offset-background transition-all hover:scale-110 ${
											form.color === color ? "ring-2 ring-ring ring-offset-2" : ""
										}`}
										style={{ backgroundColor: color }}
										aria-label={color}
									/>
								))}
							</div>
							<div className="flex items-center gap-3 pt-1">
								<span
									className="h-8 w-8 shrink-0 rounded-full ring-1 ring-black/10"
									style={{ backgroundColor: form.color }}
								/>
								<Input
									type="color"
									value={form.color}
									onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
									className="h-8 w-20 cursor-pointer px-1 py-0.5"
								/>
								<Badge
									variant="outline"
									className="rounded-full px-3"
									style={{ borderColor: `${form.color}50`, color: form.color }}>
									{form.name || "Xem trước"}
								</Badge>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>Hủy</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Đang lưu..." : editTarget ? "Lưu thay đổi" : "Tạo tag"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{deleteTarget && (
						<>
							<DialogHeader><DialogTitle>Xác nhận xóa tag</DialogTitle></DialogHeader>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>Bạn sắp xóa tag:</p>
								<div className="flex items-center gap-2">
									<span className="h-3 w-3 rounded-full" style={{ backgroundColor: deleteTarget.color ?? "#64748b" }} />
									<Badge variant="outline" className="rounded-full"
										style={deleteTarget.color ? { borderColor: `${deleteTarget.color}50`, color: deleteTarget.color } : undefined}>
										{deleteTarget.name}
									</Badge>
								</div>
								{deleteTarget.blogs_count > 0 && (
									<p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-700">
										Tag này đang được dùng trong {deleteTarget.blogs_count} blog.
										Xóa tag sẽ gỡ nó khỏi tất cả nội dung liên quan.
									</p>
								)}
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa tag"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default TagListPage;
