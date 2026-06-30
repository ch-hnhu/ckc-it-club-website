import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, CheckCircle2, CheckSquare, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProjectTask } from "@/types/projecthub.types";
import { PRIORITY_META, formatShortDate, initials, isOverdue } from "./constants";
import { taskDndId } from "./dnd";

interface TaskCardProps {
	task: ProjectTask;
	columnId: number;
	index: number;
	canEdit: boolean;
	onClick: (task: ProjectTask) => void;
}

export function TaskCardPreview({
	task,
	className,
	isOverlay = false,
}: {
	task: ProjectTask;
	className?: string;
	isOverlay?: boolean;
}) {
	const priority = task.priority ? PRIORITY_META[task.priority] : null;
	const completed = Boolean(task.completed_at);
	const overdue = isOverdue(task.due_date, task.completed_at);
	const assignees = task.assignees ?? [];
	const checklist = task.checklist_items ?? [];
	const checklistTotal = checklist.length;
	const checklistDone = checklist.filter((i) => i.is_done).length;
	const checklistComplete = checklistTotal > 0 && checklistDone === checklistTotal;

	return (
		<div
			className={cn(
				"group w-full rounded-md border bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow",
				isOverlay && "rotate-1 shadow-xl ring-1 ring-primary/20",
				completed && "opacity-65",
				className,
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

			<p
				className={cn(
					"text-sm font-medium leading-snug",
					completed && "line-through text-muted-foreground",
				)}>
				{task.title}
			</p>

			{(task.due_date || task.description || assignees.length > 0 || checklistTotal > 0) && (
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
									overdue ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground",
								)}>
								<Calendar className='h-3.5 w-3.5' />
								{formatShortDate(task.due_date)}
							</span>
						) : null}
						{checklistTotal > 0 && (
							<span
								className={cn(
									"inline-flex items-center gap-1 rounded px-1.5 py-0.5",
									checklistComplete
										? "bg-emerald-100 text-emerald-700"
										: "bg-muted text-muted-foreground",
								)}>
								<CheckSquare className='h-3.5 w-3.5' />
								{checklistDone}/{checklistTotal}
							</span>
						)}
						{task.description && (
							<MessageSquareText className='h-3.5 w-3.5 text-muted-foreground' />
						)}
					</div>

					{assignees.length > 0 && (
						<div className='flex -space-x-2'>
							{assignees.slice(0, 3).map((u) => (
								<Avatar key={u.id} className='h-6 w-6 border-2 border-background'>
									<AvatarImage src={u.avatar ?? undefined} alt={u.full_name} />
									<AvatarFallback className='text-[9px]'>
										{initials(u.full_name)}
									</AvatarFallback>
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
		</div>
	);
}

const TaskCard: React.FC<TaskCardProps> = ({ task, columnId, index, canEdit, onClick }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: taskDndId(task.id),
		data: { type: "task", task, columnId, index },
		disabled: !canEdit,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<button
			ref={setNodeRef}
			type='button'
			style={style}
			{...attributes}
			{...(canEdit ? listeners : {})}
			onClick={() => {
				if (!isDragging) onClick(task);
			}}
			className={cn(
				"w-full touch-manipulation text-left outline-none",
				canEdit && "cursor-grab active:cursor-grabbing",
				isDragging && "relative z-10 opacity-35",
			)}>
			<TaskCardPreview task={task} />
		</button>
	);
};

export default TaskCard;
