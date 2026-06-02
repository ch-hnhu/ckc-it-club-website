import { useEffect, useState } from "react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
	arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	GripVertical,
	MoreHorizontal,
	Pencil,
	Plus,
	Sparkles,
	ToggleLeft,
	ToggleRight,
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
import skillService from "@/services/skill.service";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SkillRecord {
	id: number;
	name: string;
	slug: string;
	is_active: boolean;
	sort_order: number;
	users_count: number;
	created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

type SortKey = "id" | "name" | "sort_order" | "users_count" | "created_at";

// ─── Form state ──────────────────────────────────────────────────────────────

interface SkillFormState {
	name: string;
	sort_order: number;
	is_active: boolean;
}

const emptyForm: SkillFormState = { name: "", sort_order: 0, is_active: true };

// ─── Sortable row ─────────────────────────────────────────────────────────────

interface SortableRowProps {
	skill: SkillRecord;
	selected: boolean;
	onToggleSelect: (checked: boolean) => void;
	onEdit: () => void;
	onToggleStatus: () => void;
	onDelete: () => void;
	isTogglingStatus: boolean;
}

function SortableSkillRow({
	skill,
	selected,
	onToggleSelect,
	onEdit,
	onToggleStatus,
	onDelete,
	isTogglingStatus,
}: SortableRowProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: skill.id });

	return (
		<TableRow
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={isDragging ? "opacity-50 bg-muted/30 shadow-md z-10 relative" : undefined}
		>
			<TableCell className="w-[36px] px-2">
				<button
					{...attributes}
					{...listeners}
					tabIndex={-1}
					aria-label="Kéo để sắp xếp"
					className="flex cursor-grab items-center justify-center rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
				>
					<GripVertical className="h-4 w-4" />
				</button>
			</TableCell>
			<TableCell>
				<Checkbox
					checked={selected}
					onCheckedChange={(c) => onToggleSelect(c === true)}
				/>
			</TableCell>
			<TableCell className="font-medium text-muted-foreground">#{skill.id}</TableCell>
			<TableCell>
				<span className="font-medium">{skill.name}</span>
			</TableCell>
			<TableCell className="font-mono text-sm text-muted-foreground">{skill.slug}</TableCell>
			<TableCell className="text-sm text-muted-foreground">{skill.sort_order}</TableCell>
			<TableCell className="text-sm text-muted-foreground">{skill.users_count}</TableCell>
			<TableCell>
				<Badge
					variant="outline"
					className={
						skill.is_active
							? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
							: "border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400"
					}
				>
					{skill.is_active ? "Hoạt động" : "Đã tắt"}
				</Badge>
			</TableCell>
			<TableCell className="text-sm text-muted-foreground">{formatDate(skill.created_at)}</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0 data-[state=open]:bg-muted">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-[180px]">
						<DropdownMenuItem onClick={onEdit}>
							<Pencil className="h-4 w-4" />
							Sửa skill
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onToggleStatus} disabled={isTogglingStatus}>
							{skill.is_active
								? <><ToggleLeft className="h-4 w-4" />Tắt skill</>
								: <><ToggleRight className="h-4 w-4" />Kích hoạt</>
							}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:bg-destructive/10 focus:text-destructive"
							onClick={onDelete}
						>
							<Trash2 className="h-4 w-4 text-destructive" />
							Xóa skill
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

