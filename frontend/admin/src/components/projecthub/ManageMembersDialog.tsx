import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { projectHubService } from "@/services/projecthub.service";
import type { AssignableUser, ProjectMember, ProjectMemberRole } from "@/types/projecthub.types";
import { MEMBER_ROLE_META, MEMBER_ROLE_ORDER, initials } from "./constants";

interface ManageMembersDialogProps {
	slug: string;
	members: ProjectMember[];
	canManage: boolean;
	creatorId: number;
	onClose: () => void;
	onMembersChange: (members: ProjectMember[]) => void;
	onMemberRemoved: (userId: number) => void;
}

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({
	slug,
	members,
	canManage,
	creatorId,
	onClose,
	onMembersChange,
	onMemberRemoved,
}) => {
	const [list, setList] = useState<ProjectMember[]>(members);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<AssignableUser[]>([]);
	const [searching, setSearching] = useState(false);
	const [busyId, setBusyId] = useState<number | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		const q = query.trim();
		if (q.length < 2) {
			setResults([]);
			setSearching(false);
			return;
		}
		setSearching(true);
		debounceRef.current = setTimeout(async () => {
			try {
				const res = await projectHubService.searchAssignableUsers(slug, q);
				setResults(res.data);
			} catch {
				setResults([]);
			} finally {
				setSearching(false);
			}
		}, 350);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, slug]);

	const sync = (next: ProjectMember[]) => {
		setList(next);
		onMembersChange(next);
	};

	const handleAdd = async (u: AssignableUser) => {
		setBusyId(u.id);
		try {
			const res = await projectHubService.addMember(slug, { user_id: u.id, role: "editor" });
			sync([...list, res.data]);
			setResults((r) => r.filter((x) => x.id !== u.id));
			setQuery("");
			toast.success("Đã thêm thành viên");
		} catch {
			toast.error("Thêm thành viên thất bại");
		} finally {
			setBusyId(null);
		}
	};

	const handleRole = async (userId: number, role: ProjectMemberRole) => {
		setBusyId(userId);
		const prev = list;
		sync(
			list.map((m) =>
				m.id === userId ? { ...m, pivot: { ...(m.pivot ?? { joined_at: null }), role } } : m,
			),
		);
		try {
			await projectHubService.updateMemberRole(slug, userId, role);
		} catch {
			toast.error("Đổi vai trò thất bại");
			sync(prev);
		} finally {
			setBusyId(null);
		}
	};

	const handleRemove = async (userId: number) => {
		if (!window.confirm("Xóa thành viên này khỏi board?")) return;
		setBusyId(userId);
		try {
			await projectHubService.removeMember(slug, userId);
			sync(list.filter((m) => m.id !== userId));
			onMemberRemoved(userId);
			toast.success("Đã xóa thành viên");
		} catch {
			toast.error("Xóa thành viên thất bại");
		} finally {
			setBusyId(null);
		}
	};

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Thành viên ({list.length})</DialogTitle>
				</DialogHeader>

				{/* Add member */}
				{canManage && (
					<div>
						<div className='relative'>
							<Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder='Tìm theo tên, email, MSSV...'
								className='pl-9'
							/>
							{searching && (
								<Loader2 className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground' />
							)}
						</div>

						{results.length > 0 && (
							<div className='mt-2 overflow-hidden rounded-md border'>
								{results.map((u) => (
									<button
										key={u.id}
										disabled={busyId === u.id}
										onClick={() => handleAdd(u)}
										className='flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent disabled:opacity-50'>
										<Avatar className='h-8 w-8'>
											<AvatarImage src={u.avatar ?? undefined} alt={u.full_name} />
											<AvatarFallback className='text-xs'>{initials(u.full_name)}</AvatarFallback>
										</Avatar>
										<div className='min-w-0 flex-1'>
											<p className='truncate text-sm font-medium'>{u.full_name}</p>
											<p className='truncate text-xs text-muted-foreground'>
												{u.student_code || u.email}
											</p>
										</div>
										<UserPlus className='h-4 w-4 shrink-0 text-muted-foreground' />
									</button>
								))}
							</div>
						)}
						{query.trim().length >= 2 && !searching && results.length === 0 && (
							<p className='mt-2 text-xs text-muted-foreground'>Không tìm thấy người dùng phù hợp.</p>
						)}
					</div>
				)}

				{/* Member list */}
				<ul className='space-y-2'>
					{list.map((m) => {
						const isCreator = m.id === creatorId;
						const role = m.pivot?.role ?? "editor";
						return (
							<li key={m.id} className='flex items-center gap-3 rounded-md border px-3 py-2'>
								<Avatar className='h-9 w-9'>
									<AvatarImage src={m.avatar ?? undefined} alt={m.full_name} />
									<AvatarFallback className='text-xs'>{initials(m.full_name)}</AvatarFallback>
								</Avatar>
								<div className='min-w-0 flex-1'>
									<p className='truncate text-sm font-medium'>{m.full_name}</p>
									{m.username && (
										<p className='truncate text-xs text-muted-foreground'>@{m.username}</p>
									)}
								</div>

								{canManage && !isCreator ? (
									<Select
										value={role}
										disabled={busyId === m.id}
										onValueChange={(v) => handleRole(m.id, v as ProjectMemberRole)}>
										<SelectTrigger size='sm' className='w-32'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{MEMBER_ROLE_ORDER.map((r) => (
												<SelectItem key={r} value={r}>
													{MEMBER_ROLE_META[r].label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<span
										className={cn(
											"rounded-full px-2.5 py-1 text-[11px] font-medium",
											isCreator ? "bg-primary/15 text-primary" : MEMBER_ROLE_META[role].className,
										)}>
										{isCreator ? "Chủ board" : MEMBER_ROLE_META[role].label}
									</span>
								)}

								{canManage && !isCreator && (
									<Button
										size='icon'
										variant='ghost'
										className='h-8 w-8 text-destructive'
										disabled={busyId === m.id}
										onClick={() => handleRemove(m.id)}>
										<Trash2 className='h-4 w-4' />
									</Button>
								)}
							</li>
						);
					})}
				</ul>
			</DialogContent>
		</Dialog>
	);
};

export default ManageMembersDialog;
