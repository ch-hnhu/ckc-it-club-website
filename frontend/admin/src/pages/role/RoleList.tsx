import { useEffect, useMemo, useState } from "react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableFooter,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	Plus,
	Settings2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useTableSelection } from "@/hooks/useTableSelection";
import roleService from "@/services/role.service";
import type { Role } from "@/types/role.type";
import CreateRoleModal from "./CreateRoleModal";

function RoleList() {
	const navigate = useNavigate();
	const [roles, setRoles] = useState<Role[]>([]);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [meta, setMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [sortConfig, setSortConfig] = useState<{
		key: string | null;
		order: "asc" | "desc" | null;
	}>({
		key: "created_at",
		order: "desc",
	});
	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		roles.map((role) => role.id),
	);

	const breadcrumb = useMemo(
		() => [{ title: "Dashboard", link: "/" }, { title: "Quản lý vai trò" }],
		[],
	);

	useBreadcrumb(breadcrumb);

	// Debounce search
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 500);
		return () => clearTimeout(handler);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig]);

	useEffect(() => {
		fetchRoles();
	}, [meta.current_page, meta.per_page, debouncedSearch, sortConfig]);

	const fetchRoles = async () => {
		try {
			const response = await roleService.getRoles({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch,
				sort: sortConfig.key || undefined,
				order: sortConfig.order || undefined,
			});
			setRoles(response.data);
			setMeta({
				current_page: response.meta.current_page,
				last_page: response.meta.last_page,
				per_page: response.meta.per_page,
				total: response.meta.total,
			});
		} catch (error) {
			console.error("Đã có lỗi xảy ra:", error);
		}
	};

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

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Quản lý vai trò</h2>
					<p className='text-muted-foreground'>
						Danh sách tất cả vai trò trong hệ thống.
					</p>
				</div>
			</div>
			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<div className='flex items-center justify-between'>
					<div className='flex flex-1 items-center gap-2'>
						<Input
							placeholder='Lọc vai trò...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-8 sm:w-64 md:w-72 lg:w-80 w-11/12'
						/>
					</div>
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' className='h-8 lg:flex'>
							<Settings2 className='h-4 w-4' />
							Lọc
						</Button>
						<Button
							size='sm'
							onClick={() => setIsCreateModalOpen(true)}
							className='h-8 bg-foreground text-background hover:bg-foreground/90'>
							<Plus className='h-4 w-4' />
							Thêm
						</Button>
					</div>
				</div>
				<div className='overflow-hidden rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className='w-[50px]'>
									<Checkbox
										aria-label='Select all'
										checked={allSelected}
										onCheckedChange={(checked) => toggleAll(checked === true)}
									/>
								</TableHead>
								<TableHead className='w-[60px]'>
									<Button
										variant='ghost'
										onClick={() => handleSort("id")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										ID
										{getSortIcon("id")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("name")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Role
										{getSortIcon("name")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("total_users")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Số lượng
										{getSortIcon("total_users")}
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
								<TableHead className='w-[50px]'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{roles.map((role) => (
								<TableRow key={role.id}>
									<TableCell>
										<Checkbox
											aria-label={`Select role ${role.id}`}
											checked={isSelected(role.id)}
											onCheckedChange={(checked) =>
												toggleOne(role.id, checked === true)
											}
										/>
									</TableCell>
									<TableCell className='font-medium'>{role.id}</TableCell>
									<TableCell>{role.label}</TableCell>
									<TableCell>{role.total_users ?? 0}</TableCell>
									<TableCell>{role.created_at ?? "-"}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant='ghost'
													className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'>
													<MoreHorizontal className='h-4 w-4' />
													<span className='sr-only'>Open menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end' className='w-[160px]'>
												<DropdownMenuItem
													onClick={() => navigate(`/roles/${role.id}`)}>
													Sửa
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{roles.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className='h-24 text-center'>
										Không tìm thấy kết quả phù hợp.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
						<TableFooter className='bg-transparent'>
							<TableRow>
								<TableCell colSpan={6}>
									<div className='flex items-center justify-between px-2'>
										<div className='flex-1 text-sm text-muted-foreground'>
											Đang hiện {roles.length} trên tổng {meta.total} dòng.
										</div>
										<div className='flex items-center space-x-6 lg:space-x-8'>
											<div className='flex items-center space-x-2'>
												<p className='text-sm font-medium'>Rows per page</p>
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
														{[10, 20, 25, 30, 40, 50].map(
															(pageSize) => (
																<SelectItem
																	key={pageSize}
																	value={`${pageSize}`}>
																	{pageSize}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>
											<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
												Page {meta.current_page} of {meta.last_page}
											</div>
											<div className='flex items-center space-x-2'>
												<Button
													variant='outline'
													className='hidden h-8 w-8 p-0 lg:flex'
													onClick={() =>
														setMeta((prev) => ({
															...prev,
															current_page: 1,
														}))
													}
													disabled={meta.current_page === 1}>
													<span className='sr-only'>
														Go to first page
													</span>
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
													<span className='sr-only'>
														Quay lại trang trước
													</span>
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
													<span className='sr-only'>
														Đi đến trang tiếp theo
													</span>
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
													<span className='sr-only'>
														Đi đến trang cuối
													</span>
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

			<CreateRoleModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onSuccess={() => fetchRoles()}
			/>
		</div>
	);
}

export default RoleList;
