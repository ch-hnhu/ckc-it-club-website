import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types/permission.type";

const roleBadgeClass = "rounded-full px-3 py-1 text-xs border-primary-500/20 bg-primary-500/10 text-primary-700 hover:bg-primary-500/10";

interface PermissionDetailModalProps {
	permission: Permission | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function PermissionDetailModal({ permission, open, onOpenChange }: PermissionDetailModalProps) {
	if (!permission) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Chi tiết quyền</DialogTitle>
				</DialogHeader>

				<div className='flex flex-col gap-4'>
					<div className='grid grid-cols-[120px_1fr] gap-y-3 text-sm'>
						<span className='text-muted-foreground'>ID</span>
						<span className='font-medium'>{permission.id}</span>

						<span className='text-muted-foreground'>Tên quyền</span>
						<span className='font-mono font-medium'>{permission.name}</span>

						<span className='text-muted-foreground'>Mô tả</span>
						<span>{permission.description || <span className='text-muted-foreground italic'>Không có mô tả</span>}</span>
					</div>

					<div className='flex flex-col gap-2'>
						<span className='text-sm text-muted-foreground'>Vai trò sở hữu quyền này</span>
						<div className='rounded-md border bg-muted/30 p-3 min-h-[60px] flex flex-wrap gap-1.5 content-start'>
							{permission.roles.length > 0 ? (
								permission.roles.map((role) => (
									<Badge
										key={role.id}
										variant='outline'
										className={cn(roleBadgeClass)}>
										{role.label}
									</Badge>
								))
							) : (
								<span className='text-sm text-muted-foreground italic self-center'>
									Chưa có vai trò nào
								</span>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default PermissionDetailModal;
