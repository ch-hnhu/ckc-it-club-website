import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Edit,
	Eye,
	MoreHorizontal,
	Plus,
	Search,
	ShieldAlert,
	Trash2,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import DepartmentFormModal from "@/pages/division/DepartmentFormModal";
import DepartmentMemberModal from "@/pages/division/DepartmentMemberModal";
import DepartmentMemberRoleModal from "@/pages/division/DepartmentMemberRoleModal";
import departmentService from "@/services/department.service";
import type { DepartmentDetail, DepartmentUser } from "@/types/department.type";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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

const pageSizeOptions = [10, 20, 30, 50];

function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
	return (
		<div className='flex flex-col gap-1 rounded-lg border bg-muted/20 p-4'>
			<p className='text-xs font-medium uppercase text-muted-foreground'>{label}</p>
			<div className='text-sm font-medium break-words'>{value}</div>
		</div>
	);
}

function DepartmentDetailPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { hasPermission } = useAuth();
	const canManageDepartment = hasPermission("club_info.manage");

	const [department, setDepartment] = useState<DepartmentDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [headFilter, setHeadFilter] = useState("all");
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const [roleMember, setRoleMember] = useState<DepartmentUser | null>(null);
	const [removeMember, setRemoveMember] = useState<DepartmentUser | null>(null);
	const [removing, setRemoving] = useState(false);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Quản lý CLB" },
		{ title: "Các ban", link: "/divisions" },
		{ title: "Chi tiết ban" },
	]);

	const fetchDepartment = useCallback(async () => {
		if (!id) return;

		setLoading(true);

		try {
			const response = await departmentService.getDepartment(id);
			setDepartment(response.data);
		} catch (error) {
			console.error("Không thể tải chi tiết ban:", error);
			toast.error("Không thể tải chi tiết ban.", { position: "top-right" });
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		void fetchDepartment();
	}, [fetchDepartment]);

	useEffect(() => {
		setPage(1);
	}, [search, headFilter, perPage]);

	const headMember = useMemo(
		() => department?.users.find((member) => member.is_head) ?? null,
		[department],
	);

	const filteredMembers = useMemo(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return (department?.users ?? []).filter((member) => {
			const matchesSearch =
				!normalizedSearch ||
				member.full_name?.toLowerCase().includes(normalizedSearch) ||
				member.email.toLowerCase().includes(normalizedSearch);

			const matchesHead =
				headFilter === "all" ||
				(headFilter === "head" && member.is_head) ||
				(headFilter === "member" && !member.is_head);

			return matchesSearch && matchesHead;
		});
	}, [department?.users, headFilter, search]);

	const lastPage = Math.max(1, Math.ceil(filteredMembers.length / perPage));
	const currentPage = Math.min(page, lastPage);
	const paginatedMembers = filteredMembers.slice(
		(currentPage - 1) * perPage,
		currentPage * perPage,
	);

	const { allSelected, isSelected, selectedIds, toggleAll, toggleOne } = useTableSelection(
		paginatedMembers.map((m) => m.id),
	);

	const [isBulkRemoving, setIsBulkRemoving] = useState(false);

	const handleBulkRemove = async () => {
		if (!department || selectedIds.length === 0) return;
		if (!window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} thành viên khỏi ban?`)) return;

		setIsBulkRemoving(true);
		try {
			await Promise.all(
				selectedIds.map((userId) => departmentService.removeDepartmentUser(department.id, userId)),
			);
			toast.success(`Đã xóa ${selectedIds.length} thành viên khỏi ban.`, { position: "top-right" });
			await fetchDepartment();
		} catch (error) {
			console.error(error);
			toast.error("Không thể xóa một số thành viên khỏi ban.", { position: "top-right" });
		} finally {
			setIsBulkRemoving(false);
		}
	};

	const handleRemoveMember = async () => {
		if (!department || !removeMember) return;

		setRemoving(true);

		try {
			await departmentService.removeDepartmentUser(department.id, removeMember.id);
			toast.success("Xóa thành viên khỏi ban thành công.", { position: "top-right" });
			setRemoveMember(null);
			await fetchDepartment();
		} catch (error) {
			console.error("Không thể xóa thành viên khỏi ban:", error);
			toast.error("Không thể xóa thành viên khỏi ban.", { position: "top-right" });
		} finally {
			setRemoving(false);
		}
	};

	if (loading && !department) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-10 w-28' />
				<div className='flex flex-col gap-6'>
					<Skeleton className='h-48 w-full rounded-xl' />
					<Skeleton className='h-96 w-full rounded-xl' />
				</div>
			</div>
		);
	}

	if (!department) {
		return (
			<div className='flex min-h-[420px] flex-col items-center justify-center gap-3 p-6 text-center'>
				<h2 className='text-xl font-semibold'>Không tìm thấy ban</h2>
				<p className='text-sm text-muted-foreground'>
					Dữ liệu chi tiết ban không khả dụng hoặc bạn không có quyền truy cập.
				</p>
				<Button variant='outline' onClick={() => navigate("/divisions")}>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Button>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button
				variant='outline'
				onClick={() => navigate("/divisions")}
				className='w-fit'>
				<ArrowLeft className='h-4 w-4' />
				Quay lại
			</Button>

			<div className='flex flex-col gap-6'>
				{/* Info card */}
				<Card className='shadow-sm'>
					<CardHeader className='pb-2'>
						<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
							<div>
								<div className='mb-1 flex flex-wrap items-center gap-2'>
									<Badge
										variant='secondary'
										className='border-transparent'>
										#{department.id}
									</Badge>
									<Badge
										variant='outline'
										className={
											department.is_active
												? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
												: "border-slate-500/30 bg-slate-500/10 text-slate-700"
										}>
										{department.is_active ? "Đang hoạt động" : "Tạm ngưng"}
									</Badge>
									{!headMember ? (
										<Badge
											variant='outline'
											className='border-amber-500/30 bg-amber-500/10 text-amber-700'>
											<ShieldAlert className='h-3.5 w-3.5' />
											Chưa có trưởng ban
										</Badge>
									) : null}
								</div>
								<CardTitle className='text-lg leading-snug'>{department.name}</CardTitle>
								<CardDescription>Thông tin ban</CardDescription>
							</div>
							<Button
								type='button'
								size='sm'
								variant='outline'
								onClick={() => setIsEditOpen(true)}
								disabled={!canManageDepartment}
								className='h-8 w-fit self-start'>
								<Edit className='h-4 w-4' />
								Sửa
							</Button>
						</div>
					</CardHeader>
					<CardContent className='grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-3'>
						<InfoRow label='Tên ban' value={department.name} />
						<InfoRow
							label='Slug'
							value={
								<span className='font-mono text-sm text-muted-foreground'>
									{department.slug}
								</span>
							}
						/>
						<InfoRow
							label='Trưởng ban'
							value={headMember?.full_name ?? "Chưa phân công"}
						/>
						<InfoRow
							label='Mô tả'
							value={department.description || "--"}
						/>
						<InfoRow
							label='Ngày tạo'
							value={department.created_at ?? "N/A"}
						/>
						<InfoRow
							label='Ngày cập nhật'
							value={department.updated_at ?? "N/A"}
						/>
					</CardContent>
				</Card>

				{/* Members section */}
				<div className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex flex-1 items-center justify-between gap-2'>
							<div className='flex flex-1 items-center gap-2'>
								<div className='relative flex-1 sm:max-w-sm'>
									<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
									<Input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										placeholder='Tìm theo họ tên hoặc email...'
										className='h-8 pl-9'
									/>
								</div>
								<Select value={headFilter} onValueChange={setHeadFilter}>
									<SelectTrigger className='h-8 w-[180px]'>
										<SelectValue placeholder='Lọc vai trò' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>Tất cả vai trò</SelectItem>
										<SelectItem value='head'>Trưởng ban</SelectItem>
										<SelectItem value='member'>Thành viên</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<Button
								size='sm'
								onClick={() => setIsAddMemberOpen(true)}
								disabled={!canManageDepartment}
								className='h-8 bg-foreground text-background hover:bg-foreground/90'>
								<Plus className='h-4 w-4' />
								Thêm thành viên
							</Button>
						</div>
					</div>

					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow className='bg-muted/30 hover:bg-muted/30 [&>th]:text-sm'>
									<TableHead className='w-[50px]'>
										<Checkbox
											aria-label='Chọn tất cả'
											checked={allSelected}
											onCheckedChange={(checked) => toggleAll(checked === true)}
										/>
									</TableHead>
									<TableHead className='w-[72px]'>STT</TableHead>
									<TableHead>Họ tên</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Vai trò</TableHead>
									<TableHead>Trạng thái</TableHead>
									<TableHead>Ngày tham gia</TableHead>
									<TableHead className='w-[64px]'></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedMembers.map((member, index) => (
									<TableRow
										key={member.id}
										className='transition-colors duration-150 hover:bg-muted/40'>
										<TableCell>
											<Checkbox
												aria-label={`Chọn thành viên ${member.id}`}
												checked={isSelected(member.id)}
												onCheckedChange={(checked) => toggleOne(member.id, checked === true)}
											/>
										</TableCell>
										<TableCell className='text-muted-foreground'>{(currentPage - 1) * perPage + index + 1}</TableCell>
										<TableCell>
											<div className='font-medium'>{member.full_name}</div>
											{member.is_head ? (
												<div className='text-xs text-amber-700'>Trưởng ban</div>
											) : null}
										</TableCell>
										<TableCell className='text-muted-foreground'>{member.email}</TableCell>
										<TableCell>
											<Badge
												variant='outline'
												className={
													member.is_head
														? "rounded-full border-amber-500/30 bg-amber-500/10 text-amber-700"
														: "rounded-full border-slate-500/30 bg-slate-500/10 text-slate-700"
												}>
												{member.is_head ? "Trưởng ban" : "Thành viên"}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant='outline'
												className={
													member.is_active
														? "rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
														: "rounded-full border-slate-500/30 bg-slate-500/10 text-slate-700"
												}>
												{member.is_active ? "Đang hoạt động" : "Tạm ngưng"}
											</Badge>
										</TableCell>
										<TableCell>{member.joined_at ?? "N/A"}</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant='ghost' className='h-8 w-8 p-0'>
														<MoreHorizontal className='h-4 w-4' />
														<span className='sr-only'>Mở thao tác</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align='end' className='w-[180px]'>
													<DropdownMenuItem onClick={() => navigate(`/users/${member.id}`)}>
														<Eye className='h-4 w-4' />
														Xem hồ sơ
													</DropdownMenuItem>
													<DropdownMenuItem
														disabled={!canManageDepartment}
														onClick={() => setRoleMember(member)}>
														<Edit className='h-4 w-4' />
														Đổi chức vụ
													</DropdownMenuItem>
													<DropdownMenuItem
														variant='destructive'
														disabled={!canManageDepartment}
														onClick={() => setRemoveMember(member)}>
														<Trash2 className='h-4 w-4' />
														Xóa khỏi ban
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
								{paginatedMembers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={8} className='h-40 text-center'>
											<div className='flex flex-col items-center gap-2'>
												<div className='text-sm font-medium'>Không có thành viên phù hợp.</div>
												<p className='text-sm text-muted-foreground'>
													Thử đổi từ khóa tìm kiếm, bộ lọc vai trò hoặc thêm thành viên mới.
												</p>
											</div>
										</TableCell>
									</TableRow>
								) : null}
							</TableBody>
							<TableFooter className='bg-transparent'>
								<TableRow>
									<TableCell colSpan={8}>
										<div className='flex flex-col gap-3 px-2 py-1 sm:flex-row sm:items-center sm:justify-between'>
											<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
												Đang hiện {paginatedMembers.length} trên tổng {filteredMembers.length} thành viên.
												{selectedIds.length > 0 ? (
													<>
														<span className='text-border'>|</span>
														<span className='font-medium text-foreground'>
															{selectedIds.length} thành viên được chọn
														</span>
														<Button
															size='sm'
															variant='destructive'
															disabled={isBulkRemoving || !canManageDepartment}
															onClick={() => void handleBulkRemove()}
															className='h-7'>
															<Trash2 className='h-3.5 w-3.5' />
															{isBulkRemoving ? "Đang xóa..." : "Xóa đã chọn"}
														</Button>
													</>
												) : null}
											</div>
											<div className='flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6'>
												<div className='flex items-center gap-2'>
													<p className='text-sm font-medium'>Rows per page</p>
													<Select
														value={`${perPage}`}
														onValueChange={(value) => setPerPage(Number(value))}>
														<SelectTrigger className='h-8 w-[70px]'>
															<SelectValue placeholder={perPage} />
														</SelectTrigger>
														<SelectContent side='top'>
															{pageSizeOptions.map((pageSize) => (
																<SelectItem key={pageSize} value={`${pageSize}`}>
																	{pageSize}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
													Trang {currentPage} / {lastPage}
												</div>
												<div className='flex items-center gap-2'>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() => setPage(1)}
														disabled={currentPage === 1}>
														<ChevronsLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() => setPage((prev) => Math.max(1, prev - 1))}
														disabled={currentPage === 1}>
														<ChevronLeft className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='h-8 w-8 p-0'
														onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
														disabled={currentPage === lastPage}>
														<ChevronRight className='h-4 w-4' />
													</Button>
													<Button
														variant='outline'
														className='hidden h-8 w-8 p-0 lg:flex'
														onClick={() => setPage(lastPage)}
														disabled={currentPage === lastPage}>
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

			<DepartmentFormModal
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				department={department}
				onSuccess={() => void fetchDepartment()}
			/>

			<DepartmentMemberModal
				open={isAddMemberOpen}
				onOpenChange={setIsAddMemberOpen}
				department={department}
				onSuccess={() => void fetchDepartment()}
			/>

			<DepartmentMemberRoleModal
				open={Boolean(roleMember)}
				onOpenChange={(open) => !open && setRoleMember(null)}
				department={department}
				member={roleMember}
				currentHead={headMember}
				onSuccess={() => void fetchDepartment()}
			/>

			<AlertDialog open={Boolean(removeMember)} onOpenChange={(open) => !open && setRemoveMember(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa thành viên khỏi ban?</AlertDialogTitle>
						<AlertDialogDescription>
							Thành viên sẽ không còn nằm trong ban này. Tài khoản người dùng không bị xóa khỏi hệ thống.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={removing}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(event) => {
								event.preventDefault();
								void handleRemoveMember();
							}}
							disabled={removing}
							className='bg-destructive text-white hover:bg-destructive/90'>
							{removing ? "Đang xóa..." : "Xóa khỏi ban"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default DepartmentDetailPage;
