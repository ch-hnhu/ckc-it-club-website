import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { toast } from "sonner";
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
	Megaphone,
	MoreHorizontal,
	Pencil,
	Plus,
	Trash2,
	UserPlus,
	Users,
} from "lucide-react";

import DepartmentFormModal from "@/pages/division/DepartmentFormModal";
import DepartmentMemberModal from "@/pages/division/DepartmentMemberModal";
import departmentService from "@/services/department.service";
import type { Department, DepartmentDetail } from "@/types/department.type";
import type { ApiErrorResponse } from "@/types/api.types";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CompactBadgeList } from "@/components/ui/compact-badge-list";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const breadcrumbItems = [
	{ title: "Dashboard", link: "/" },
	{ title: "Quản lý ban" },
];

function DivisionManagementPage() {
	useBreadcrumb(breadcrumbItems);
	const navigate = useNavigate();

	const [departments, setDepartments] = useState<Department[]>([]);
	const [meta, setMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
	const [detailDepartment, setDetailDepartment] = useState<DepartmentDetail | null>(null);
	const [isDetailLoading] = useState(false);
	const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
	const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(null);
	const [deletingDepartment, setDeletingDepartment] = useState(false);
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
	const [bulkDeleting, setBulkDeleting] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: string | null;
		order: "asc" | "desc" | null;
	}>({
		key: "created_at",
		order: "desc",
	});

	const { allSelected, isSelected, selectedIds, toggleAll, toggleOne } = useTableSelection(
		departments.map((department) => department.id),
	);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 500);

		return () => clearTimeout(handler);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	const fetchDepartments = async () => {
		try {
			const response = await departmentService.getDepartments({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch,
				sort: sortConfig.key || undefined,
				order: sortConfig.order || undefined,
			});

			setDepartments(response.data);
			setMeta({
				current_page: response.meta.current_page,
				last_page: response.meta.last_page,
				per_page: response.meta.per_page,
				total: response.meta.total,
			});
		} catch (error) {
			console.error("Không thể tải danh sách ban:", error);
			toast.error("Không thể tải danh sách ban.", { position: "top-right" });
		}
	};

	useEffect(() => {
		void fetchDepartments();
	}, [meta.current_page, meta.per_page, debouncedSearch, sortConfig]);

	const handleSort = (key: string) => {
		let order: "asc" | "desc" | null = "asc";

		if (sortConfig.key === key) {
			if (sortConfig.order === "asc") {
				order = "desc";
			} else if (sortConfig.order === "desc") {
				order = null;
			}
		}

		setSortConfig({ key: order ? key : null, order });
	};

	const getSortIcon = (key: string) => {
		if (sortConfig.key !== key) return <ArrowUpDown className='ml-2 h-4 w-4' />;
		if (sortConfig.order === "asc") return <ArrowUp className='ml-2 h-4 w-4' />;
		if (sortConfig.order === "desc") return <ArrowDown className='ml-2 h-4 w-4' />;
		return <ArrowUpDown className='ml-2 h-4 w-4' />;
	};

	const getDepartmentIcon = (slug: string) => {
		if (slug === "truyen-thong") return <Megaphone className='h-4 w-4' />;
		if (slug === "hoc-thuat") return <BookOpen className='h-4 w-4' />;
		return <Users className='h-4 w-4' />;
	};

	const getStatusBadge = (isActive: boolean) => (
		<CompactBadgeList
			items={[
				{
					key: isActive ? "active" : "inactive",
					label: isActive ? "Đang hoạt động" : "Tạm ngưng",
					className: isActive
						? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
						: "border-slate-500/30 bg-slate-500/10 text-slate-700 hover:bg-slate-500/10",
				},
			]}
			maxVisibleItems={1}
		/>
	);

	const getDepartmentDeleteError = (error: unknown) => {
		if (isAxiosError<ApiErrorResponse>(error)) {
			const response = error.response?.data;
			const firstError = response?.errors
				? Object.values(response.errors).find((messages) => messages?.length)?.[0]
				: null;

			return firstError ?? response?.message ?? "Không thể xóa ban.";
		}

		return "Không thể xóa ban.";
	};

	const handleDeleteDepartment = async () => {
		if (!deleteDepartment || deleteDepartment.users_count > 0) {
			return;
		}

		setDeletingDepartment(true);

		try {
			await departmentService.deleteDepartment(deleteDepartment.id);
			toast.success("Xóa ban thành công.", { position: "top-right" });
			setDeleteDepartment(null);
			toggleOne(deleteDepartment.id, false);
			await fetchDepartments();
		} catch (error) {
			toast.error(getDepartmentDeleteError(error), { position: "top-right" });
		} finally {
			setDeletingDepartment(false);
		}
	};

	const openBulkDeleteDialog = () => {
		if (selectedIds.length === 0) {
			return;
		}

		const selectedDepartments = departments.filter((department) =>
			selectedIds.includes(department.id),
		);
		const departmentsWithMembers = selectedDepartments.filter(
			(department) => department.users_count > 0,
		);

		if (departmentsWithMembers.length > 0) {
			toast.error("Không thể xóa ban đang có thành viên.", {
				description: departmentsWithMembers.map((department) => department.name).join(", "),
				position: "top-right",
			});
			return;
		}

		setBulkDeleteOpen(true);
	};

	const handleBulkDeleteDepartments = async () => {
		const selectedDepartments = departments.filter((department) =>
			selectedIds.includes(department.id),
		);

		if (selectedDepartments.length === 0) {
			setBulkDeleteOpen(false);
			return;
		}

		setBulkDeleting(true);

		try {
			await Promise.all(
				selectedDepartments.map((department) =>
					departmentService.deleteDepartment(department.id),
				),
			);
			toast.success(`Đã xóa ${selectedDepartments.length} ban.`, {
				position: "top-right",
			});
			setBulkDeleteOpen(false);
			toggleAll(false);
			await fetchDepartments();
		} catch (error) {
			toast.error(getDepartmentDeleteError(error), { position: "top-right" });
		} finally {
			setBulkDeleting(false);
		}
	};

	const handleShowDetail = (department: Department) => {
		navigate(`/divisions/${department.id}`);
	};

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Quản lý ban</h2>
					<p className='text-muted-foreground'>
						Danh sách các ban vận hành chính của CKC IT Club.
					</p>
				</div>
			</div>

			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
					<div className='flex flex-1 items-center gap-2'>
						<Input
							placeholder='Tìm kiếm theo tên ban...'
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							className='h-8 w-full sm:w-64 md:w-72 lg:w-80'
						/>
					</div>
					<div className='flex flex-wrap items-center gap-2'>
						{false && selectedIds.length > 0 ? (
							<Button
								size='sm'
								variant='destructive'
								onClick={openBulkDeleteDialog}
								disabled={bulkDeleting}
								className='h-8'>
								<Trash2 className='h-4 w-4' />
								Xóa đã chọn
							</Button>
						) : null}
						<Button
							size='sm'
							variant='outline'
							type='button'
							onClick={() => navigate("/divisions/trash")}
							className='h-8'>
							<Trash2 className='h-4 w-4' />
							Thùng rác
						</Button>
						<Button
							size='sm'
							onClick={() => {
								setSelectedDepartment(null);
								setIsFormOpen(true);
							}}
							className='h-8 bg-foreground text-background hover:bg-foreground/90'>
							<Plus className='h-4 w-4' />
							Thêm ban mới
						</Button>
					</div>
				</div>

				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[50px]'>
									<Checkbox
										aria-label='Chọn tất cả ban'
										checked={allSelected}
										onCheckedChange={(checked) => toggleAll(checked === true)}
									/>
								</TableHead>
								<TableHead className='w-[80px]'>STT</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("name")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Tên ban
										{getSortIcon("name")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("created_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Ngày tạo
										{getSortIcon("created_at")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("updated_at")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Ngày cập nhật
										{getSortIcon("updated_at")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("users_count")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Số lượng thành viên
										{getSortIcon("users_count")}
									</Button>
								</TableHead>
								<TableHead className='w-[50px]'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{departments.map((department, index) => (
								<TableRow key={department.id}>
									<TableCell>
										<Checkbox
											aria-label={`Chọn ban ${department.id}`}
											checked={isSelected(department.id)}
											onCheckedChange={(checked) =>
												toggleOne(department.id, checked === true)
											}
										/>
									</TableCell>
									<TableCell className='font-medium'>
										{(meta.current_page - 1) * meta.per_page + index + 1}
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-3'>
											<div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
												{getDepartmentIcon(department.slug)}
											</div>
											<div className='flex min-w-0 flex-col'>
												<span className='font-medium'>{department.name}</span>
												<span
													className='max-w-[420px] truncate text-xs text-muted-foreground'
													title={department.description ?? undefined}>
													{department.description ?? department.slug}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell>{department.created_at ?? "N/A"}</TableCell>
									<TableCell>{department.updated_at ?? "N/A"}</TableCell>
									<TableCell>{department.users_count}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='ghost'
													className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
													<MoreHorizontal className='h-4 w-4' />
													<span className='sr-only'>Mở thao tác</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end' className='w-[180px]'>
												<DropdownMenuItem
													onClick={() => void handleShowDetail(department)}>
													<Eye className='h-4 w-4' />
													Xem chi tiết
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => {
														setSelectedDepartment(department);
														setIsMemberFormOpen(true);
													}}>
													<UserPlus className='h-4 w-4' />
													Thêm thành viên
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => {
														setSelectedDepartment(department);
														setIsFormOpen(true);
													}}>
													<Pencil className='h-4 w-4' />
													Cập nhật
												</DropdownMenuItem>
												<DropdownMenuItem
													className='text-destructive focus:text-destructive'
													onClick={() => setDeleteDepartment(department)}>
													<Trash2 className='h-4 w-4 text-destructive' />
													Xóa ban
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{departments.length === 0 && (
								<TableRow>
									<TableCell colSpan={7} className='h-24 text-center'>
										Không tìm thấy ban phù hợp.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter className='bg-transparent'>
							<TableRow>
								<TableCell colSpan={7}>
									<div className='flex items-center justify-between px-2'>
										<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
											Hiển thị {departments.length} / {meta.total} ban.
											{selectedIds.length > 0 && (
												<>
													<span className='text-border'>|</span>
													<span className='font-medium text-foreground'>
														{selectedIds.length} ban được chọn
													</span>
													<Button
														size='sm'
														variant='destructive'
														disabled={bulkDeleting}
														onClick={openBulkDeleteDialog}
														className='h-7'>
														<Trash2 className='h-3.5 w-3.5' />
														{bulkDeleting ? "Đang xóa..." : "Xóa đã chọn"}
													</Button>
												</>
											)}
										</div>
										<div className='flex items-center space-x-6 lg:space-x-8'>
											<div className='flex items-center space-x-2'>
												<p className='text-sm font-medium'>Số hàng mỗi trang</p>
												<Select
													value={`${meta.per_page}`}
													onValueChange={(value) =>
														setMeta((prev) => ({
															...prev,
															per_page: Number(value),
															current_page: 1,
														}))
													}>
													<SelectTrigger className='h-8 w-[70px]'>
														<SelectValue placeholder={meta.per_page} />
													</SelectTrigger>
													<SelectContent side='top'>
														{[10, 20, 25, 30, 40, 50].map((pageSize) => (
															<SelectItem key={pageSize} value={`${pageSize}`}>
																{pageSize}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className='flex w-[120px] items-center justify-center text-sm font-medium'>
												Trang {meta.current_page} / {meta.last_page}
											</div>
											<div className='flex items-center space-x-2'>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({ ...prev, current_page: 1 }))
													}
													disabled={meta.current_page === 1}>
													<span className='sr-only'>Trang đầu</span>
													<ChevronsLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: prev.current_page - 1,
														}))
													}
													disabled={meta.current_page === 1}>
													<span className='sr-only'>Trang trước</span>
													<ChevronLeft className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='h-8 w-8 p-0'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: prev.current_page + 1,
														}))
													}
													disabled={meta.current_page === meta.last_page}>
													<span className='sr-only'>Trang sau</span>
													<ChevronRight className='h-4 w-4' />
												</Button>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: meta.last_page,
														}))
													}
													disabled={meta.current_page === meta.last_page}>
													<span className='sr-only'>Trang cuối</span>
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

			<DepartmentFormModal
				open={isFormOpen}
				onOpenChange={(open) => {
					setIsFormOpen(open);
					if (!open) setSelectedDepartment(null);
				}}
				department={selectedDepartment}
				onSuccess={() => void fetchDepartments()}
			/>

			<DepartmentMemberModal
				open={isMemberFormOpen}
				onOpenChange={(open) => {
					setIsMemberFormOpen(open);
					if (!open) setSelectedDepartment(null);
				}}
				department={selectedDepartment}
				onSuccess={() => void fetchDepartments()}
			/>

			<AlertDialog
				open={Boolean(deleteDepartment)}
				onOpenChange={(open) => {
					if (!open) setDeleteDepartment(null);
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa ban?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteDepartment && deleteDepartment.users_count > 0
								? "Không thể xóa ban đang có thành viên. Vui lòng xóa thành viên khỏi ban trước."
								: "Bạn có chắc chắn muốn xóa ban này?"}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deletingDepartment}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void handleDeleteDepartment();
							}}
							disabled={deletingDepartment || Boolean(deleteDepartment?.users_count)}
							className='bg-destructive text-white hover:bg-destructive/90'>
							{deletingDepartment ? "Đang xóa..." : "Xóa ban"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa các ban đã chọn?</AlertDialogTitle>
						<AlertDialogDescription>
							Bạn có chắc chắn muốn xóa {selectedIds.length} ban đã chọn không?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={bulkDeleting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void handleBulkDeleteDepartments();
							}}
							disabled={bulkDeleting}
							className='bg-destructive text-white hover:bg-destructive/90'>
							{bulkDeleting ? "Đang xóa..." : "Xóa đã chọn"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog open={Boolean(detailDepartment)} onOpenChange={() => setDetailDepartment(null)}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Chi tiết ban</DialogTitle>
					</DialogHeader>
					{detailDepartment ? (
						<div className='space-y-4 text-sm'>
							<div className='flex items-center gap-3 rounded-md border p-3'>
								<div className='flex h-9 w-9 items-center justify-center rounded-full bg-muted'>
									{getDepartmentIcon(detailDepartment.slug)}
								</div>
								<div className='min-w-0'>
									<div className='font-medium'>{detailDepartment.name}</div>
									<div className='text-xs text-muted-foreground'>
										{detailDepartment.slug}
									</div>
								</div>
							</div>
							<div className='grid grid-cols-[120px_1fr] gap-3'>
								<span className='text-muted-foreground'>Trạng thái</span>
								{getStatusBadge(detailDepartment.is_active)}
								<span className='text-muted-foreground'>Thành viên</span>
								<span>{detailDepartment.users_count}</span>
								<span className='text-muted-foreground'>Ngày tạo</span>
								<span>{detailDepartment.created_at ?? "N/A"}</span>
								<span className='text-muted-foreground'>Cập nhật</span>
								<span>{detailDepartment.updated_at ?? "N/A"}</span>
							</div>
							<div className='space-y-1.5'>
								<div className='text-muted-foreground'>Mô tả</div>
								<p className='rounded-md border bg-muted/20 p-3 leading-6'>
									{detailDepartment.description ?? "Chưa có mô tả"}
								</p>
							</div>
							<div className='space-y-2'>
								<div className='text-muted-foreground'>Danh sách thành viên</div>
								{isDetailLoading ? (
									<div className='rounded-md border px-3 py-4 text-center text-muted-foreground'>
										Đang tải thành viên...
									</div>
								) : detailDepartment.users.length > 0 ? (
									<div className='max-h-64 space-y-2 overflow-y-auto pr-1'>
										{detailDepartment.users.map((user) => (
											<div
												key={user.id}
												className='flex items-start justify-between gap-3 rounded-md border px-3 py-2'>
												<div className='min-w-0'>
													<div className='truncate font-medium'>{user.full_name}</div>
													<div className='truncate text-xs text-muted-foreground'>
														{user.email}
													</div>
												</div>
												<div className='flex shrink-0 flex-col items-end gap-1'>
													<CompactBadgeList
														items={[
															{
																key: user.department_role.id ?? user.id,
																label:
																	user.department_role.label ??
																	user.position ??
																	"Chưa có vai trò",
																className:
																	"border-primary-500/20 bg-primary-500/10 text-primary-700 hover:bg-primary-500/10",
															},
														]}
														maxVisibleItems={1}
													/>
													{user.is_head ? (
														<span className='text-xs text-muted-foreground'>
															Trưởng ban
														</span>
													) : null}
												</div>
											</div>
										))}
									</div>
								) : (
									<div className='rounded-md border px-3 py-4 text-center text-muted-foreground'>
										Chưa có thành viên.
									</div>
								)}
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default DivisionManagementPage;
