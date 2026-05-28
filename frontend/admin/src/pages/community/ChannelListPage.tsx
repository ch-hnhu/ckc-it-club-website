import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Hash,
	MoreHorizontal,
	Pencil,
	Plus,
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
import { useTableSelection } from "@/hooks/useTableSelection";
import channelService from "@/services/channel.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChannelRecord {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	image: string | null;
	posts_count: number;
	created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

function toSlug(str: string) {
	return str
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

type SortKey = "id" | "name" | "slug" | "description" | "posts_count" | "created_at";

// ─── Form state ──────────────────────────────────────────────────────────────

interface ChannelFormState {
	name: string;
	slug: string;
	description: string;
	image: string;
}

const emptyForm: ChannelFormState = { name: "", slug: "", description: "", image: "" };

// ─── Component ───────────────────────────────────────────────────────────────

function ChannelListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý kênh" }]);

	const [channels, setChannels] = useState<ChannelRecord[]>([]);
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
	const [editTarget, setEditTarget] = useState<ChannelRecord | null>(null);
	const [form, setForm] = useState<ChannelFormState>(emptyForm);
	const [slugEdited, setSlugEdited] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<ChannelRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(channels.map((c) => c.id));

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

		channelService.getChannels({
			page: meta.current_page,
			per_page: meta.per_page,
			search: debouncedSearch || undefined,
			sort: sortConfig.key ?? undefined,
			order: sortConfig.order ?? undefined,
		}).then((res) => {
			if (cancelled) return;
			setChannels(res.data);
			setMeta((p) => ({
				...p,
				last_page: res.meta.last_page,
				total: res.meta.total,
			}));
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách kênh.");
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
		setSlugEdited(false);
		setFormOpen(true);
	};

	const openEdit = (channel: ChannelRecord) => {
		setEditTarget(channel);
		setForm({ name: channel.name, slug: channel.slug, description: channel.description ?? "", image: channel.image ?? "" });
		setSlugEdited(true);
		setFormOpen(true);
	};

	const handleNameChange = (value: string) => {
		setForm((p) => ({
			...p,
			name: value,
			slug: slugEdited ? p.slug : toSlug(value),
		}));
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error("Tên kênh không được để trống.");
			return;
		}
		setIsSaving(true);
		try {
			if (editTarget) {
				const res = await channelService.updateChannel(editTarget.id, {
					name: form.name,
					slug: form.slug || toSlug(form.name),
					description: form.description || null,
					image: form.image || null,
				});
				setChannels((prev) => prev.map((c) =>
					c.id === editTarget.id ? { ...c, ...res.data } : c
				));
				toast.success("Đã cập nhật kênh.");
			} else {
				const res = await channelService.createChannel({
					name: form.name,
					slug: form.slug || toSlug(form.name),
					description: form.description || null,
					image: form.image || null,
				});
				setChannels((prev) => [res.data, ...prev]);
				toast.success("Đã tạo kênh mới.");
			}
			setFormOpen(false);
			setReloadToken((p) => p + 1);
		} catch {
			toast.error("Không thể lưu kênh. Vui lòng thử lại.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await channelService.deleteChannel(deleteTarget.id);
			setChannels((prev) => prev.filter((c) => c.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa kênh.");
		} catch {
			toast.error("Không thể xóa kênh. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const totalPosts = channels.reduce((s, c) => s + c.posts_count, 0);

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Header */}
				<div className="space-y-1">
					<h2 className="text-2xl font-semibold tracking-tight">Quản lý kênh</h2>
					<p className="text-muted-foreground text-sm">
						Tạo và quản lý các kênh thảo luận trong cộng đồng CLB.
					</p>
				</div>

				{/* Stats */}
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Tổng kênh</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-indigo-700 dark:text-indigo-300">{meta.total}</p>
						<p className="mt-1 text-xs text-muted-foreground">Số kênh thảo luận đang hoạt động.</p>
					</div>
					<div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Tổng bài đăng</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-violet-700 dark:text-violet-300">{totalPosts}</p>
						<p className="mt-1 text-xs text-muted-foreground">Tổng số bài đăng thuộc tất cả các kênh.</p>
					</div>
				</div>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<Input
							placeholder="Tìm kiếm theo tên kênh hoặc slug..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 w-full sm:w-64 md:w-80"
						/>
						<Button size="sm" onClick={openCreate} className="h-8 shrink-0 bg-foreground text-background hover:bg-foreground/90">
							<Plus className="h-4 w-4" />
							Thêm kênh
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
									<TableHead className="min-w-[200px]">
										<Button variant="ghost" onClick={() => handleSort("name")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Tên kênh {getSortIcon("name")}
										</Button>
									</TableHead>
									<TableHead className="w-[200px]">
										<Button variant="ghost" onClick={() => handleSort("slug")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Slug {getSortIcon("slug")}
										</Button>
									</TableHead>
									<TableHead className="min-w-[200px]">
										<Button variant="ghost" onClick={() => handleSort("description")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Mô tả {getSortIcon("description")}
										</Button>
									</TableHead>
									<TableHead className="w-[120px]">
										<Button variant="ghost" onClick={() => handleSort("posts_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
											Bài đăng {getSortIcon("posts_count")}
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
											<TableCell colSpan={8}><Skeleton className="h-4 w-full" /></TableCell>
										</TableRow>
									))
								) : channels.length > 0 ? (
									channels.map((channel) => (
										<TableRow key={channel.id}>
											<TableCell>
												<Checkbox checked={isSelected(channel.id)}
													onCheckedChange={(c) => toggleOne(channel.id, c === true)} />
											</TableCell>
											<TableCell className="font-medium text-muted-foreground">#{channel.id}</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-8 w-8">
														<AvatarImage src={channel.image ?? undefined} alt={channel.name} />
														<AvatarFallback className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
															<Hash className="h-3.5 w-3.5" />
														</AvatarFallback>
													</Avatar>
													<span className="font-medium">{channel.name}</span>
												</div>
											</TableCell>
											<TableCell className="font-mono text-sm text-muted-foreground">{channel.slug}</TableCell>
											<TableCell>
												{channel.description ? (
													<span className="line-clamp-2 text-sm text-muted-foreground">{channel.description}</span>
												) : (
													<span className="text-xs text-muted-foreground/50 italic">Chưa có mô tả</span>
												)}
											</TableCell>
											<TableCell>
												<Badge variant="secondary" className="rounded-full">
													{channel.posts_count}
												</Badge>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">{formatDate(channel.created_at)}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-[160px]">
														<DropdownMenuItem onClick={() => openEdit(channel)}>
															<Pencil className="h-4 w-4" />
															Sửa kênh
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:bg-destructive/10 focus:text-destructive"
															onClick={() => setDeleteTarget(channel)}>
															<Trash2 className="h-4 w-4 text-destructive" />
															Xóa kênh
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
											Không tìm thấy kênh nào. Hãy thêm kênh đầu tiên!
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className="bg-transparent">
								<TableRow>
									<TableCell colSpan={8}>
										<div className="flex items-center justify-between px-2">
											<p className="flex-1 text-sm text-muted-foreground">
												Đang hiển thị {channels.length} trên tổng {meta.total} kênh.
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
				<DialogContent className="sm:max-w-[480px]">
					<DialogHeader>
						<DialogTitle>{editTarget ? "Sửa kênh" : "Thêm kênh mới"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="channel-name">Tên kênh <span className="text-destructive">*</span></Label>
							<Input
								id="channel-name"
								placeholder="Ví dụ: Học thuật & Kỹ thuật"
								value={form.name}
								onChange={(e) => handleNameChange(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="channel-slug">Slug</Label>
							<Input
								id="channel-slug"
								placeholder="hoc-thuat-ky-thuat"
								value={form.slug}
								onChange={(e) => { setSlugEdited(true); setForm((p) => ({ ...p, slug: e.target.value })); }}
								className="font-mono text-sm"
							/>
							<p className="text-xs text-muted-foreground">Tự động tạo từ tên. Có thể chỉnh sửa thủ công.</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="channel-description">Mô tả</Label>
							<Textarea
								id="channel-description"
								placeholder="Mô tả ngắn về mục đích của kênh..."
								value={form.description}
								onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
								rows={3}
								className="resize-none"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="channel-image">Ảnh đại diện (URL)</Label>
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10 shrink-0">
									<AvatarImage src={form.image || undefined} alt="preview" />
									<AvatarFallback className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
										<Hash className="h-4 w-4" />
									</AvatarFallback>
								</Avatar>
								<Input
									id="channel-image"
									placeholder="https://example.com/image.png"
									value={form.image}
									onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
								/>
							</div>
							<p className="text-xs text-muted-foreground">Nhập URL ảnh. Để trống nếu không có.</p>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>Hủy</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Đang lưu..." : editTarget ? "Lưu thay đổi" : "Tạo kênh"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{deleteTarget && (
						<>
							<DialogHeader><DialogTitle>Xác nhận xóa kênh</DialogTitle></DialogHeader>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>Bạn sắp xóa kênh <span className="font-semibold text-foreground">"{deleteTarget.name}"</span>.</p>
								{deleteTarget.posts_count > 0 && (
									<p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-700">
										Kênh này hiện có <strong>{deleteTarget.posts_count}</strong> bài đăng.
										Xóa kênh sẽ ảnh hưởng đến các bài đăng liên quan.
									</p>
								)}
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa kênh"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default ChannelListPage;