function SkillListPage() {
	useBreadcrumb([{ title: "Dashboard", link: "/" }, { title: "Quản lý skills" }]);

	const [skills, setSkills] = useState<SkillRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; order: "asc" | "desc" | null }>({
		key: "sort_order", order: "asc",
	});

	const [formOpen, setFormOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<SkillRecord | null>(null);
	const [form, setForm] = useState<SkillFormState>(emptyForm);
	const [isSaving, setIsSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<SkillRecord | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [togglingId, setTogglingId] = useState<number | null>(null);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(skills.map((s) => s.id));

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setMeta((p) => ({ ...p, current_page: 1 }));
	}, [debouncedSearch, sortConfig, statusFilter]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);

		skillService.getSkills({
			page: meta.current_page,
			per_page: meta.per_page,
			search: debouncedSearch || undefined,
			sort: sortConfig.key ?? undefined,
			order: sortConfig.order ?? undefined,
			status: statusFilter !== "all" ? statusFilter : undefined,
		}).then((res) => {
			if (cancelled) return;
			setSkills(res.data);
			setMeta((p) => ({ ...p, last_page: res.meta.last_page, total: res.meta.total }));
		}).catch(() => {
			if (!cancelled) toast.error("Không thể tải danh sách skills.");
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

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = skills.findIndex((s) => s.id === active.id);
		const newIndex = skills.findIndex((s) => s.id === over.id);
		const newSkills = arrayMove(skills, oldIndex, newIndex);

		// Assign sequential sort_order offset by page position
		const baseOrder = (meta.current_page - 1) * meta.per_page;
		const items = newSkills.map((s, i) => ({ id: s.id, sort_order: baseOrder + i }));

		setSkills(newSkills.map((s, i) => ({ ...s, sort_order: baseOrder + i })));

		try {
			await skillService.reorderSkills(items);
		} catch {
			toast.error("Không thể lưu thứ tự mới.");
			setReloadToken((p) => p + 1);
		}
	};

	const openCreate = () => {
		setEditTarget(null);
		setForm(emptyForm);
		setFormOpen(true);
	};

	const openEdit = (skill: SkillRecord) => {
		setEditTarget(skill);
		setForm({ name: skill.name, sort_order: skill.sort_order, is_active: skill.is_active });
		setFormOpen(true);
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error("Tên skill không được để trống.");
			return;
		}
		setIsSaving(true);
		try {
			if (editTarget) {
				const res = await skillService.updateSkill(editTarget.id, {
					name: form.name,
					sort_order: form.sort_order,
					is_active: form.is_active,
				});
				setSkills((prev) => prev.map((s) => s.id === editTarget.id ? { ...s, ...res.data } : s));
				toast.success("Đã cập nhật skill.");
			} else {
				await skillService.createSkill({
					name: form.name,
					sort_order: form.sort_order,
					is_active: form.is_active,
				});
				toast.success("Đã tạo skill mới.");
				setReloadToken((p) => p + 1);
			}
			setFormOpen(false);
		} catch {
			toast.error("Không thể lưu skill. Vui lòng thử lại.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleToggleStatus = async (skill: SkillRecord) => {
		setTogglingId(skill.id);
		try {
			const res = await skillService.toggleStatus(skill.id);
			setSkills((prev) => prev.map((s) => s.id === skill.id ? { ...s, ...res.data } : s));
			toast.success(res.data.is_active ? "Đã kích hoạt skill." : "Đã tắt skill.");
		} catch {
			toast.error("Không thể thay đổi trạng thái skill.");
		} finally {
			setTogglingId(null);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await skillService.deleteSkill(deleteTarget.id);
			setSkills((prev) => prev.filter((s) => s.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa skill.");
		} catch {
			toast.error("Không thể xóa skill. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const activeCount = skills.filter((s) => s.is_active).length;
	const totalUsers = skills.reduce((sum, s) => sum + s.users_count, 0);

	return (
		<div className="min-h-full bg-background">
			<div className="space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8">

				{/* Header */}
				<div className="space-y-1">
					<h2 className="text-2xl font-semibold tracking-tight">Quản lý Skills</h2>
					<p className="text-muted-foreground text-sm">
						Tạo và quản lý danh sách kỹ năng để thành viên gắn vào hồ sơ cá nhân.
					</p>
				</div>

				{/* Stats */}
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Tổng skills</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-violet-700 dark:text-violet-300">{meta.total}</p>
						<p className="mt-1 text-xs text-muted-foreground">Skills đang tồn tại trong hệ thống.</p>
					</div>
					<div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Đang hoạt động</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-300">{activeCount}</p>
						<p className="mt-1 text-xs text-muted-foreground">Skills hiển thị cho thành viên chọn.</p>
					</div>
					<div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-5 shadow-sm">
						<p className="text-sm font-semibold text-foreground">Lượt dùng</p>
						<p className="mt-1 text-3xl font-semibold tracking-tight text-sky-700 dark:text-sky-300">{totalUsers}</p>
						<p className="mt-1 text-xs text-muted-foreground">Tổng số thành viên đã gắn skill.</p>
					</div>
				</div>

				{/* Filter + Table */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-row items-center gap-3">
						<Input
							placeholder="Tìm kiếm theo tên skill..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-8 min-w-0 flex-1 max-w-64"
						/>
						<div className="ml-auto flex shrink-0 items-center gap-2">
							<Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
								<SelectTrigger className="h-8 w-36">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Tất cả</SelectItem>
									<SelectItem value="active">Đang hoạt động</SelectItem>
									<SelectItem value="inactive">Đã tắt</SelectItem>
								</SelectContent>
							</Select>
							<Button size="sm" onClick={openCreate} className="h-8 shrink-0 bg-foreground text-background hover:bg-foreground/90">
								<Plus className="h-4 w-4" />
								Thêm skill
							</Button>
						</div>
					</div>

					<div className="overflow-hidden rounded-md border">
						<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[36px]" />
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
												Tên skill {getSortIcon("name")}
											</Button>
										</TableHead>
										<TableHead className="w-[180px] text-sm font-medium">Slug</TableHead>
										<TableHead className="w-[110px]">
											<Button variant="ghost" onClick={() => handleSort("sort_order")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
												Thứ tự {getSortIcon("sort_order")}
											</Button>
										</TableHead>
										<TableHead className="w-[120px]">
											<Button variant="ghost" onClick={() => handleSort("users_count")} className="-ml-4 h-8 hover:bg-muted-foreground/10">
												Thành viên {getSortIcon("users_count")}
											</Button>
										</TableHead>
										<TableHead className="w-[110px] text-sm font-medium">Trạng thái</TableHead>
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
												<TableCell colSpan={10}><Skeleton className="h-4 w-full" /></TableCell>
											</TableRow>
										))
									) : skills.length > 0 ? (
										<SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
											{skills.map((skill) => (
												<SortableSkillRow
													key={skill.id}
													skill={skill}
													selected={isSelected(skill.id)}
													onToggleSelect={(c) => toggleOne(skill.id, c)}
													onEdit={() => openEdit(skill)}
													onToggleStatus={() => handleToggleStatus(skill)}
													onDelete={() => setDeleteTarget(skill)}
													isTogglingStatus={togglingId === skill.id}
												/>
											))}
										</SortableContext>
									) : (
										<TableRow>
											<TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
												Không tìm thấy skill nào. Hãy thêm skill đầu tiên!
											</TableCell>
										</TableRow>
									)}
								</TableBody>

								<TableFooter className="bg-transparent">
									<TableRow>
										<TableCell colSpan={10}>
											<div className="flex items-center justify-between px-2">
												<p className="flex-1 text-sm text-muted-foreground">
													Đang hiển thị {skills.length} trên tổng {meta.total} skills.
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
						</DndContext>
					</div>
				</div>
			</div>

			{/* Create / Edit dialog */}
			<Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
				<DialogContent className="sm:max-w-[460px]">
					<DialogHeader>
						<DialogTitle>{editTarget ? "Sửa skill" : "Thêm skill mới"}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="skill-name">Tên skill <span className="text-destructive">*</span></Label>
							<Input
								id="skill-name"
								placeholder="Ví dụ: Lập trình Python"
								value={form.name}
								onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>Hủy</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "Đang lưu..." : editTarget ? "Lưu thay đổi" : "Tạo skill"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className="sm:max-w-[440px]">
					{deleteTarget && (
						<>
							<DialogHeader><DialogTitle>Xác nhận xóa skill</DialogTitle></DialogHeader>
							<div className="space-y-3 text-sm text-muted-foreground">
								<p>Bạn sắp xóa skill:</p>
								<div className="flex items-center gap-2">
									<Sparkles className="h-4 w-4 text-violet-500" />
									<span className="font-medium text-foreground">{deleteTarget.name}</span>
								</div>
								{deleteTarget.users_count > 0 && (
									<p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400">
										Skill này đang được {deleteTarget.users_count} thành viên sử dụng.
										Xóa skill sẽ gỡ nó khỏi tất cả hồ sơ liên quan.
									</p>
								)}
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Hủy</Button>
								<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa skill"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default SkillListPage;
