import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, Check, Loader2, MoreVertical, Plus, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { projectHubService } from "@/services/projecthub.service";
import type { ProjectDetail, ProjectMember, ProjectTask, UpdateTaskInput } from "@/types/projecthub.types";
import BoardColumn from "@/components/projecthub/BoardColumn";
import TaskDialog from "@/components/projecthub/TaskDialog";
import ManageMembersDialog from "@/components/projecthub/ManageMembersDialog";
import { initials } from "@/components/projecthub/constants";

type DragInfo = { taskId: number; fromColumnId: number; index: number };

const ProjectBoardPage: React.FC = () => {
	const { slug = "" } = useParams();
	const { user } = useAuth();
	const navigate = useNavigate();

	const [board, setBoard] = useState<ProjectDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<"forbidden" | "notfound" | "generic" | null>(null);

	const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
	const [showMembers, setShowMembers] = useState(false);
	const [addingColumn, setAddingColumn] = useState(false);
	const [columnName, setColumnName] = useState("");

	const draggingRef = useRef<DragInfo | null>(null);
	const [dropTarget, setDropTarget] = useState<{ columnId: number; index: number } | null>(null);
	const columnDraggingRef = useRef<number | null>(null);
	const [columnDragId, setColumnDragId] = useState<number | null>(null);
	const [columnDropTarget, setColumnDropTarget] = useState<number | null>(null);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "ProjectHub", link: "/du-an" },
		{ title: board?.name ?? "Đang tải..." },
	]);

	const currentUserId = user?.id ?? null;
	const isOwner = !!board && currentUserId != null && board.created_by === currentUserId;
	const myRole = board?.members?.find((m) => m.id === currentUserId)?.pivot?.role;
	const canEdit = isOwner || (!!myRole && myRole !== "viewer");

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await projectHubService.getProject(slug);
			setBoard(res.data);
		} catch (e) {
			const status = e instanceof AxiosError ? e.response?.status : undefined;
			setError(status === 403 ? "forbidden" : status === 404 ? "notfound" : "generic");
		} finally {
			setLoading(false);
		}
	}, [slug]);

	useEffect(() => {
		load();
	}, [load]);

	const patchColumnTasks = (columnId: number, fn: (tasks: ProjectTask[]) => ProjectTask[]) =>
		setBoard((prev) =>
			prev
				? {
						...prev,
						columns: prev.columns.map((c) =>
							c.id === columnId ? { ...c, tasks: fn(c.tasks ?? []) } : c,
						),
				  }
				: prev,
		);

	// ── Tasks ────────────────────────────────────────────────────────────────
	const handleAddTask = async (columnId: number, title: string) => {
		try {
			const res = await projectHubService.createTask(slug, { column_id: columnId, title });
			patchColumnTasks(columnId, (tasks) => [...tasks, res.data]);
		} catch {
			toast.error("Thêm công việc thất bại");
		}
	};

	const handleSaveTask = async (taskId: number, body: UpdateTaskInput) => {
		try {
			const res = await projectHubService.updateTask(slug, taskId, body);
			setBoard((prev) =>
				prev
					? {
							...prev,
							columns: prev.columns.map((c) => ({
								...c,
								tasks: (c.tasks ?? []).map((t) => (t.id === taskId ? res.data : t)),
							})),
					  }
					: prev,
			);
			toast.success("Đã lưu công việc");
		} catch {
			toast.error("Lưu công việc thất bại");
		}
	};

	const handleDeleteTask = async (taskId: number) => {
		if (!window.confirm("Xóa công việc này?")) return;
		const prev = board;
		setBoard((b) =>
			b
				? {
						...b,
						columns: b.columns.map((c) => ({
							...c,
							tasks: (c.tasks ?? []).filter((t) => t.id !== taskId),
						})),
				  }
				: b,
		);
		setSelectedTask(null);
		try {
			await projectHubService.deleteTask(slug, taskId);
			toast.success("Đã xóa công việc");
		} catch {
			toast.error("Xóa thất bại");
			setBoard(prev);
		}
	};

	// ── Columns ──────────────────────────────────────────────────────────────
	const handleAddColumn = async () => {
		const name = columnName.trim();
		if (!name) return;
		try {
			const res = await projectHubService.createColumn(slug, { name });
			setBoard((prev) =>
				prev ? { ...prev, columns: [...prev.columns, { ...res.data, tasks: [] }] } : prev,
			);
			setColumnName("");
			setAddingColumn(false);
		} catch {
			toast.error("Thêm cột thất bại");
		}
	};

	const handleRenameColumn = async (columnId: number, name: string) => {
		const prev = board;
		setBoard((b) =>
			b ? { ...b, columns: b.columns.map((c) => (c.id === columnId ? { ...c, name } : c)) } : b,
		);
		try {
			await projectHubService.updateColumn(slug, columnId, { name });
		} catch {
			toast.error("Đổi tên cột thất bại");
			setBoard(prev);
		}
	};

	const handleDeleteColumn = async (columnId: number) => {
		if (!window.confirm("Xóa cột này và toàn bộ công việc bên trong?")) return;
		const prev = board;
		setBoard((b) => (b ? { ...b, columns: b.columns.filter((c) => c.id !== columnId) } : b));
		try {
			await projectHubService.deleteColumn(slug, columnId);
			toast.success("Đã xóa cột");
		} catch {
			toast.error("Xóa cột thất bại");
			setBoard(prev);
		}
	};

	// ── Drag & drop task ───────────────────────────────────────────────────────
	const onTaskDragStart = (task: ProjectTask, columnId: number, index: number) => {
		draggingRef.current = { taskId: task.id, fromColumnId: columnId, index };
	};
	const onTaskDragEnd = () => {
		draggingRef.current = null;
		setDropTarget(null);
	};
	const onTaskDragOver = (columnId: number, index: number, e: React.DragEvent) => {
		if (!draggingRef.current) return;
		e.preventDefault();
		setDropTarget((cur) =>
			cur && cur.columnId === columnId && cur.index === index ? cur : { columnId, index },
		);
	};
	const onTaskDrop = async (columnId: number, index: number, e: React.DragEvent) => {
		const drag = draggingRef.current;
		if (!drag) return; // đang kéo cột → để nổi bọt lên handler cột
		e.preventDefault();
		e.stopPropagation();
		setDropTarget(null);
		draggingRef.current = null;

		let insertIndex = index;
		if (drag.fromColumnId === columnId && drag.index < index) insertIndex = index - 1;
		if (drag.fromColumnId === columnId && insertIndex === drag.index) return;

		const prev = board;
		setBoard((b) => {
			if (!b) return b;
			const cols = b.columns.map((c) => ({ ...c, tasks: [...(c.tasks ?? [])] }));
			const from = cols.find((c) => c.id === drag.fromColumnId);
			const to = cols.find((c) => c.id === columnId);
			if (!from || !to) return b;
			const ti = from.tasks.findIndex((t) => t.id === drag.taskId);
			if (ti === -1) return b;
			const [moved] = from.tasks.splice(ti, 1);
			moved.column_id = columnId;
			to.tasks.splice(insertIndex, 0, moved);
			return { ...b, columns: cols };
		});

		try {
			await projectHubService.moveTask(slug, drag.taskId, { column_id: columnId, position: insertIndex });
		} catch {
			toast.error("Di chuyển thất bại");
			setBoard(prev);
		}
	};

	// ── Drag & drop cột ────────────────────────────────────────────────────────
	const onColumnDragStart = (columnId: number) => {
		columnDraggingRef.current = columnId;
		setColumnDragId(columnId);
	};
	const onColumnDragEnd = () => {
		columnDraggingRef.current = null;
		setColumnDragId(null);
		setColumnDropTarget(null);
	};
	const onColumnDragOver = (index: number, e: React.DragEvent) => {
		if (columnDraggingRef.current == null) return;
		e.preventDefault();
		setColumnDropTarget((cur) => (cur === index ? cur : index));
	};
	const onColumnDrop = async (index: number, e: React.DragEvent) => {
		if (columnDraggingRef.current == null) return;
		e.preventDefault();
		const dragId = columnDraggingRef.current;
		setColumnDropTarget(null);
		columnDraggingRef.current = null;
		setColumnDragId(null);
		if (!board) return;

		const fromIndex = board.columns.findIndex((c) => c.id === dragId);
		if (fromIndex === -1) return;
		let insertIndex = index;
		if (fromIndex < index) insertIndex = index - 1;
		if (insertIndex === fromIndex) return;

		const prev = board;
		const newCols = [...board.columns];
		const [moved] = newCols.splice(fromIndex, 1);
		newCols.splice(insertIndex, 0, moved);
		setBoard({ ...board, columns: newCols });

		try {
			await projectHubService.reorderColumns(slug, newCols.map((c) => c.id));
		} catch {
			toast.error("Sắp xếp cột thất bại");
			setBoard(prev);
		}
	};

	// ── Members ────────────────────────────────────────────────────────────────
	const handleMembersChange = (newMembers: ProjectMember[]) =>
		setBoard((b) => (b ? { ...b, members: newMembers } : b));

	const handleMemberRemoved = (userId: number) =>
		setBoard((b) =>
			b
				? {
						...b,
						columns: b.columns.map((c) => ({
							...c,
							tasks: (c.tasks ?? []).map((t) => ({
								...t,
								assignees: (t.assignees ?? []).filter((a) => a.id !== userId),
							})),
						})),
				  }
				: b,
		);

	// ── Board actions ────────────────────────────────────────────────────────
	const handleArchive = async () => {
		try {
			await projectHubService.archiveProject(slug);
			toast.success("Đã cập nhật trạng thái lưu trữ");
			navigate("/du-an");
		} catch {
			toast.error("Thao tác thất bại");
		}
	};

	const handleDeleteBoard = async () => {
		if (!window.confirm("Xóa toàn bộ dự án này? Hành động không thể hoàn tác.")) return;
		try {
			await projectHubService.deleteProject(slug);
			toast.success("Đã xóa dự án");
			navigate("/du-an");
		} catch {
			toast.error("Xóa dự án thất bại");
		}
	};

	// ── Render ───────────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className='flex flex-1 items-center justify-center py-32'>
				<Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
			</div>
		);
	}

	if (error || !board) {
		const msg =
			error === "forbidden"
				? "Bạn không có quyền truy cập dự án này."
				: error === "notfound"
				? "Không tìm thấy dự án."
				: "Đã có lỗi xảy ra.";
		return (
			<div className='flex flex-col items-center py-24 text-center'>
				<h1 className='mb-4 text-xl font-semibold'>{msg}</h1>
				<Button asChild>
					<Link to='/du-an'>
						<ArrowLeft className='mr-1.5 h-4 w-4' /> Về danh sách dự án
					</Link>
				</Button>
			</div>
		);
	}

	const members = board.members ?? [];

	return (
		<div className='flex h-full flex-col p-4 md:p-6'>
			{/* Header */}
			<div className='mb-5 flex flex-wrap items-center gap-3'>
				<Button variant='outline' size='icon' asChild>
					<Link to='/du-an' aria-label='Quay lại'>
						<ArrowLeft className='h-4 w-4' />
					</Link>
				</Button>
				<span
					className='h-7 w-7 shrink-0 rounded-md'
					style={{ backgroundColor: board.color || "var(--primary)" }}
				/>
				<div className='min-w-0'>
					<h1 className='truncate text-xl font-semibold tracking-tight'>{board.name}</h1>
					{board.description && (
						<p className='truncate text-sm text-muted-foreground'>{board.description}</p>
					)}
				</div>

				<Button
					variant='outline'
					className='ml-auto h-9 gap-2'
					onClick={() => setShowMembers(true)}>
					<div className='flex -space-x-2'>
						{members.slice(0, 5).map((m) => (
							<Avatar key={m.id} className='h-6 w-6 border-2 border-background'>
								<AvatarImage src={m.avatar ?? undefined} alt={m.full_name} />
								<AvatarFallback className='text-[9px]'>{initials(m.full_name)}</AvatarFallback>
							</Avatar>
						))}
					</div>
					{members.length > 5 && <span className='text-xs font-medium'>+{members.length - 5}</span>}
					<Users className='h-4 w-4' />
				</Button>

				{canEdit && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' size='icon'>
								<MoreVertical className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem onClick={handleArchive}>
								<Archive className='mr-2 h-4 w-4' />
								{board.is_archived ? "Bỏ lưu trữ" : "Lưu trữ"}
							</DropdownMenuItem>
							{isOwner && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem variant='destructive' onClick={handleDeleteBoard}>
										<Trash2 className='mr-2 h-4 w-4' /> Xóa dự án
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* Board */}
			<div className='flex flex-1 items-start gap-4 overflow-x-auto pb-4'>
				{board.columns.map((column, index) => (
					<React.Fragment key={column.id}>
						{columnDropTarget === index && (
							<div className='w-1 shrink-0 self-stretch rounded-full bg-primary' />
						)}
						<BoardColumn
							column={column}
							index={index}
							canEdit={canEdit}
							dropTarget={dropTarget}
							isColumnDragging={columnDragId === column.id}
							onTaskDragStart={onTaskDragStart}
							onTaskDragEnd={onTaskDragEnd}
							onTaskDragOver={onTaskDragOver}
							onTaskDrop={onTaskDrop}
							onTaskClick={setSelectedTask}
							onAddTask={handleAddTask}
							onRenameColumn={handleRenameColumn}
							onDeleteColumn={handleDeleteColumn}
							onColumnDragStart={onColumnDragStart}
							onColumnDragEnd={onColumnDragEnd}
							onColumnDragOver={onColumnDragOver}
							onColumnDrop={onColumnDrop}
						/>
					</React.Fragment>
				))}

				{columnDropTarget === board.columns.length && (
					<div className='w-1 shrink-0 self-stretch rounded-full bg-primary' />
				)}

				{/* Add column */}
				{canEdit && (
					<div
						className='w-72 shrink-0'
						onDragOver={(e) => onColumnDragOver(board.columns.length, e)}
						onDrop={(e) => onColumnDrop(board.columns.length, e)}>
						{addingColumn ? (
							<div className='rounded-lg border bg-muted/40 p-2'>
								<Input
									autoFocus
									value={columnName}
									onChange={(e) => setColumnName(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleAddColumn();
										if (e.key === "Escape") {
											setAddingColumn(false);
											setColumnName("");
										}
									}}
									placeholder='Tên cột...'
									className='mb-2 h-8 text-sm font-medium'
								/>
								<div className='flex items-center gap-2'>
									<Button size='sm' onClick={handleAddColumn}>
										<Check className='mr-1 h-4 w-4' /> Thêm
									</Button>
									<Button
										size='icon'
										variant='ghost'
										className='h-8 w-8'
										onClick={() => {
											setAddingColumn(false);
											setColumnName("");
										}}>
										<X className='h-4 w-4' />
									</Button>
								</div>
							</div>
						) : (
							<Button
								variant='outline'
								className='w-full justify-center border-dashed text-muted-foreground'
								onClick={() => setAddingColumn(true)}>
								<Plus className='mr-1.5 h-4 w-4' /> Thêm cột
							</Button>
						)}
					</div>
				)}
			</div>

			{selectedTask && (
				<TaskDialog
					task={selectedTask}
					members={members}
					canEdit={canEdit}
					onClose={() => setSelectedTask(null)}
					onSave={handleSaveTask}
					onDelete={handleDeleteTask}
				/>
			)}

			{showMembers && currentUserId != null && (
				<ManageMembersDialog
					slug={slug}
					members={members}
					canManage={isOwner}
					creatorId={board.created_by}
					onClose={() => setShowMembers(false)}
					onMembersChange={handleMembersChange}
					onMemberRemoved={handleMemberRemoved}
				/>
			)}
		</div>
	);
};

export default ProjectBoardPage;
