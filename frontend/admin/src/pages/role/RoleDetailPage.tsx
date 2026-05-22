import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Hash, Loader2, Plus, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import permissionService from "@/services/permission.service";
import roleService from "@/services/role.service";
import type { Permission } from "@/types/permission.type";
import type { Role } from "@/types/role.type";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const permBadgeClass =
	"rounded-full px-3 py-1 text-xs border-primary-500/20 bg-primary-500/10 text-primary-700 hover:bg-primary-500/10 cursor-default";

function InfoRow({
	icon,
	label,
	value,
}: {
	icon?: React.ReactNode;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className='flex flex-col gap-1'>
			<p className='flex items-center gap-1.5 text-sm font-medium text-muted-foreground'>
				{icon}
				{label}
			</p>
			<div className='text-sm font-semibold break-words'>{value}</div>
		</div>
	);
}

function RoleDetailPage() {
	const { id } = useParams<{ id: string }>();
	const [role, setRole] = useState<Role | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [permSearch, setPermSearch] = useState("");
	const [addPermissionOpen, setAddPermissionOpen] = useState(false);
	const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
	const [permissionLoading, setPermissionLoading] = useState(false);
	const [permissionsLoaded, setPermissionsLoaded] = useState(false);
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [addingPermission, setAddingPermission] = useState(false);
	const [removingPermissionId, setRemovingPermissionId] = useState<number | null>(null);
	const [permissionToRemove, setPermissionToRemove] = useState<
		NonNullable<Role["permissions"]>[number] | null
	>(null);

	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Quản lý vai trò", link: "/roles" },
			{ title: role?.label ?? "Chi tiết vai trò" },
		],
		[role?.label],
	);

	useBreadcrumb(breadcrumb);

	useEffect(() => {
		if (!id) return;
		let mounted = true;

		const fetchRole = async () => {
			setLoading(true);
			try {
				const response = await roleService.getRole(id);
				if (mounted) {
					setRole(response.data);
					setError(null);
				}
			} catch {
				if (mounted) setError("Không thể tải thông tin vai trò.");
			} finally {
				if (mounted) setLoading(false);
			}
		};

		void fetchRole();
		return () => {
			mounted = false;
		};
	}, [id]);

	useEffect(() => {
		if (!addPermissionOpen || permissionsLoaded) return;
		let mounted = true;

		const fetchPermissions = async () => {
			setPermissionLoading(true);
			try {
				const response = await permissionService.getPermissions({
					per_page: 1000,
					sort: "name",
					order: "asc",
				});
				if (mounted) {
					setAllPermissions(response.data);
					setPermissionsLoaded(true);
				}
			} catch {
				if (mounted) {
					toast.error("Không thể tải danh sách quyền.", { position: "top-right" });
				}
			} finally {
				if (mounted) setPermissionLoading(false);
			}
		};

		void fetchPermissions();
		return () => {
			mounted = false;
		};
	}, [addPermissionOpen, permissionsLoaded]);

	const filteredPermissions = useMemo(() => {
		if (!role?.permissions) return [];
		const q = permSearch.trim().toLowerCase();
		if (!q) return role.permissions;
		return role.permissions.filter(
			(p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
		);
	}, [role?.permissions, permSearch]);

	const availablePermissionOptions = useMemo(() => {
		const assignedIds = new Set((role?.permissions ?? []).map((permission) => permission.id));
		return allPermissions
			.filter((permission) => !assignedIds.has(permission.id))
			.map((permission) => ({
				value: permission.name,
				label: permission.name,
				keywords: [permission.description],
			}));
	}, [allPermissions, role?.permissions]);

	const handleAddPermission = async () => {
		if (!role || selectedPermissions.length === 0) return;

		const permissionsToAdd = allPermissions.filter((permission) =>
			selectedPermissions.includes(permission.name),
		);
		if (permissionsToAdd.length === 0) return;

		const currentPermissions = role.permissions ?? [];
		const nextPermissions = [
			...currentPermissions,
			...permissionsToAdd.map((permission) => ({
				id: permission.id,
				name: permission.name,
				description: permission.description,
			})),
		];

		setAddingPermission(true);
		try {
			const response = await roleService.syncRolePermissions(
				role.id,
				nextPermissions.map((permission) => permission.name),
			);
			setRole((prev) =>
				prev
					? {
							...prev,
							permissions: response.data.permissions ?? nextPermissions,
						}
					: prev,
			);
			setSelectedPermissions([]);
			setAddPermissionOpen(false);
			toast.success("Đã thêm quyền vào vai trò.", { position: "top-right" });
		} catch (error) {
			const message =
				axios.isAxiosError(error) && error.response?.data?.message
					? error.response.data.message
					: "Không thể thêm quyền vào vai trò.";
			toast.error(message, { position: "top-right" });
		} finally {
			setAddingPermission(false);
		}
	};

	const handleRemovePermission = async (permissionId: number) => {
		if (!role) return;

		const currentPermissions = role.permissions ?? [];
		const nextPermissions = currentPermissions.filter(
			(permission) => permission.id !== permissionId,
		);

		setRemovingPermissionId(permissionId);
		try {
			const response = await roleService.syncRolePermissions(
				role.id,
				nextPermissions.map((permission) => permission.name),
			);
			setRole((prev) =>
				prev
					? {
							...prev,
							permissions: response.data.permissions ?? nextPermissions,
						}
					: prev,
			);
			toast.success("Đã xoá quyền khỏi vai trò.", { position: "top-right" });
		} catch (error) {
			const message =
				axios.isAxiosError(error) && error.response?.data?.message
					? error.response.data.message
					: "Không thể xoá quyền khỏi vai trò.";
			toast.error(message, { position: "top-right" });
		} finally {
			setRemovingPermissionId(null);
			setPermissionToRemove(null);
		}
	};

	if (loading) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-9 w-40' />
				<Skeleton className='h-48 w-full' />
				<Skeleton className='h-64 w-full' />
			</div>
		);
	}

	if (!role) {
		return (
			<div className='flex flex-col gap-4 p-4 md:p-6 lg:p-8'>
				<Button asChild variant='outline' className='w-fit'>
					<Link to='/roles'>
						<ArrowLeft className='h-4 w-4' />
						Quay lại
					</Link>
				</Button>
				<Card>
					<CardHeader>
						<CardTitle>Không tải được vai trò</CardTitle>
						<CardDescription>
							{error ?? "Vai trò này không tồn tại hoặc đã bị xóa."}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	const permissions = role.permissions ?? [];
	const isAdminRole = role.value === "admin";
	const isPermissionBusy = addingPermission || removingPermissionId !== null;
	const noAvailablePermission =
		permissionsLoaded && !permissionLoading && availablePermissionOptions.length === 0;

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to='/roles'>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Link>
			</Button>

			<div className='flex flex-col gap-6'>
				{/* Thông tin vai trò */}
				<Card className='shadow-sm'>
					<CardHeader className='pb-2'>
						<div className='flex items-start justify-between gap-2'>
							<div>
								<div className='mb-1 flex flex-wrap items-center gap-2'>
									<Badge variant='secondary' className='rounded-full text-xs'>
										#{role.id}
									</Badge>
									{role.is_system ? (
										<Badge
											variant='outline'
											className='rounded-full border-amber-500/30 bg-amber-500/10 text-amber-700 text-xs'>
											Hệ thống
										</Badge>
									) : null}
								</div>
								<CardTitle className='text-lg'>{role.label}</CardTitle>
								<CardDescription>Thông tin chi tiết vai trò</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className='grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-3'>
						<InfoRow
							icon={<Hash className='h-3.5 w-3.5' />}
							label='ID'
							value={role.id}
						/>
						<InfoRow
							icon={<ShieldCheck className='h-3.5 w-3.5' />}
							label='Tên vai trò'
							value={role.label}
						/>
						<InfoRow
							icon={<ShieldCheck className='h-3.5 w-3.5' />}
							label='Slug'
							value={
								<Badge
									variant='outline'
									className='rounded-full border-muted-foreground/20 bg-muted font-mono text-muted-foreground hover:bg-muted text-xs'>
									{role.value}
								</Badge>
							}
						/>
						<InfoRow
							icon={<ShieldCheck className='h-3.5 w-3.5' />}
							label='Vai trò hệ thống'
							value={role.is_system ? "Có" : "Không"}
						/>
						<InfoRow
							icon={<Users className='h-3.5 w-3.5' />}
							label='Số người dùng'
							value={role.total_users ?? 0}
						/>
						<InfoRow
							icon={<CalendarDays className='h-3.5 w-3.5' />}
							label='Ngày tạo'
							value={role.created_at ?? "--"}
						/>
					</CardContent>
				</Card>

				{/* Danh sách quyền hạn */}
				<Card className='shadow-sm'>
					<CardHeader className='pb-3'>
						<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
							<div>
								<CardTitle className='text-base'>
									Quyền hạn
									<span className='ml-2 text-sm font-normal text-muted-foreground'>
										({permissions.length})
									</span>
								</CardTitle>
								<CardDescription>
									Danh sách quyền hạn được gán cho vai trò này
								</CardDescription>
							</div>
							<div className='flex items-center gap-2'>
								<Input
									placeholder='Tìm quyền...'
									value={permSearch}
									onChange={(e) => setPermSearch(e.target.value)}
									className='h-8 w-full sm:w-[220px]'
								/>
								<Button
									size='sm'
									onClick={() => setAddPermissionOpen(true)}
									className='h-8 bg-foreground text-background hover:bg-foreground/90'>
									<Plus className='h-4 w-4' />
									Thêm
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{permissions.length === 0 ? (
							<p className='text-sm text-muted-foreground italic'>
								Vai trò này chưa có quyền hạn nào.
							</p>
						) : filteredPermissions.length === 0 ? (
							<p className='text-sm text-muted-foreground italic'>
								Không tìm thấy quyền phù hợp.
							</p>
						) : (
							<div className='flex flex-wrap gap-2'>
								{filteredPermissions.map((perm) => (
									<Badge
										key={perm.id}
										variant='outline'
										title={perm.description || perm.name}
										className={cn(permBadgeClass, "gap-1.5 pr-1.5")}>
										{perm.name}
										<button
											type='button'
											onClick={() => setPermissionToRemove(perm)}
											disabled={isPermissionBusy || isAdminRole}
											aria-label={`Xoá quyền ${perm.name}`}
											title={
												isAdminRole
													? "Không thể xoá quyền khỏi vai trò Quản trị viên"
													: undefined
											}
											className='rounded-full p-0.5 hover:bg-primary/10 hover:cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors'>
											{removingPermissionId === perm.id ? (
												<Loader2 className='h-3 w-3 animate-spin' />
											) : (
												<X className='h-3 w-3' />
											)}
										</button>
									</Badge>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={addPermissionOpen}
				onOpenChange={(open) => {
					setAddPermissionOpen(open);
					if (!open) setSelectedPermissions([]);
				}}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Thêm quyền vào vai trò</DialogTitle>
						<DialogDescription>
							Chỉ hiển thị các quyền chưa được gán cho {role.label}.
						</DialogDescription>
					</DialogHeader>

					<div className='flex flex-col gap-2'>
						<Combobox
							multiple
							value={selectedPermissions}
							onValueChange={setSelectedPermissions}
							options={availablePermissionOptions}
							placeholder={permissionLoading ? "Đang tải quyền..." : "Chọn quyền..."}
							searchPlaceholder='Tìm quyền...'
							emptyText={
								noAvailablePermission
									? "Vai trò đã có tất cả quyền"
									: "Không tìm thấy quyền phù hợp"
							}
							disabled={
								permissionLoading || isPermissionBusy || noAvailablePermission
							}
						/>
						{noAvailablePermission ? (
							<p className='text-sm text-muted-foreground italic'>
								Đã thêm toàn bộ quyền cho vai trò này.
							</p>
						) : null}
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => setAddPermissionOpen(false)}
							disabled={isPermissionBusy}>
							Hủy
						</Button>
						<Button
							type='button'
							onClick={handleAddPermission}
							disabled={selectedPermissions.length === 0 || isPermissionBusy}>
							{addingPermission ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								<Plus className='h-4 w-4' />
							)}
							Thêm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={Boolean(permissionToRemove)}
				onOpenChange={(open) => {
					if (!open) setPermissionToRemove(null);
				}}>
				<AlertDialogContent className='w-[calc(100vw-2rem)] max-w-[540px] overflow-hidden'>
					<AlertDialogHeader className='min-w-0'>
						<AlertDialogTitle>Xoá quyền khỏi vai trò?</AlertDialogTitle>
						<AlertDialogDescription className='min-w-0'>
							Bạn có chắc muốn xoá quyền{" "}
							<span className='font-medium text-foreground'>
								{permissionToRemove?.name}
							</span>{" "}
							khỏi vai trò{" "}
							<span className='font-medium text-foreground'>{role.label}</span>?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className='min-w-0'>
						<AlertDialogCancel disabled={isPermissionBusy}>Hủy</AlertDialogCancel>
						<Button
							type='button'
							variant='destructive'
							disabled={isPermissionBusy || !permissionToRemove}
							onClick={() => {
								const permission = permissionToRemove;
								if (permission) void handleRemovePermission(permission.id);
							}}>
							{removingPermissionId ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : null}
							Xóa
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default RoleDetailPage;
