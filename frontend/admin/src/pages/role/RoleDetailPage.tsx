import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Hash, ShieldCheck, Users } from "lucide-react";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import roleService from "@/services/role.service";
import type { Role } from "@/types/role.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

	const filteredPermissions = useMemo(() => {
		if (!role?.permissions) return [];
		const q = permSearch.trim().toLowerCase();
		if (!q) return role.permissions;
		return role.permissions.filter(
			(p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
		);
	}, [role?.permissions, permSearch]);

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
					<CardHeader className='pb-4'>
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
							<Input
								placeholder='Tìm quyền...'
								value={permSearch}
								onChange={(e) => setPermSearch(e.target.value)}
								className='h-8 w-full sm:w-[220px]'
							/>
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
										className={cn(permBadgeClass)}>
										{perm.name}
									</Badge>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default RoleDetailPage;
