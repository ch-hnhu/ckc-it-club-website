import React, { useState } from "react";
import { Check, GripVertical, MoreHorizontal, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
	const [menuOpen, setMenuOpen] = useState(false);
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
				"flex w-72 max-h-full shrink-0 flex-col rounded-2xl border-2 border-black bg-gray-50 shadow-[4px_4px_0_#111]",
				isColumnDragging && "opacity-40",
			)}>
			{/* Header */}
			<div className='flex items-center justify-between gap-2 border-b-2 border-black px-3 py-2.5'>
				{renaming ? (
					<div className='flex flex-1 items-center gap-1'>
						<input
							autoFocus
							value={nameValue}
							onChange={(e) => setNameValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") submitRename();
								if (e.key === "Escape") setRenaming(false);
							}}
							className='w-full rounded-md border-2 border-black px-2 py-1 text-sm font-bold outline-none'
						/>
						<button onClick={submitRename} className='rounded-md p-1 hover:bg-gray-200' aria-label='Lưu'>
							<Check className='h-4 w-4' />
						</button>
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
								className='shrink-0 cursor-grab text-gray-400 hover:text-gray-700 active:cursor-grabbing'>
								<GripVertical className='h-4 w-4' />
							</span>
						)}
						{column.color && (
							<span
								className='h-3 w-3 shrink-0 rounded-full border border-black'
								style={{ backgroundColor: column.color }}
							/>
						)}
						<h3 className='truncate text-sm font-bold text-black'>{column.name}</h3>
						<span
							className={cn(
								"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
								overLimit ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700",
							)}>
							{tasks.length}
							{column.wip_limit != null && `/${column.wip_limit}`}
						</span>
					</div>
				)}

				{canEdit && !renaming && (
					<div className='relative'>
						<button
							onClick={() => setMenuOpen((o) => !o)}
							className='rounded-md p-1 text-gray-500 hover:bg-gray-200'
							aria-label='Tùy chọn cột'>
							<MoreHorizontal className='h-4 w-4' />
						</button>
						{menuOpen && (
							<>
								<button
									className='fixed inset-0 z-10 cursor-default'
									onClick={() => setMenuOpen(false)}
									aria-label='Đóng menu'
								/>
								<div className='absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#111]'>
									<button
										onClick={() => {
											setNameValue(column.name);
											setRenaming(true);
											setMenuOpen(false);
										}}
										className='block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-gray-100'>
										Đổi tên cột
									</button>
									<button
										onClick={() => {
											setMenuOpen(false);
											onDeleteColumn(column.id);
										}}
										className='flex w-full items-center gap-2 border-t-2 border-black px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50'>
										<Trash2 className='h-4 w-4' /> Xóa cột
									</button>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{/* Tasks */}
			<div className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5'>
				{tasks.map((task, index) => (
					<TaskCard
						key={task.id}
						task={task}
						columnId={column.id}
						index={index}
						dropBefore={dropTarget?.columnId === column.id && dropTarget.index === index}
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
					{isEndDrop && <div className='h-1.5 rounded-full bg-[var(--color-primary)]' />}
					{tasks.length === 0 && !isEndDrop && (
						<p className='py-6 text-center text-xs font-medium text-gray-400'>Chưa có công việc</p>
					)}
				</div>
			</div>

			{/* Add task */}
			{canEdit && (
				<div className='border-t-2 border-black p-2'>
					{adding ? (
						<div className='space-y-2'>
							<textarea
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
								className='w-full resize-none rounded-lg border-2 border-black px-2.5 py-2 text-sm outline-none'
							/>
							<div className='flex items-center gap-2'>
								<button
									onClick={submitAdd}
									className='rounded-lg border-2 border-black bg-[var(--color-primary)] px-3 py-1.5 text-sm font-bold shadow-[2px_2px_0_#111] hover:translate-y-0.5'>
									Thêm
								</button>
								<button
									onClick={() => {
										setAdding(false);
										setTitle("");
									}}
									className='rounded-lg p-1.5 text-gray-500 hover:bg-gray-200'
									aria-label='Hủy'>
									<X className='h-4 w-4' />
								</button>
							</div>
						</div>
					) : (
						<button
							onClick={() => setAdding(true)}
							className='flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-200'>
							<Plus className='h-4 w-4' /> Thêm công việc
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default BoardColumn;
