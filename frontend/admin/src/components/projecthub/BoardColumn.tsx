import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectColumn, ProjectTask } from "@/types/projecthub.types";
import TaskCard from "./TaskCard";
import { columnDndId, columnDropDndId, taskDndId } from "./dnd";

interface BoardColumnProps {
	column: ProjectColumn;
	index: number;
	canEdit: boolean;
	isColumnDragging: boolean;
	onTaskClick: (task: ProjectTask) => void;
	onAddTask: (columnId: number, title: string) => void;
	onRenameColumn: (columnId: number, name: string) => void;
	onDeleteColumn: (columnId: number) => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
	column,
	index,
	canEdit,
	isColumnDragging,
	onTaskClick,
	onAddTask,
	onRenameColumn,
	onDeleteColumn,
}) => {
	const tasks = column.tasks ?? [];
	const [renaming, setRenaming] = useState(false);
	const [nameValue, setNameValue] = useState(column.name);
	const [adding, setAdding] = useState(false);
	const [title, setTitle] = useState("");
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: columnDndId(column.id),
		data: { type: "column", column, index },
		disabled: !canEdit,
	});
	const { setNodeRef: setDropRef, isOver } = useDroppable({
		id: columnDropDndId(column.id),
		data: { type: "column-drop", columnId: column.id },
		disabled: !canEdit,
	});

	const overLimit = column.wip_limit != null && tasks.length > column.wip_limit;
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const submitRename = () => {
		const v = nameValue.trim();
		if (v && v !== column.name) onRenameColumn(column.id, v);
		setRenaming(false);
	};

	const submitAdd = () => {
		const v = title.trim();
		if (v) {
			onAddTask(column.id, v);
			setTitle("");
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"flex max-h-[calc(100vh-13.5rem)] w-72 shrink-0 flex-col rounded-lg border bg-muted/40",
				(isColumnDragging || isDragging) && "opacity-40",
			)}>
			{/* Header */}
			<div className='flex items-center justify-between gap-2 border-b px-2.5 py-2'>
				{renaming ? (
					<div className='flex flex-1 items-center gap-1'>
						<Input
							autoFocus
							value={nameValue}
							onChange={(e) => setNameValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.nativeEvent.isComposing) return;
								if (e.key === "Enter") submitRename();
								if (e.key === "Escape") setRenaming(false);
							}}
							className='h-8 text-sm font-semibold'
						/>
						<Button
							size='icon'
							variant='ghost'
							className='h-8 w-8'
							onClick={submitRename}>
							<Check className='h-4 w-4' />
						</Button>
					</div>
				) : (
					<div className='flex min-w-0 items-center gap-2'>
						{canEdit && (
							<button
								type='button'
								{...attributes}
								{...listeners}
								aria-label='Kéo để sắp xếp cột'
								title='Kéo để sắp xếp cột'
								className='shrink-0 cursor-grab rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground active:cursor-grabbing'>
								<GripVertical className='h-4 w-4' />
							</button>
						)}
						{column.color && (
							<span
								className='h-3 w-3 shrink-0 rounded-full'
								style={{ backgroundColor: column.color }}
							/>
						)}
						<h3 className='truncate text-sm font-semibold'>{column.name}</h3>
						<Badge
							variant={overLimit ? "destructive" : "secondary"}
							className='shrink-0'>
							{tasks.length}
							{column.wip_limit != null && `/${column.wip_limit}`}
						</Badge>
					</div>
				)}

				{canEdit && !renaming && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size='icon'
								variant='ghost'
								className='h-7 w-7 text-muted-foreground'>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() => {
									setNameValue(column.name);
									setRenaming(true);
								}}>
								<Pencil className='h-4 w-4' /> Đổi tên cột
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant='destructive'
								onClick={() => onDeleteColumn(column.id)}>
								<Trash2 className='h-4 w-4' /> Xóa cột
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* Tasks */}
			<SortableContext items={tasks.map((task) => taskDndId(task.id))} strategy={verticalListSortingStrategy}>
				<div
					ref={setDropRef}
					className={cn(
						"flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors",
						isOver && "bg-primary/5",
					)}>
					{tasks.map((task, idx) => (
						<TaskCard
							key={task.id}
							task={task}
							columnId={column.id}
							index={idx}
							canEdit={canEdit}
							onClick={onTaskClick}
						/>
					))}

					{tasks.length === 0 && (
						<p className='py-6 text-center text-xs text-muted-foreground'>
							Chưa có công việc
						</p>
					)}
				</div>
			</SortableContext>

			{/* Add task */}
			{canEdit && (
				<div className='border-t p-2'>
					{adding ? (
						<div className='space-y-2'>
							<Textarea
								autoFocus
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								onKeyDown={(e) => {
									if (e.nativeEvent.isComposing) return;
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										submitAdd();
									}
									if (e.key === "Escape") {
										setAdding(false);
										setTitle("");
									}
								}}
								placeholder='Tiêu đề công việc...'
								rows={2}
								className='resize-none text-sm'
							/>
							<div className='flex items-center gap-2'>
								<Button size='sm' onClick={submitAdd}>
									Thêm
								</Button>
								<Button
									size='icon'
									variant='ghost'
									className='h-8 w-8'
									onClick={() => {
										setAdding(false);
										setTitle("");
									}}>
									<X className='h-4 w-4' />
								</Button>
							</div>
						</div>
					) : (
						<Button
							variant='ghost'
							size='sm'
							className='w-full justify-start text-muted-foreground'
							onClick={() => setAdding(true)}>
							<Plus className='mr-1.5 h-4 w-4' /> Thêm công việc
						</Button>
					)}
				</div>
			)}
		</div>
	);
};

export default BoardColumn;
