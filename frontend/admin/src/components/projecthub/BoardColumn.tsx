import React, { useState } from "react";
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

interface BoardColumnProps {
	column: ProjectColumn;
	index: number;
	canEdit: boolean;
	dropTarget: { columnId: number; index: number } | null;
	isColumnDragging: boolean;
	onTaskDragStart: (task: ProjectTask, columnId: number, index: number) => void;
	onTaskDragEnd: () => void;
	onTaskDragOver: (columnId: number, index: number, e: React.DragEvent) => void;
	onTaskDrop: (columnId: number, index: number, e: React.DragEvent) => void;
	onTaskClick: (task: ProjectTask) => void;
	onAddTask: (columnId: number, title: string) => void;
	onRenameColumn: (columnId: number, name: string) => void;
	onDeleteColumn: (columnId: number) => void;
	onColumnDragStart: (columnId: number) => void;
	onColumnDragEnd: () => void;
	onColumnDragOver: (index: number, e: React.DragEvent) => void;
	onColumnDrop: (index: number, e: React.DragEvent) => void;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
	column,
	index,
	canEdit,
	dropTarget,
	isColumnDragging,
	onTaskDragStart,
	onTaskDragEnd,
	onTaskDragOver,
	onTaskDrop,
	onTaskClick,
	onAddTask,
	onRenameColumn,
	onDeleteColumn,
	onColumnDragStart,
	onColumnDragEnd,
	onColumnDragOver,
	onColumnDrop,
}) => {
	const tasks = column.tasks ?? [];
	const [renaming, setRenaming] = useState(false);
	const [nameValue, setNameValue] = useState(column.name);
	const [adding, setAdding] = useState(false);
	const [title, setTitle] = useState("");

	const overLimit = column.wip_limit != null && tasks.length > column.wip_limit;
	const isEndDrop = dropTarget?.columnId === column.id && dropTarget.index === tasks.length;

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
			onDragOver={(e) => onColumnDragOver(index, e)}
			onDrop={(e) => onColumnDrop(index, e)}
			className={cn(
				"flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40",
				isColumnDragging && "opacity-40",
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
								if (e.key === "Enter") submitRename();
								if (e.key === "Escape") setRenaming(false);
							}}
							className='h-8 text-sm font-semibold'
						/>
						<Button size='icon' variant='ghost' className='h-8 w-8' onClick={submitRename}>
							<Check className='h-4 w-4' />
						</Button>
					</div>
				) : (
					<div className='flex min-w-0 items-center gap-2'>
						{canEdit && (
							<span
								draggable
								onDragStart={(e) => {
									e.dataTransfer.effectAllowed = "move";
									e.dataTransfer.setData("text/plain", `col:${column.id}`);
									onColumnDragStart(column.id);
								}}
								onDragEnd={onColumnDragEnd}
								title='Kéo để sắp xếp cột'
								className='shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing'>
								<GripVertical className='h-4 w-4' />
							</span>
						)}
						{column.color && (
							<span
								className='h-3 w-3 shrink-0 rounded-full'
								style={{ backgroundColor: column.color }}
							/>
						)}
						<h3 className='truncate text-sm font-semibold'>{column.name}</h3>
						<Badge variant={overLimit ? "destructive" : "secondary"} className='shrink-0'>
							{tasks.length}
							{column.wip_limit != null && `/${column.wip_limit}`}
						</Badge>
					</div>
				)}

				{canEdit && !renaming && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size='icon' variant='ghost' className='h-7 w-7 text-muted-foreground'>
								<MoreHorizontal className='h-4 w-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() => {
									setNameValue(column.name);
									setRenaming(true);
								}}>
								<Pencil className='mr-2 h-4 w-4' /> Đổi tên cột
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant='destructive' onClick={() => onDeleteColumn(column.id)}>
								<Trash2 className='mr-2 h-4 w-4' /> Xóa cột
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* Tasks */}
			<div className='flex max-h-[calc(100vh-18rem)] flex-1 flex-col gap-2 overflow-y-auto p-2'>
				{tasks.map((task, idx) => (
					<TaskCard
						key={task.id}
						task={task}
						columnId={column.id}
						index={idx}
						dropBefore={dropTarget?.columnId === column.id && dropTarget.index === idx}
						onDragStart={onTaskDragStart}
						onDragEnd={onTaskDragEnd}
						onDragOver={onTaskDragOver}
						onDrop={onTaskDrop}
						onClick={onTaskClick}
					/>
				))}

				{/* Vùng thả cuối cột */}
				<div
					onDragOver={(e) => onTaskDragOver(column.id, tasks.length, e)}
					onDrop={(e) => onTaskDrop(column.id, tasks.length, e)}
					className='min-h-[12px]'>
					{isEndDrop && <div className='h-1 rounded-full bg-primary' />}
					{tasks.length === 0 && !isEndDrop && (
						<p className='py-6 text-center text-xs text-muted-foreground'>Chưa có công việc</p>
					)}
				</div>
			</div>

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
