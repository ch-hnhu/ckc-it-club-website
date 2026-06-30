import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	pointerWithin,
	rectIntersection,
	useSensor,
	useSensors,
	type CollisionDetection,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	horizontalListSortingStrategy,
	sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
	Archive,
	ArrowLeft,
	CalendarDays,
	Check,
	GraduationCap,
	Link2,
	Loader2,
	MoreVertical,
	Plus,
	Trash2,
	Users,
	X,
} from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import type {
	ChecklistItem,
	ProjectDetail,
	ProjectMember,
	ProjectTask,
	UpdateTaskInput,
} from "@/types/projecthub.types";
import BoardColumn from "@/components/projecthub/BoardColumn";
import { TaskCardPreview } from "@/components/projecthub/TaskCard";
import { columnDndId, taskDndId } from "@/components/projecthub/dnd";
import TaskDialog from "@/components/projecthub/TaskDialog";
import ManageMembersDialog from "@/components/projecthub/ManageMembersDialog";
import LinkBoardDialog from "@/components/projecthub/LinkBoardDialog";
import { initials } from "@/components/projecthub/constants";

type TaskDragOrigin = { taskId: number; columnId: number; index: number };
type ColumnDragOrigin = { columnId: number; index: number };
type ActiveDrag =
	| { type: "task"; task: ProjectTask; origin: TaskDragOrigin }
	| { type: "column"; column: ProjectDetail["columns"][number]; origin: ColumnDragOrigin };

const getTaskIdFromDndId = (id: string) =>
	id.startsWith("task-") ? Number(id.replace("task-", "")) : null;

const getColumnIdFromDndId = (id: string) =>
	/^column-\d+$/.test(id) ? Number(id.replace("column-", "")) : null;

const getColumnDropIdFromDndId = (id: string) =>
	id.startsWith("column-drop-") ? Number(id.replace("column-drop-", "")) : null;

const findTaskLocation = (columns: ProjectDetail["columns"], taskId: number) => {
	for (const column of columns) {
		const index = (column.tasks ?? []).findIndex((task) => task.id === taskId);
		if (index !== -1) {
			return { columnId: column.id, index, task: (column.tasks ?? [])[index] };
		}
	}
	return null;
};

const moveTaskInColumns = (
	columns: ProjectDetail["columns"],
	taskId: number,
	toColumnId: number,
	toIndex: number,
) => {
	const source = findTaskLocation(columns, taskId);
	if (!source) return { columns, moved: false };

	const nextColumns = columns.map((column) => ({
		...column,
		tasks: [...(column.tasks ?? [])],
	}));
	const fromColumn = nextColumns.find((column) => column.id === source.columnId);
	const toColumn = nextColumns.find((column) => column.id === toColumnId);
	if (!fromColumn || !toColumn) return { columns, moved: false };

	const [movedTask] = fromColumn.tasks.splice(source.index, 1);
	const boundedIndex = Math.max(0, Math.min(toIndex, toColumn.tasks.length));
	if (source.columnId === toColumnId && source.index === boundedIndex) {
		return { columns, moved: false };
	}

	toColumn.tasks.splice(boundedIndex, 0, { ...movedTask, column_id: toColumnId });
	return { columns: nextColumns, moved: true };
};

