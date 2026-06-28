import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectMember, ProjectTask, TaskPriority, UpdateTaskInput } from "@/types/projecthub.types";
import { PRIORITY_META, PRIORITY_ORDER, initials, toDateInput } from "./constants";

interface TaskDialogProps {
	task: ProjectTask;
	members: ProjectMember[];
	canEdit: boolean;
	onClose: () => void;
	onSave: (taskId: number, body: UpdateTaskInput) => Promise<void>;
	onDelete: (taskId: number) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({ task, members, canEdit, onClose, onSave, onDelete }) => {
	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? "");
	const [priority, setPriority] = useState<TaskPriority | "">(task.priority ?? "");
	const [startDate, setStartDate] = useState(toDateInput(task.start_date));
	const [dueDate, setDueDate] = useState(toDateInput(task.due_date));
	const [completed, setCompleted] = useState(Boolean(task.completed_at));
	const [assigneeIds, setAssigneeIds] = useState<number[]>((task.assignees ?? []).map((u) => u.id));
	const [saving, setSaving] = useState(false);

	const toggleAssignee = (id: number) =>
		setAssigneeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

	const handleSave = async () => {
		if (!title.trim()) return;
		setSaving(true);
		try {
			await onSave(task.id, {
				title: title.trim(),
				description: description.trim() || null,
				priority: priority || null,
				start_date: startDate || null,
				due_date: dueDate || null,
				completed,
				assignee_ids: assigneeIds,
			});
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Chi tiết công việc</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='space-y-1.5'>
						<Label>Tiêu đề</Label>
						<Input value={title} disabled={!canEdit} onChange={(e) => setTitle(e.target.value)} />
					</div>

					<div className='space-y-1.5'>
						<Label>Mô tả</Label>
						<Textarea
							value={description}
							disabled={!canEdit}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							placeholder='Thêm mô tả chi tiết...'
							className='resize-none'
						/>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1.5'>
							<Label>Bắt đầu</Label>
							<Input
								type='date'
								value={startDate}
								disabled={!canEdit}
								onChange={(e) => setStartDate(e.target.value)}
							/>
						</div>
						<div className='space-y-1.5'>
							<Label>Hạn chót</Label>
							<Input
								type='date'
								value={dueDate}
								disabled={!canEdit}
								onChange={(e) => setDueDate(e.target.value)}
							/>
						</div>
					</div>

					<div className='space-y-1.5'>
						<Label>Ưu tiên</Label>
						<div className='flex flex-wrap gap-2'>
							<Button
								type='button'
								size='sm'
								variant={priority === "" ? "default" : "outline"}
								disabled={!canEdit}
								onClick={() => setPriority("")}>
								Không
							</Button>
							{PRIORITY_ORDER.map((p) => (
								<Button
									key={p}
									type='button'
									size='sm'
									variant={priority === p ? "default" : "outline"}
									disabled={!canEdit}
									onClick={() => setPriority(p)}>
									{PRIORITY_META[p].label}
								</Button>
							))}
						</div>
					</div>

					{members.length > 0 && (
						<div className='space-y-1.5'>
							<Label>Người phụ trách</Label>
							<div className='flex flex-wrap gap-2'>
								{members.map((m) => {
									const active = assigneeIds.includes(m.id);
									return (
										<button
											key={m.id}
											type='button'
											disabled={!canEdit}
											onClick={() => toggleAssignee(m.id)}
											className={cn(
												"flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-medium transition",
												active ? "border-primary bg-primary/10" : "bg-background hover:bg-accent",
											)}>
											<Avatar className='h-5 w-5'>
												<AvatarImage src={m.avatar ?? undefined} alt={m.full_name} />
												<AvatarFallback className='text-[9px]'>{initials(m.full_name)}</AvatarFallback>
											</Avatar>
											{m.full_name}
										</button>
									);
								})}
							</div>
						</div>
					)}

					<label className='flex items-center gap-2 text-sm font-medium'>
						<Checkbox
							checked={completed}
							disabled={!canEdit}
							onCheckedChange={(v) => setCompleted(v === true)}
						/>
						Đánh dấu đã hoàn thành
					</label>
				</div>

				{canEdit && (
					<DialogFooter className='sm:justify-between'>
						<Button variant='outline' className='text-destructive' onClick={() => onDelete(task.id)}>
							<Trash2 className='mr-1.5 h-4 w-4' /> Xóa
						</Button>
						<Button onClick={handleSave} disabled={saving || !title.trim()}>
							{saving ? "Đang lưu..." : "Lưu thay đổi"}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default TaskDialog;
