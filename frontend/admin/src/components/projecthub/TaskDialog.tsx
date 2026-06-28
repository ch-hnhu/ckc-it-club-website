import React, { useState } from "react";
import { CheckSquare, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
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
import { projectHubService } from "@/services/projecthub.service";
import type {
	ChecklistItem,
	ProjectMember,
	ProjectTask,
	TaskPriority,
	UpdateTaskInput,
} from "@/types/projecthub.types";
import { PRIORITY_META, PRIORITY_ORDER, initials, toDateInput } from "./constants";

interface TaskDialogProps {
	task: ProjectTask;
	members: ProjectMember[];
	canEdit: boolean;
	slug: string;
	onClose: () => void;
	onSave: (taskId: number, body: UpdateTaskInput) => Promise<void>;
	onDelete: (taskId: number) => void;
	onChecklistChange: (taskId: number, items: ChecklistItem[]) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
	task,
	members,
	canEdit,
	slug,
	onClose,
	onSave,
	onDelete,
	onChecklistChange,
}) => {
	const [title, setTitle] = useState(task.title);
	const [description, setDescription] = useState(task.description ?? "");
	const [priority, setPriority] = useState<TaskPriority | "">(task.priority ?? "");
	const [startDate, setStartDate] = useState(toDateInput(task.start_date));
	const [dueDate, setDueDate] = useState(toDateInput(task.due_date));
	const [completed, setCompleted] = useState(Boolean(task.completed_at));
	const [assigneeIds, setAssigneeIds] = useState<number[]>((task.assignees ?? []).map((u) => u.id));
	const [saving, setSaving] = useState(false);

	const [items, setItems] = useState<ChecklistItem[]>(task.checklist_items ?? []);
	const [newItem, setNewItem] = useState("");
	const [addingItem, setAddingItem] = useState(false);
	const [busyItem, setBusyItem] = useState<number | null>(null);

	const checklistTotal = items.length;
	const checklistDone = items.filter((i) => i.is_done).length;
	const checklistPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;

	const toggleAssignee = (id: number) =>
		setAssigneeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

	const syncItems = (next: ChecklistItem[]) => {
		setItems(next);
		onChecklistChange(task.id, next);
	};

	const handleAddItem = async () => {
		const content = newItem.trim();
		if (!content || addingItem) return;
		setAddingItem(true);
		try {
			const res = await projectHubService.addChecklistItem(slug, task.id, content);
			syncItems([...items, res.data]);
			setNewItem("");
		} catch {
			toast.error("Thêm mục thất bại");
		} finally {
			setAddingItem(false);
		}
	};

	const handleToggleItem = async (item: ChecklistItem, isDone: boolean) => {
		const prev = items;
		setBusyItem(item.id);
		syncItems(items.map((i) => (i.id === item.id ? { ...i, is_done: isDone } : i)));
		try {
			await projectHubService.updateChecklistItem(slug, task.id, item.id, { is_done: isDone });
		} catch {
			toast.error("Cập nhật mục thất bại");
			syncItems(prev);
		} finally {
			setBusyItem(null);
		}
	};

	const handleRemoveItem = async (itemId: number) => {
		const prev = items;
		syncItems(items.filter((i) => i.id !== itemId));
		try {
			await projectHubService.deleteChecklistItem(slug, task.id, itemId);
		} catch {
			toast.error("Xóa mục thất bại");
			syncItems(prev);
		}
	};

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

					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label className='flex items-center gap-1.5'>
								<CheckSquare className='h-4 w-4' /> Việc cần làm
							</Label>
							{checklistTotal > 0 && (
								<span className='text-xs font-medium text-muted-foreground'>
									{checklistDone}/{checklistTotal}
								</span>
							)}
						</div>

						{checklistTotal > 0 && (
							<div className='h-1.5 overflow-hidden rounded-full bg-muted'>
								<div
									className='h-full rounded-full bg-primary transition-all'
									style={{ width: `${checklistPct}%` }}
								/>
							</div>
						)}

						{items.length > 0 && (
							<div className='space-y-0.5'>
								{items.map((it) => (
									<div
										key={it.id}
										className='group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-accent'>
										<Checkbox
											checked={it.is_done}
											disabled={!canEdit || busyItem === it.id}
											onCheckedChange={(v) => handleToggleItem(it, v === true)}
										/>
										<span
											className={cn(
												"flex-1 text-sm",
												it.is_done && "text-muted-foreground line-through",
											)}>
											{it.content}
										</span>
										{canEdit && (
											<button
												type='button'
												onClick={() => handleRemoveItem(it.id)}
												aria-label='Xóa mục'
												className='text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100'>
												<X className='h-4 w-4' />
											</button>
										)}
									</div>
								))}
							</div>
						)}

						{canEdit && (
							<div className='flex items-center gap-2'>
								<Input
									value={newItem}
									onChange={(e) => setNewItem(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleAddItem();
										}
									}}
									placeholder='Thêm một mục...'
									className='h-8 text-sm'
								/>
								<Button
									type='button'
									size='sm'
									variant='outline'
									onClick={handleAddItem}
									disabled={!newItem.trim() || addingItem}>
									<Plus className='h-4 w-4' />
								</Button>
							</div>
						)}
					</div>

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
