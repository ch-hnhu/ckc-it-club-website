import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Archive, ArrowLeft, Check, Loader2, MoreVertical, Plus, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import type { AuthUser } from "@/services/auth.service";
import { buildAvatar } from "@/lib/utils";
import { projectHubService } from "@/services/projecthub.service";
import type {
	ProjectDetail,
	ProjectMember,
	ProjectTask,
	UpdateTaskInput,
} from "@/types/projecthub.types";
import BoardColumn from "@/components/projecthub/BoardColumn";
import TaskDialog from "@/components/projecthub/TaskDialog";
import ManageMembersDialog from "@/components/projecthub/ManageMembersDialog";

interface OutletCtx {
	user: AuthUser | null;
	loadingUser: boolean;
}

type DragInfo = { taskId: number; fromColumnId: number; index: number };

const ProjectBoardPage: React.FC = () => {
	const { slug = "" } = useParams();
	const { user, loadingUser } = useOutletContext<OutletCtx>();
	const navigate = useNavigate();

	const [board, setBoard] = useState<ProjectDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<"forbidden" | "notfound" | "generic" | null>(null);

	const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
	const [showMembers, setShowMembers] = useState(false);
	const [addingColumn, setAddingColumn] = useState(false);
	const [columnName, setColumnName] = useState("");
	const [menuOpen, setMenuOpen] = useState(false);

	const draggingRef = useRef<DragInfo | null>(null);
	const [dropTarget, setDropTarget] = useState<{ columnId: number; index: number } | null>(null);

	const columnDraggingRef = useRef<number | null>(null);
	const [columnDragId, setColumnDragId] = useState<number | null>(null);
	const [columnDropTarget, setColumnDropTarget] = useState<number | null>(null);

	const currentUserId = user?.id ? Number(user.id) : null;
	const isOwner = !!board && currentUserId != null && board.created_by === currentUserId;
	const myRole = board?.members?.find((m) => m.id === currentUserId)?.pivot?.role;
	const canEdit = isOwner || (!!myRole && myRole !== "viewer");

	// Redirect khi đăng xuất
	useEffect(() => {
		if (!loadingUser && !user) {
			navigate(`/login?returnTo=${encodeURIComponent(`/du-an/${slug}`)}`, { replace: true });
		}
	}, [loadingUser, user, navigate, slug]);

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
		if (user) load();
	}, [user, load]);

	// ── Cập nhật state cục bộ ──────────────────────────────────────────────────
	const patchColumnTasks = (
		columnId: number,
		fn: (tasks: ProjectTask[]) => ProjectTask[],
	) =>
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

	// ── Tasks ──────────────────────────────────────────────────────────────────
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

	// ── Drag & drop ────────────────────────────────────────────────────────────
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
		// Không phải kéo task (vd: đang kéo cột) → để sự kiện nổi bọt lên handler của cột
		if (!drag) return;
		e.preventDefault();
		e.stopPropagation();
		setDropTarget(null);
		draggingRef.current = null;

		let insertIndex = index;
		if (drag.fromColumnId === columnId && drag.index < index) insertIndex = index - 1;
		// Bỏ qua nếu thả đúng vị trí cũ
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
			await projectHubService.moveTask(slug, drag.taskId, {
				column_id: columnId,
				position: insertIndex,
			});
		} catch {
			toast.error("Di chuyển thất bại");
			setBoard(prev);
		}
	};

	// ── Drag & drop cột ──────────────────────────────────────────────────────
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

	// Khi xóa thành viên: gỡ họ khỏi danh sách người phụ trách của mọi task (đã gỡ ở backend)
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

	// ── Board actions ──────────────────────────────────────────────────────────
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
				<Loader2 className='h-8 w-8 animate-spin' />
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
			<div className='neo-container neo-section flex flex-col items-center py-24 text-center'>
				<h1 className='mb-2 text-2xl font-bold'>{msg}</h1>
				<Link to='/du-an' className='neo-btn neo-btn-primary mt-4'>
					<ArrowLeft className='h-5 w-5' /> Về danh sách dự án
				</Link>
			</div>
		);
	}

	const members = board.members ?? [];

	return (
		<div className='flex flex-1 flex-col px-4 pt-[68px] md:px-6'>
			{/* Header */}
			<div className='sticky top-[68px] z-10 -mx-4 flex flex-wrap items-center gap-3 border-b-2 border-black/10 bg-white px-4 py-3 md:-mx-6 md:px-6'>
				<Link
					to='/du-an'
					className='rounded-lg border-2 border-black bg-white p-2 shadow-[2px_2px_0_#111] hover:translate-y-0.5'
					aria-label='Quay lại'>
					<ArrowLeft className='h-5 w-5' />
				</Link>
				<span
					className='h-7 w-7 shrink-0 rounded-lg border-2 border-black'
					style={{ backgroundColor: board.color || "#a3e635" }}
				/>
				<div className='min-w-0'>
					<h1 className='truncate text-2xl font-extrabold'>{board.name}</h1>
					{board.description && (
						<p className='truncate text-sm text-gray-600'>{board.description}</p>
					)}
				</div>

				{/* Members */}
				<button
					onClick={() => setShowMembers(true)}
					title='Quản lý thành viên'
					className='ml-auto flex items-center gap-2 rounded-lg border-2 border-black bg-white px-2 py-1 shadow-[2px_2px_0_#111] hover:translate-y-0.5'>
					{members.length > 0 && (
						<div className='flex -space-x-2'>
							{members.slice(0, 5).map((m) => (
								<img
									key={m.id}
									src={buildAvatar(m.full_name, m.avatar)}
									alt={m.full_name}
									title={m.full_name}
									className='h-7 w-7 rounded-full border-2 border-black object-cover'
								/>
							))}
						</div>
					)}
					{members.length > 5 && (
						<span className='text-xs font-bold'>+{members.length - 5}</span>
					)}
					<Users className='h-4 w-4' />
				</button>

				{/* Menu */}
				{canEdit && (
					<div className='relative'>
						<button
							onClick={() => setMenuOpen((o) => !o)}
							className='rounded-lg border-2 border-black bg-white p-2 shadow-[2px_2px_0_#111] hover:translate-y-0.5'
							aria-label='Tùy chọn dự án'>
							<MoreVertical className='h-5 w-5' />
						</button>
						{menuOpen && (
							<>
								<button
									className='fixed inset-0 z-10 cursor-default'
									onClick={() => setMenuOpen(false)}
									aria-label='Đóng menu'
								/>
								<div className='absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#111]'>
									<button
										onClick={() => {
											setMenuOpen(false);
											handleArchive();
										}}
										className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-gray-100'>
										<Archive className='h-4 w-4' />
										{board.is_archived ? "Bỏ lưu trữ" : "Lưu trữ"}
									</button>
									{isOwner && (
										<button
											onClick={() => {
												setMenuOpen(false);
												handleDeleteBoard();
											}}
											className='flex w-full items-center gap-2 border-t-2 border-black px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50'>
											<Trash2 className='h-4 w-4' /> Xóa dự án
										</button>
									)}
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{/* Board */}
			<div className='flex items-start gap-4 overflow-x-auto pb-6 pt-4'>
				{board.columns.map((column, index) => (
					<React.Fragment key={column.id}>
						{columnDropTarget === index && (
							<div className='w-1.5 shrink-0 self-stretch rounded-full bg-[var(--color-primary)]' />
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
					<div className='w-1.5 shrink-0 self-stretch rounded-full bg-[var(--color-primary)]' />
				)}

				{/* Add column */}
				{canEdit && (
					<div
						className='w-72 shrink-0'
						onDragOver={(e) => onColumnDragOver(board.columns.length, e)}
						onDrop={(e) => onColumnDrop(board.columns.length, e)}>
						{addingColumn ? (
							<div className='rounded-2xl border-2 border-black bg-gray-50 p-3 shadow-[4px_4px_0_#111]'>
								<input
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
									className='mb-2 w-full rounded-lg border-2 border-black px-2.5 py-2 text-sm font-bold outline-none'
								/>
								<div className='flex items-center gap-2'>
									<button
										onClick={handleAddColumn}
										className='flex items-center gap-1 rounded-lg border-2 border-black bg-[var(--color-primary)] px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_#111] hover:translate-y-0.5'>
										<Check className='h-4 w-4' /> Thêm
									</button>
									<button
										onClick={() => {
											setAddingColumn(false);
											setColumnName("");
										}}
										className='rounded-lg p-1.5 text-gray-500 hover:bg-gray-200'
										aria-label='Hủy'>
										<X className='h-4 w-4' />
									</button>
								</div>
							</div>
						) : (
							<button
								onClick={() => setAddingColumn(true)}
								className='flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-400 py-4 text-sm font-bold text-gray-600 hover:border-black hover:bg-gray-50'>
								<Plus className='h-5 w-5' /> Thêm cột
							</button>
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