const ProjectBoardPage: React.FC = () => {
	const { slug = "" } = useParams();
	const { user } = useAuth();
	const navigate = useNavigate();

	const [board, setBoard] = useState<ProjectDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<"forbidden" | "notfound" | "generic" | null>(null);

	const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
	const [showMembers, setShowMembers] = useState(false);
	const [showLink, setShowLink] = useState(false);
	const [addingColumn, setAddingColumn] = useState(false);
	const [columnName, setColumnName] = useState("");

	const boardRef = useRef<ProjectDetail | null>(null);
	const boardBeforeDragRef = useRef<ProjectDetail | null>(null);
	const activeDragRef = useRef<ActiveDrag | null>(null);
	const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 6,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const collisionDetection: CollisionDetection = useCallback((args) => {
		const pointerIntersections = pointerWithin(args);
		return pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
	}, []);

	useEffect(() => {
		boardRef.current = board;
	}, [board]);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Việc cần làm", link: "/to-do-list" },
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

	const handleChecklistChange = (taskId: number, checklistItems: ChecklistItem[]) => {
		setBoard((prev) =>
			prev
				? {
						...prev,
						columns: prev.columns.map((c) => ({
							...c,
							tasks: (c.tasks ?? []).map((t) =>
								t.id === taskId ? { ...t, checklist_items: checklistItems } : t,
							),
						})),
					}
				: prev,
		);
		setSelectedTask((st) =>
			st && st.id === taskId ? { ...st, checklist_items: checklistItems } : st,
		);
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
			b
				? { ...b, columns: b.columns.map((c) => (c.id === columnId ? { ...c, name } : c)) }
				: b,
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

	// ── Drag & drop board ─────────────────────────────────────────────────────
	const resolveTaskTarget = useCallback(
		(overId: string, event?: DragOverEvent | DragEndEvent) => {
			const currentBoard = boardRef.current;
			if (!currentBoard) return null;

			const overTaskId = getTaskIdFromDndId(overId);
			if (overTaskId != null) {
				const location = findTaskLocation(currentBoard.columns, overTaskId);
				if (!location) return null;
				const isBelow =
					event?.active.rect.current.translated &&
					event.active.rect.current.translated.top >
						event.over!.rect.top + event.over!.rect.height / 2;
				return {
					columnId: location.columnId,
					index: location.index + (isBelow ? 1 : 0),
				};
			}

			const dropColumnId = getColumnDropIdFromDndId(overId);
			if (dropColumnId != null) {
				const column = currentBoard.columns.find((item) => item.id === dropColumnId);
				return column ? { columnId: dropColumnId, index: column.tasks?.length ?? 0 } : null;
			}

			const overColumnId = getColumnIdFromDndId(overId);
			if (overColumnId != null && Number.isFinite(overColumnId)) {
				const column = currentBoard.columns.find((item) => item.id === overColumnId);
				return column ? { columnId: overColumnId, index: column.tasks?.length ?? 0 } : null;
			}

			return null;
		},
		[],
	);

	const resolveColumnTargetIndex = useCallback((overId: string) => {
		const currentBoard = boardRef.current;
		if (!currentBoard) return null;

		const overColumnId = getColumnIdFromDndId(overId);
		const dropColumnId = getColumnDropIdFromDndId(overId);
		const overTaskId = getTaskIdFromDndId(overId);
		let targetColumnId = Number.isFinite(overColumnId) ? overColumnId : dropColumnId;

		if (targetColumnId == null && overTaskId != null) {
			targetColumnId = findTaskLocation(currentBoard.columns, overTaskId)?.columnId ?? null;
		}

		if (targetColumnId == null) return null;
		const targetIndex = currentBoard.columns.findIndex(
			(column) => column.id === targetColumnId,
		);
		return targetIndex === -1 ? null : targetIndex;
	}, []);

	const handleDragStart = (event: DragStartEvent) => {
		if (!canEdit || !boardRef.current) return;

		const data = event.active.data.current;
		boardBeforeDragRef.current = boardRef.current;

		if (data?.type === "task") {
			const task = data.task as ProjectTask;
			const location = findTaskLocation(boardRef.current.columns, task.id);
			if (!location) return;
			const nextDrag: ActiveDrag = {
				type: "task",
				task,
				origin: { taskId: task.id, columnId: location.columnId, index: location.index },
			};
			activeDragRef.current = nextDrag;
			setActiveDrag(nextDrag);
			return;
		}

		if (data?.type === "column") {
			const column = data.column as ProjectDetail["columns"][number];
			const index = boardRef.current.columns.findIndex((item) => item.id === column.id);
			if (index === -1) return;
			const nextDrag: ActiveDrag = {
				type: "column",
				column,
				origin: { columnId: column.id, index },
			};
			activeDragRef.current = nextDrag;
			setActiveDrag(nextDrag);
		}
	};

	const handleDragOver = (event: DragOverEvent) => {
		const drag = activeDragRef.current;
		if (!drag || !event.over) return;

		if (drag.type === "task") {
			if (String(event.over.id) === taskDndId(drag.task.id)) return;
			const target = resolveTaskTarget(String(event.over.id), event);
			if (!target) return;

			setBoard((currentBoard) => {
				if (!currentBoard) return currentBoard;
				const result = moveTaskInColumns(
					currentBoard.columns,
					drag.task.id,
					target.columnId,
					target.index,
				);
				if (!result.moved) return currentBoard;
				const nextBoard = { ...currentBoard, columns: result.columns };
				boardRef.current = nextBoard;
				return nextBoard;
			});
			return;
		}

		const targetIndex = resolveColumnTargetIndex(String(event.over.id));
		if (targetIndex == null) return;

		setBoard((currentBoard) => {
			if (!currentBoard) return currentBoard;
			const fromIndex = currentBoard.columns.findIndex(
				(column) => column.id === drag.column.id,
			);
			if (fromIndex === -1 || fromIndex === targetIndex) return currentBoard;
			const nextBoard = {
				...currentBoard,
				columns: arrayMove(currentBoard.columns, fromIndex, targetIndex),
			};
			boardRef.current = nextBoard;
			return nextBoard;
		});
	};

	const resetDragState = () => {
		activeDragRef.current = null;
		setActiveDrag(null);
		boardBeforeDragRef.current = null;
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const drag = activeDragRef.current;
		const previousBoard = boardBeforeDragRef.current;
		const currentBoard = boardRef.current;

		if (!drag || !previousBoard || !currentBoard || !event.over) {
			if (previousBoard) setBoard(previousBoard);
			resetDragState();
			return;
		}

		if (drag.type === "task") {
			const finalLocation = findTaskLocation(currentBoard.columns, drag.task.id);
			resetDragState();
			if (
				!finalLocation ||
				(finalLocation.columnId === drag.origin.columnId &&
					finalLocation.index === drag.origin.index)
			) {
				return;
			}

			try {
				await projectHubService.moveTask(slug, drag.task.id, {
					column_id: finalLocation.columnId,
					position: finalLocation.index,
				});
			} catch {
				toast.error("Di chuyển thất bại");
				setBoard(previousBoard);
				boardRef.current = previousBoard;
			}
			return;
		}

		const finalIndex = currentBoard.columns.findIndex((column) => column.id === drag.column.id);
		resetDragState();
		if (finalIndex === -1 || finalIndex === drag.origin.index) return;

		try {
			await projectHubService.reorderColumns(
				slug,
				currentBoard.columns.map((column) => column.id),
			);
		} catch {
			toast.error("Sắp xếp cột thất bại");
			setBoard(previousBoard);
			boardRef.current = previousBoard;
		}
	};

	const handleDragCancel = () => {
		if (boardBeforeDragRef.current) {
			setBoard(boardBeforeDragRef.current);
			boardRef.current = boardBeforeDragRef.current;
		}
		resetDragState();
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
			navigate("/to-do-list");
		} catch {
			toast.error("Thao tác thất bại");
		}
	};

	const handleUpdateLink = async (payload: {
		course_id: number | null;
		event_id: number | null;
	}) => {
		try {
			const res = await projectHubService.updateProject(slug, payload);
			setBoard((b) => (b ? { ...b, ...res.data } : b));
			toast.success("Đã cập nhật liên kết");
		} catch {
			toast.error("Cập nhật liên kết thất bại");
			throw new Error("update-link-failed");
		}
	};

	const handleDeleteBoard = async () => {
		if (!window.confirm("Xóa toàn bộ dự án này? Hành động không thể hoàn tác.")) return;
		try {
			await projectHubService.deleteProject(slug);
			toast.success("Đã xóa dự án");
			navigate("/to-do-list");
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
					<Link to='/to-do-list'>
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
					<Link to='/to-do-list' aria-label='Quay lại'>
						<ArrowLeft className='h-4 w-4' />
					</Link>
				</Button>
				<div className='min-w-0'>
					{(board.course || board.event) && (
						<div className='mt-1 flex flex-wrap items-center gap-1.5'>
							{board.course && (
								<Link to={`/courses/${board.course.slug}`}>
									<Badge
										variant='secondary'
										className='gap-1 hover:bg-secondary/80'>
										<GraduationCap className='h-3 w-3' />
										<span className='max-w-[12rem] truncate'>
											{board.course.title}
										</span>
									</Badge>
								</Link>
							)}
							{board.event && (
								<Link to={`/events/${board.event.id}`}>
									<Badge
										variant='secondary'
										className='gap-1 hover:bg-secondary/80'>
										<CalendarDays className='h-3 w-3' />
										<span className='max-w-[12rem] truncate'>
											{board.event.title}
										</span>
									</Badge>
								</Link>
							)}
						</div>
					)}
					<h1 className='truncate text-xl font-semibold tracking-tight'>{board.name}</h1>
					{board.description && (
						<p className='truncate text-sm text-muted-foreground'>
							{board.description}
						</p>
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
								<AvatarFallback className='text-[9px]'>
									{initials(m.full_name)}
								</AvatarFallback>
							</Avatar>
						))}
					</div>
					{members.length > 5 && (
						<span className='text-xs font-medium'>+{members.length - 5}</span>
					)}
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
							<DropdownMenuItem onClick={() => setShowLink(true)}>
								<Link2 className='h-4 w-4' /> Liên kết dự án
							</DropdownMenuItem>
							<DropdownMenuItem onClick={handleArchive}>
								<Archive className='h-4 w-4' />
								{board.is_archived ? "Bỏ lưu trữ" : "Lưu trữ"}
							</DropdownMenuItem>
							{isOwner && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										variant='destructive'
										onClick={handleDeleteBoard}>
										<Trash2 className='h-4 w-4' /> Xóa dự án
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* Board */}
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragEnd={handleDragEnd}
				onDragCancel={handleDragCancel}>
				<div className='flex min-w-0 flex-1 items-start gap-4 overflow-x-auto overflow-y-hidden pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
					<SortableContext
						items={board.columns.map((column) => columnDndId(column.id))}
						strategy={horizontalListSortingStrategy}>
						{board.columns.map((column, index) => (
							<BoardColumn
								key={column.id}
								column={column}
								index={index}
								canEdit={canEdit}
								isColumnDragging={
									activeDrag?.type === "column" &&
									activeDrag.column.id === column.id
								}
								onTaskClick={setSelectedTask}
								onAddTask={handleAddTask}
								onRenameColumn={handleRenameColumn}
								onDeleteColumn={handleDeleteColumn}
							/>
						))}
					</SortableContext>

					{/* Add column */}
					{canEdit && (
						<div className='w-72 shrink-0'>
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

				<DragOverlay
					dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
					{activeDrag?.type === "task" ? (
						<div className='w-72'>
							<TaskCardPreview task={activeDrag.task} isOverlay />
						</div>
					) : activeDrag?.type === "column" ? (
						<div className='w-72 rounded-lg border bg-muted/80 shadow-xl ring-1 ring-primary/20'>
							<div className='flex items-center gap-2 border-b px-2.5 py-2'>
								<MoreVertical className='h-4 w-4 text-muted-foreground' />
								<h3 className='truncate text-sm font-semibold'>
									{activeDrag.column.name}
								</h3>
								<Badge variant='secondary' className='shrink-0'>
									{activeDrag.column.tasks?.length ?? 0}
								</Badge>
							</div>
							<div className='space-y-2 p-2'>
								{(activeDrag.column.tasks ?? []).slice(0, 3).map((task) => (
									<TaskCardPreview key={task.id} task={task} />
								))}
							</div>
						</div>
					) : null}
				</DragOverlay>
			</DndContext>

			{selectedTask && (
				<TaskDialog
					task={selectedTask}
					members={members}
					canEdit={canEdit}
					slug={slug}
					onClose={() => setSelectedTask(null)}
					onSave={handleSaveTask}
					onDelete={handleDeleteTask}
					onChecklistChange={handleChecklistChange}
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

			{showLink && (
				<LinkBoardDialog
					courseId={board.course_id}
					eventId={board.event_id}
					onClose={() => setShowLink(false)}
					onSave={handleUpdateLink}
				/>
			)}
		</div>
	);
};

export default ProjectBoardPage;
