import React from "react";
import { Calendar, CheckCircle2, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectTask } from "@/types/projecthub.types";
import { PRIORITY_META, formatShortDate, initials, isOverdue } from "./constants";

interface TaskCardProps {
	task: ProjectTask;
	columnId: number;
	index: number;
	dropBefore: boolean;
	onDragStart: (task: ProjectTask, columnId: number, index: number) => void;
	onDragEnd: () => void;
	onDragOver: (columnId: number, index: number, e: React.DragEvent) => void;
	onDrop: (columnId: number, index: number, e: React.DragEvent) => void;
	onClick: (task: ProjectTask) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
	task,
	columnId,
	index,
	dropBefore,
	onDragStart,
	onDragEnd,
	onDragOver,
	onDrop,
	onClick,
}) => {
	const priority = task.priority ? PRIORITY_META[task.priority] : null;
	const completed = Boolean(task.completed_at);
	const overdue = isOverdue(task.due_date, task.completed_at);
	const assignees = task.assignees ?? [];

	return (
		<div onDragOver={(e) => onDragOver(columnId, index, e)} onDrop={(e) => onDrop(columnId, index, e)}>
			{dropBefore && <div className='mb-2 h-1 rounded-full bg-primary' />}
			<button
				type='button'
				draggable
				onDragStart={(e) => {
					e.dataTransfer.effectAllowed = "move";
					e.dataTransfer.setData("text/plain", String(task.id));
					onDragStart(task, columnId, index);
				}}
				onDragEnd={onDragEnd}
				onClick={() => onClick(task)}
				className={cn(
					"group w-full cursor-grab rounded-md border bg-card p-3 text-left shadow-sm transition active:cursor-grabbing hover:border-primary/40 hover:shadow",
					completed && "opacity-65",
				)}>
				{priority && (
					<span
						className={cn(
							"mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
							priority.className,
						)}>
						<span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
						{priority.label}
					</span>
				)}

				<p className={cn("text-sm font-medium leading-snug", completed && "line-through text-muted-foreground")}>
					{task.title}
				</p>

				{(task.due_date || task.description || assignees.length > 0) && (
					<div className='mt-2.5 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2 text-[11px] font-medium'>
							{completed ? (
								<span className='inline-flex items-center gap-1 text-emerald-600'>
									<CheckCircle2 className='h-3.5 w-3.5' /> Xong
								</span>
							) : task.due_date ? (
								<span
									className={cn(
										"inline-flex items-center gap-1 rounded px-1.5 py-0.5",
										overdue
											? "bg-red-100 text-red-700"
											: "bg-muted text-muted-foreground",
									)}>
									<Calendar className='h-3.5 w-3.5' />
									{formatShortDate(task.due_date)}
								</span>
							) : null}
							{task.description && (
								<MessageSquareText className='h-3.5 w-3.5 text-muted-foreground' />
							)}
						</div>

						{assignees.length > 0 && (
							<div className='flex -space-x-2'>
								{assignees.slice(0, 3).map((u) => (
									<Avatar key={u.id} className='h-6 w-6 border-2 border-background'>
										<AvatarImage src={u.avatar ?? undefined} alt={u.full_name} />
										<AvatarFallback className='text-[9px]'>{initials(u.full_name)}</AvatarFallback>
									</Avatar>
								))}
								{assignees.length > 3 && (
									<span className='flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium'>
										+{assignees.length - 3}
									</span>
								)}
							</div>
						)}
					</div>
				)}
			</button>
		</div>
	);
};

export default TaskCard;
