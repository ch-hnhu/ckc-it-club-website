import { useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	FolderTree,
	MoreHorizontal,
	Pencil,
	Plus,
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
import courseCategoryService, { type CourseCategory } from "@/services/course-category.service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFormatter.format(d);
}

type SortKey = "id" | "name" | "slug" | "courses_count" | "created_at";

// ─── Form state ──────────────────────────────────────────────────────────────

interface CategoryFormState {
	name: string;
}

const emptyForm: CategoryFormState = { name: "" };

// ─── Component ───────────────────────────────────────────────────────────────

function CourseCategoryListPage() {
	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Trung tâm đào tạo", link: "/courses" },
		{ title: "Danh mục khóa học" },
	]);

	const [categories, setCategories] = useState<CourseCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [reloadToken, setReloadToken] = useState(0);
	const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
	const [sortConfig, setSortConfig] = useState<{
		key: SortKey | null;
		order: "asc" | "desc" | null;
	}>({
		key: "created_at",
		order: "desc",
	});

	// Form / dialog state
	const [formOpen, setFormOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<CourseCategory | null>(null);
	const [form, setForm] = useState<CategoryFormState>(emptyForm);
	const [isSaving, setIsSaving] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<CourseCategory | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		categories.map((c) => c.id),
	);

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

		courseCategoryService
			.getCategories({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch || undefined,
				sort: sortConfig.key ?? undefined,
				order: sortConfig.order ?? undefined,
			})
			.then((res) => {
				if (cancelled) return;
				setCategories(res.data);
				setMeta((p) => ({
					...p,
					last_page: res.meta.last_page,
					total: res.meta.total,
				}));
			})
			.catch(() => {
				if (!cancelled) toast.error("Không thể tải danh sách danh mục.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [debouncedSearch, meta.current_page, meta.per_page, reloadToken, sortConfig]);

	const handleSort = (key: SortKey) => {
		let order: "asc" | "desc" | null = "asc";
		if (sortConfig.key === key) {
			order =
				sortConfig.order === "asc" ? "desc" : sortConfig.order === "desc" ? null : "asc";
		}
		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: SortKey) =>
		sortConfig.key !== key ? (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		) : sortConfig.order === "asc" ? (
			<ArrowUp className='ml-2 h-4 w-4' />
		) : sortConfig.order === "desc" ? (
			<ArrowDown className='ml-2 h-4 w-4' />
		) : (
			<ArrowUpDown className='ml-2 h-4 w-4' />
		);

	// ── Form handlers ──

	const openCreate = () => {
		setEditTarget(null);
		setForm(emptyForm);
		setFormOpen(true);
	};

	const openEdit = (category: CourseCategory) => {
		setEditTarget(category);
		setForm({ name: category.name });
		setFormOpen(true);
	};

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error("Tên danh mục không được để trống.");
			return;
		}
		setIsSaving(true);
		try {
			if (editTarget) {
				const res = await courseCategoryService.updateCategory(editTarget.id, {
					name: form.name,
				});
				setCategories((prev) =>
					prev.map((c) => (c.id === editTarget.id ? { ...c, ...res.data } : c)),
				);
				toast.success("Đã cập nhật danh mục.");
			} else {
				const res = await courseCategoryService.createCategory({
					name: form.name,
				});
				setCategories((prev) => [res.data, ...prev]);
				toast.success("Đã tạo danh mục mới.");
			}
			setFormOpen(false);
			setReloadToken((p) => p + 1);
		} catch (err) {
			const msg = (
				err as {
					response?: { data?: { message?: string; errors?: Record<string, string[]> } };
				}
			)?.response?.data?.errors
				? Object.values(
						(err as { response: { data: { errors: Record<string, string[]> } } })
							.response.data.errors,
					).flat()[0]
				: ((err as { response?: { data?: { message?: string } } })?.response?.data
						?.message ?? "Không thể lưu danh mục. Vui lòng thử lại.");
			toast.error(msg);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			await courseCategoryService.deleteCategory(deleteTarget.id);
			setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
			setDeleteTarget(null);
			setReloadToken((p) => p + 1);
			toast.success("Đã xóa danh mục.");
		} catch {
			toast.error("Không thể xóa danh mục. Vui lòng thử lại.");
		} finally {
			setIsDeleting(false);
		}
	};

	const totalUsage = categories.reduce((s, c) => s + c.courses_count, 0);
	const unusedCount = categories.filter((c) => c.courses_count === 0).length;

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:space-y-8 lg:p-8'>
				{/* Header */}
				<div className='space-y-2'>
					<h2 className='text-2xl font-semibold tracking-tight'>Danh mục khóa học</h2>
					<p className='text-muted-foreground'>
						Tạo và quản lý danh mục để phân loại các khóa học trong Trung tâm đào tạo.
					</p>
				</div>

				{/* Stats */}
				<div className='grid gap-4 sm:grid-cols-3'>
					<div className='rounded-2xl border border-teal-500/15 bg-teal-500/5 p-5 shadow-sm'>
						<p className='text-sm font-semibold text-foreground'>Tổng danh mục</p>
						<p className='mt-1 text-3xl font-semibold tracking-tight text-teal-700 dark:text-teal-300'>
							{meta.total}
						</p>
						<p className='mt-1 text-xs text-muted-foreground'>
							Danh mục đang tồn tại trong hệ thống.
						</p>
					</div>
					<div className='rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5 shadow-sm'>
						<p className='text-sm font-semibold text-foreground'>Lượt sử dụng</p>
						<p className='mt-1 text-3xl font-semibold tracking-tight text-violet-700 dark:text-violet-300'>
							{totalUsage}
						</p>
						<p className='mt-1 text-xs text-muted-foreground'>
							Tổng số lần được gán cho khóa học.
						</p>
					</div>
					<div className='rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5 shadow-sm'>
						<p className='text-sm font-semibold text-foreground'>Chưa dùng</p>
						<p className='mt-1 text-3xl font-semibold tracking-tight text-amber-700 dark:text-amber-300'>
							{unusedCount}
						</p>
						<p className='mt-1 text-xs text-muted-foreground'>
							Danh mục chưa gán cho khóa học nào.
						</p>
					</div>
				</div>

				{/* Filter + Table */}
				<div className='flex flex-col gap-4'>
					<div className='flex flex-row items-center gap-3'>
						<Input
							placeholder='Tìm kiếm theo tên danh mục...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-8 min-w-0 flex-1 max-w-80'
						/>
						<Button
							size='sm'
							onClick={openCreate}
							className='ml-auto h-8 shrink-0 bg-foreground text-background hover:bg-foreground/90'>
							<Plus className='h-4 w-4' />
							Thêm danh mục
						</Button>
					</div>

					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-[44px]'>
										<Checkbox
											aria-label='Chọn tất cả'
											checked={allSelected}
											onCheckedChange={(c) => toggleAll(c === true)}
										/>
									</TableHead>
									<TableHead className='w-[80px] px-4'>STT</TableHead>
									<TableHead>
										<Button
											variant='ghost'
											onClick={() => handleSort("name")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Tên danh mục {getSortIcon("name")}
										</Button>
									</TableHead>
									<TableHead className='w-[180px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("slug")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Slug {getSortIcon("slug")}
										</Button>
									</TableHead>
									<TableHead className='w-[120px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("courses_count")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Khóa học {getSortIcon("courses_count")}
										</Button>
									</TableHead>
									<TableHead className='w-[140px]'>
										<Button
											variant='ghost'
											onClick={() => handleSort("created_at")}
											className='-ml-4 h-8 hover:bg-muted-foreground/10'>
											Ngày tạo {getSortIcon("created_at")}
										</Button>
									</TableHead>
									<TableHead className='w-[52px]' />
								</TableRow>
							</TableHeader>

							<TableBody>
								{loading ? (
									Array.from({ length: meta.per_page }).map((_, i) => (
										<TableRow key={i}>
											<TableCell>
												<Skeleton className='h-4 w-4' />
											</TableCell>
											<TableCell colSpan={6}>
												<Skeleton className='h-4 w-full' />
											</TableCell>
										</TableRow>
									))
								) : categories.length > 0 ? (
									categories.map((category, index) => (
										<TableRow key={category.id}>
											<TableCell>
												<Checkbox
													checked={isSelected(category.id)}
													onCheckedChange={(c) =>
														toggleOne(category.id, c === true)
													}
												/>
											</TableCell>
											<TableCell className='px-4 font-medium text-muted-foreground'>
												{(meta.current_page - 1) * meta.per_page +
													index +
													1}
											</TableCell>
											<TableCell>
												<Badge
													variant='outline'
													className='rounded-full px-3 py-0.5 text-sm font-medium'>
													<FolderTree className='mr-1.5 h-3 w-3' />
													{category.name}
												</Badge>
											</TableCell>
											<TableCell className='text-sm text-muted-foreground font-mono'>
												{category.slug}
											</TableCell>
											<TableCell className='text-sm text-muted-foreground'>
												{category.courses_count}
											</TableCell>
											<TableCell className='text-sm text-muted-foreground'>
												{formatDate(category.created_at)}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant='ghost'
															className='h-8 w-8 p-0 data-[state=open]:bg-muted'>
															<MoreHorizontal className='h-4 w-4' />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align='end'
														className='w-[80px]'>
														<DropdownMenuItem
															onClick={() => openEdit(category)}>
															<Pencil className='h-4 w-4' />
															Sửa
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className='text-destructive focus:bg-destructive/10 focus:text-destructive'
															onClick={() =>
																setDeleteTarget(category)
															}>
															<Trash2 className='h-4 w-4 text-destructive' />
															Xóa
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={7}
											className='h-32 text-center text-muted-foreground'>
											Không tìm thấy danh mục nào. Hãy thêm danh mục đầu tiên!
										</TableCell>
									</TableRow>
								)}
							</TableBody>

							<TableFooter className='bg-transparent'>
								<TableRow>
									<TableCell colSpan={7}>
										<div className='flex items-center justify-between px-2'>
											<p className='flex-1 text-sm text-muted-foreground'>
												Đang hiển thị {categories.length} trên tổng{" "}
												{meta.total} danh mục.
											</p>
											<div className='flex items-center space-x-6 lg:space-x-8'>
												<div className='flex items-center space-x-2'>
													<p className='text-sm font-medium'>
														Rows per page
													</p>
													<Select
														value={`${meta.per_page}`}
														onValueChange={(v) =>
															setMeta((p) => ({
																...p,
																per_page: Number(v),
																current_page: 1,
															}))
														}>
														<SelectTrigger className='h-8 w-[70px]'>
															<SelectValue />
														</SelectTrigger>
														<SelectContent side='top'>
															{[10, 20, 25, 50].map((s) => (
																<SelectItem key={s} value={`${s}`}>
																	{s}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className='flex w-[110px] items-center justify-center text-sm font-medium'>
													Trang {meta.current_page} / {meta.last_page}
												</div>
												<div className='flex items-center space-x-2'>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: 1,
															}))
														}
														disabled={meta.current_page === 1}>
														<ChevronsLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: Math.max(
																	1,
																	p.current_page - 1,
																),
															}))
														}
														disabled={meta.current_page === 1}>
														<ChevronLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: Math.min(
																	p.last_page,
																	p.current_page + 1,
																),
															}))
														}
														disabled={
															meta.current_page === meta.last_page
														}>
														<ChevronRight className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() =>
															setMeta((p) => ({
																...p,
																current_page: p.last_page,
															}))
														}
														disabled={
															meta.current_page === meta.last_page
														}>
														<ChevronsRight className='h-4 w-4' />
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
				<DialogContent className='sm:max-w-[460px]'>
					<DialogHeader>
						<DialogTitle>
							{editTarget ? "Sửa danh mục" : "Thêm danh mục mới"}
						</DialogTitle>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='category-name'>
								Tên danh mục <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='category-name'
								placeholder='Ví dụ: Lập trình web'
								value={form.name}
								onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setFormOpen(false)}
							disabled={isSaving}>
							Hủy
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving
								? "Đang lưu..."
								: editTarget
									? "Lưu thay đổi"
									: "Tạo danh mục"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirm */}
			<Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
				<DialogContent className='sm:max-w-[440px]'>
					{deleteTarget && (
						<>
							<DialogHeader>
								<DialogTitle>Xác nhận xóa danh mục</DialogTitle>
							</DialogHeader>
							<div className='space-y-3 text-sm text-muted-foreground'>
								<p>Bạn sắp xóa danh mục:</p>
								<div className='flex items-center gap-2'>
									<Badge variant='outline' className='rounded-full'>
										{deleteTarget.name}
									</Badge>
								</div>
								{deleteTarget.courses_count > 0 && (
									<p className='rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-700'>
										Danh mục này đang được dùng trong{" "}
										{deleteTarget.courses_count} khóa học. Xóa danh mục sẽ gỡ nó
										khỏi tất cả khóa học liên quan.
									</p>
								)}
								<p>Hành động này không thể hoàn tác.</p>
							</div>
							<DialogFooter>
								<Button
									variant='outline'
									onClick={() => setDeleteTarget(null)}
									disabled={isDeleting}>
									Hủy
								</Button>
								<Button
									variant='destructive'
									onClick={handleDelete}
									disabled={isDeleting}>
									{isDeleting ? "Đang xóa..." : "Xóa danh mục"}
								</Button>
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default CourseCategoryListPage;
