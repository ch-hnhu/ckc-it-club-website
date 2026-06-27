import React, { useEffect, useRef, useState } from "react";
import { Loader2, Search, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { cn, buildAvatar } from "@/lib/utils";
import { projectHubService } from "@/services/projecthub.service";
import type { AssignableUser, ProjectMember, ProjectMemberRole } from "@/types/projecthub.types";
import { MEMBER_ROLE_META, MEMBER_ROLE_ORDER } from "./constants";

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
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	// Tìm kiếm user (debounce 350ms)
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
		const next = list.map((m) =>
			m.id === userId ? { ...m, pivot: { ...(m.pivot ?? { joined_at: null }), role } } : m,
		);
		sync(next);
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
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onClick={onClose}>
			<div
				className='relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0_#111]'
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className='flex items-center justify-between border-b-2 border-black bg-[var(--color-primary)] px-5 py-3'>
					<h2 className='text-base font-bold text-black'>Thành viên ({list.length})</h2>
					<button onClick={onClose} className='rounded-md p-1 hover:bg-black/10' aria-label='Đóng'>
						<X className='h-5 w-5' />
					</button>
				</div>

				<div className='flex-1 overflow-y-auto p-5'>
					{/* Add member */}
					{canManage && (
						<div className='mb-4'>
							<div className='relative'>
								<Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
								<input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder='Tìm theo tên, email, MSSV...'
									className='w-full rounded-lg border-2 border-black py-2 pl-9 pr-3 text-sm outline-none'
								/>
								{searching && (
									<Loader2 className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400' />
								)}
							</div>

							{results.length > 0 && (
								<div className='mt-2 overflow-hidden rounded-xl border-2 border-black'>
									{results.map((u) => (
										<button
											key={u.id}
											disabled={busyId === u.id}
											onClick={() => handleAdd(u)}
											className='flex w-full items-center gap-2 border-b-2 border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50 disabled:opacity-50'>
											<img
												src={buildAvatar(u.full_name, u.avatar)}
												alt={u.full_name}
												className='h-8 w-8 rounded-full object-cover'
											/>
											<div className='min-w-0 flex-1'>
												<p className='truncate text-sm font-semibold'>{u.full_name}</p>
												<p className='truncate text-xs text-gray-500'>
													{u.student_code || u.email}
												</p>
											</div>
											<UserPlus className='h-4 w-4 shrink-0 text-gray-500' />
										</button>
									))}
								</div>
							)}
							{query.trim().length >= 2 && !searching && results.length === 0 && (
								<p className='mt-2 text-xs text-gray-500'>Không tìm thấy người dùng phù hợp.</p>
							)}
						</div>
					)}

					{/* Member list */}
					<ul className='space-y-2'>
						{list.map((m) => {
							const isCreator = m.id === creatorId;
							const role = m.pivot?.role ?? "editor";
							return (
								<li
									key={m.id}
									className='flex items-center gap-3 rounded-xl border-2 border-black px-3 py-2'>
									<img
										src={buildAvatar(m.full_name, m.avatar)}
										alt={m.full_name}
										className='h-9 w-9 rounded-full object-cover'
									/>
									<div className='min-w-0 flex-1'>
										<p className='truncate text-sm font-semibold'>{m.full_name}</p>
										{m.username && (
											<p className='truncate text-xs text-gray-500'>@{m.username}</p>
										)}
									</div>

									{canManage && !isCreator ? (
										<select
											value={role}
											disabled={busyId === m.id}
											onChange={(e) => handleRole(m.id, e.target.value as ProjectMemberRole)}
											className='rounded-lg border-2 border-black px-2 py-1 text-xs font-bold outline-none'>
											{MEMBER_ROLE_ORDER.map((r) => (
												<option key={r} value={r}>
													{MEMBER_ROLE_META[r].label}
												</option>
											))}
										</select>
									) : (
										<span
											className={cn(
												"rounded-full px-2.5 py-1 text-[11px] font-bold",
												isCreator
													? "bg-[var(--color-primary)] text-black"
													: MEMBER_ROLE_META[role].className,
											)}>
											{isCreator ? "Chủ board" : MEMBER_ROLE_META[role].label}
										</span>
									)}

									{canManage && !isCreator && (
										<button
											disabled={busyId === m.id}
											onClick={() => handleRemove(m.id)}
											className='rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50'
											aria-label='Xóa thành viên'>
											<Trash2 className='h-4 w-4' />
										</button>
									)}
								</li>
							);
						})}
					</ul>
				</div>
			</div>
		</div>
	);
};

export default ManageMembersDialog;
