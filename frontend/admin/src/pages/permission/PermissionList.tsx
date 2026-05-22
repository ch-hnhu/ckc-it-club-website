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
	Eye,
	MoreHorizontal,
} from "lucide-react";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import permissionService from "@/services/permission.service";
import roleService from "@/services/role.service";
import type { Permission } from "@/types/permission.type";
import { useTableSelection } from "@/hooks/useTableSelection";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { CompactBadgeList } from "@/components/ui/compact-badge-list";
import PermissionDetailModal from "@/pages/permission/PermissionDetailModal";

function PermissionList() {
	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [meta, setMeta] = useState({
		current_page: 1,
		last_page: 1,
		per_page: 10,
		total: 0,
	});
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [roleFilters, setRoleFilters] = useState<string[]>([]);
	const [roleOptions, setRoleOptions] = useState<ComboboxOption[]>([]);
	const [allRoles, setAllRoles] = useState<Array<{ id: number; value: string; label: string }>>([]);
	const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: string | null;
		order: "asc" | "desc" | null;
	}>({
		key: "id",
		order: "asc",
	});

	const breadcrumb = useMemo(
		() => [{ title: "Dashboard", link: "/" }, { title: "Quản lý quyền" }],
		[],
	);

	useBreadcrumb(breadcrumb);

	useEffect(() => {
		const loadRoles = async () => {
			try {
				const response = await roleService.getRoles({ per_page: 100 });
				const roles = response.data.map((role) => ({
					id: role.id,
					value: role.value,
					label: role.label,
				}));
				setAllRoles(roles);
				setRoleOptions(roles.map((r) => ({ value: r.value, label: r.label })));
			} catch (error) {
				console.error("Không thể tải danh sách vai trò:", error);
			}
		};
		loadRoles();
	}, []);

	// Debounce search
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
		}, 500);
		return () => clearTimeout(handler);
	}, [search]);

	useEffect(() => {
		setMeta((prev) => ({ ...prev, current_page: 1 }));
	}, [debouncedSearch, sortConfig, roleFilters]);

	useEffect(() => {
		fetchPermissions();
	}, [meta.current_page, meta.per_page, debouncedSearch, sortConfig, roleFilters]);

	const fetchPermissions = async () => {
		try {
			const response = await permissionService.getPermissions({
				page: meta.current_page,
				per_page: meta.per_page,
				search: debouncedSearch,
				sort: sortConfig.key || undefined,
				order: sortConfig.order || undefined,
				roles: roleFilters.length > 0 ? roleFilters : undefined,
			});
			setPermissions(response.data);
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

	const handlePermissionUpdate = (updated: Permission) => {
		setSelectedPermission(updated);
		fetchPermissions();
	};

	const { allSelected, isSelected, toggleAll, toggleOne } = useTableSelection(
		permissions.map((permission) => permission.id),
	);

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex items-center p-4 md:p-6 lg:p-8'>
				<div className='flex flex-col gap-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Quản lý quyền</h2>
					<p className='text-muted-foreground'>Danh sách tất cả quyền trong hệ thống.</p>
				</div>
			</div>
			<div className='flex flex-col gap-4 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
					<div className='flex flex-1 items-center gap-2 w-full'>
						<Input
							placeholder='Tìm kiếm...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-8 w-full sm:max-w-sm flex-1 min-w-0'
						/>
					</div>
					<div className='flex items-center gap-2'>
						<Combobox
							multiple
							value={roleFilters}
							onValueChange={setRoleFilters}
							options={roleOptions}
							placeholder='Lọc theo vai trò'
							searchPlaceholder='Tìm vai trò...'
							triggerClassName='h-8 w-full sm:max-w-sm flex-1
							min-w-[250px]'
						/>
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
								<TableHead className='w-[80px]'>
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
										Permission
										{getSortIcon("name")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("description")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Mô tả
										{getSortIcon("description")}
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant='ghost'
										onClick={() => handleSort("roles")}
										className='-ml-4 h-8 hover:bg-muted-foreground/10'>
										Roles
										{getSortIcon("roles")}
									</Button>
								</TableHead>
								<TableHead className='w-[50px]'></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{permissions.map((permission) => (
								<TableRow key={permission.id}>
									<TableCell>
										<Checkbox
											aria-label={`Select permission ${permission.id}`}
											checked={isSelected(permission.id)}
											onCheckedChange={(checked) =>
												toggleOne(permission.id, checked === true)
											}
										/>
									</TableCell>
									<TableCell className='font-medium'>{permission.id}</TableCell>
									<TableCell>{permission.name}</TableCell>
									<TableCell>{permission.description}</TableCell>
									<TableCell>
										<CompactBadgeList
											items={permission.roles.map((role) => ({
												key: role.id,
												label: role.label,
											}))}
											maxVisibleItems={1}
											badgeClassName='border-primary-500/20 bg-primary-500/10 text-primary-700 hover:bg-primary-500/10'
											overflowBadgeClassName='border-primary-500/20 bg-primary-500/10 text-primary-700 hover:bg-primary-500/10'
										/>
									</TableCell>
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
													onClick={() => {
														setSelectedPermission(permission);
														setDetailOpen(true);
													}}>
													<Eye className='h-4 w-4' />
													Chi tiết
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
							{permissions.length === 0 && (
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
											Đang hiện {permissions.length} trên tổng {meta.total}{" "}
											dòng.
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

			<PermissionDetailModal
				permission={selectedPermission}
				open={detailOpen}
				onOpenChange={setDetailOpen}
				allRoles={allRoles}
				onUpdate={handlePermissionUpdate}
			/>
		</div>
	);
}

export default PermissionList;
