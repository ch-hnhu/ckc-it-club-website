import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import permissionService from "@/services/permission.service";
import type { Permission } from "@/types/permission.type";

type RoleEntry = Permission["roles"][number];
type RoleInfo = { id: number; value: string; label: string };

interface PermissionDetailModalProps {
	permission: Permission | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	allRoles: RoleInfo[];
	onUpdate?: (updated: Permission) => void;
}

const roleBadgeClass =
	"rounded-full px-3 py-1 text-xs border-primary-500/20 bg-primary-500/10 text-primary-700 hover:bg-primary-500/10";

function PermissionDetailModal({
	permission,
	open,
	onOpenChange,
	allRoles,
	onUpdate,
}: PermissionDetailModalProps) {
	const [localRoles, setLocalRoles] = useState<RoleEntry[]>([]);
	const [removingId, setRemovingId] = useState<number | null>(null);
	const [selectedToAdd, setSelectedToAdd] = useState("");
	const [adding, setAdding] = useState(false);

	useEffect(() => {
		if (permission) setLocalRoles(permission.roles);
	}, [permission]);

	if (!permission) return null;

	const availableOptions = allRoles
		.filter((r) => !localRoles.some((lr) => lr.id === r.id))
		.map((r) => ({ value: r.value, label: r.label }));

	const syncRoles = async (newRoles: RoleEntry[]) => {
		const previous = localRoles;
		setLocalRoles(newRoles);
		try {
			const res = await permissionService.syncPermissionRoles(
				permission.id,
				newRoles.map((r) => r.name),
			);
			onUpdate?.(res.data);
		} catch (error) {
			setLocalRoles(previous);
			const message =
				axios.isAxiosError(error) && error.response?.data?.message
					? error.response.data.message
					: "Không thể cập nhật vai trò.";
			toast.error(message, { position: "top-right" });
		}
	};

	const handleRemove = async (role: RoleEntry) => {
		setRemovingId(role.id);
		await syncRoles(localRoles.filter((r) => r.id !== role.id));
		setRemovingId(null);
	};

	const handleAdd = async () => {
		const roleInfo = allRoles.find((r) => r.value === selectedToAdd);
		if (!roleInfo) return;
		setAdding(true);
		await syncRoles([
			...localRoles,
			{ id: roleInfo.id, name: roleInfo.value, label: roleInfo.label },
		]);
		setSelectedToAdd("");
		setAdding(false);
	};

	const isBusy = removingId !== null || adding;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Chi tiết quyền</DialogTitle>
				</DialogHeader>

				<div className='flex flex-col gap-4'>
					{/* Thông tin cơ bản */}
					<div className='grid grid-cols-[110px_1fr] gap-y-3 text-sm'>
						<span className='text-muted-foreground'>ID</span>
						<span className='font-medium'>{permission.id}</span>

						<span className='text-muted-foreground'>Tên quyền</span>
						<span className='font-mono font-medium break-all'>{permission.name}</span>

						<span className='text-muted-foreground'>Mô tả</span>
						<span>
							{permission.description || (
								<span className='text-muted-foreground italic'>Không có mô tả</span>
							)}
						</span>
					</div>

					{/* Panel vai trò */}
					<div className='flex flex-col gap-2'>
						<span className='text-sm text-muted-foreground'>
							Vai trò sở hữu quyền này
						</span>

						<div className='rounded-md border bg-muted/30 p-3 min-h-[56px] flex flex-wrap gap-1.5 content-start'>
							{localRoles.length > 0 ? (
								localRoles.map((role) => {
									const isAdmin = role.name === "admin";
									return (
										<Badge
											key={role.id}
											variant='outline'
											className={cn(roleBadgeClass, "pr-1.5 gap-1 items-center")}>
											{role.label}
											<button
												type='button'
												onClick={() => handleRemove(role)}
												disabled={isBusy || isAdmin}
												title={isAdmin ? "Không thể xóa vai trò Quản trị viên" : undefined}
												className='ml-0.5 rounded-full p-0.5 hover:bg-primary/10 hover:cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors'>
												{removingId === role.id ? (
													<Loader2 className='h-3 w-3 animate-spin' />
												) : (
													<X className='h-3 w-3' />
												)}
											</button>
										</Badge>
									);
								})
							) : (
								<span className='text-sm text-muted-foreground italic self-center'>
									Chưa có vai trò nào
								</span>
							)}
						</div>

						{/* Thêm vai trò */}
						<div className='flex gap-2'>
							<Combobox
								value={selectedToAdd}
								onValueChange={setSelectedToAdd}
								options={availableOptions}
								placeholder='Thêm vai trò...'
								searchPlaceholder='Tìm vai trò...'
								triggerClassName='h-8 flex-1'
								disabled={isBusy}
								emptyText={
									allRoles.length === 0
										? "Đang tải danh sách vai trò..."
										: "Tất cả vai trò đã được gán"
								}
							/>
							<Button
								type='button'
								size='sm'
								className='h-8 shrink-0'
								onClick={handleAdd}
								disabled={!selectedToAdd || isBusy}>
								{adding ? (
									<Loader2 className='h-4 w-4 animate-spin' />
								) : (
									<Plus className='h-4 w-4' />
								)}
								Thêm
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default PermissionDetailModal;
