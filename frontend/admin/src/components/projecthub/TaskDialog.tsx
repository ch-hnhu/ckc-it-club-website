import React, { useMemo, useState } from "react";
import { CircleCheckBig, Plus, Search, Trash2, UserPlus, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { projectHubService } from "@/services/projecthub.service";
import type {
	ChecklistItem,
	ProjectMember,
	ProjectUser,
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
	const [assigneeIds, setAssigneeIds] = useState<number[]>(
		(task.assignees ?? []).map((u) => u.id),
	);
	const [selectedAssignees, setSelectedAssignees] = useState<ProjectUser[]>(
		task.assignees ?? [],
	);
	const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
	const [assigneeQuery, setAssigneeQuery] = useState("");
	const [saving, setSaving] = useState(false);

	const [items, setItems] = useState<ChecklistItem[]>(task.checklist_items ?? []);
	const [newItem, setNewItem] = useState("");
	const [addingItem, setAddingItem] = useState(false);
	const [busyItem, setBusyItem] = useState<number | null>(null);

	const checklistTotal = items.length;
	const checklistDone = items.filter((i) => i.is_done).length;
	const checklistPct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
	const assigneeOptions = useMemo(() => {
		const query = assigneeQuery.trim().toLowerCase();
		return members.filter((member) => {
			if (assigneeIds.includes(member.id)) return false;
			if (!query) return true;
			return [member.full_name, member.username].some((value) =>
				(value ?? "").toLowerCase().includes(query),
			);
		});
	}, [assigneeIds, assigneeQuery, members]);

	const addAssignee = (user: ProjectMember) => {
		if (assigneeIds.includes(user.id)) return;
		setAssigneeIds((ids) => [...ids, user.id]);
		setSelectedAssignees((users) => [
			...users,
			{
				id: user.id,
				full_name: user.full_name,
				username: user.username,
				avatar: user.avatar,
			},
		]);
		setAssigneeQuery("");
	};

	const removeAssignee = (id: number) => {
		setAssigneeIds((ids) => ids.filter((item) => item !== id));
		setSelectedAssignees((users) => users.filter((user) => user.id !== id));
	};

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
			await projectHubService.updateChecklistItem(slug, task.id, item.id, {
				is_done: isDone,
			});
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
						<Input
							value={title}
							disabled={!canEdit}
							onChange={(e) => setTitle(e.target.value)}
						/>
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

					<div className='space-y-1.5'>
						<Label>Người phụ trách</Label>
						<div className='flex flex-wrap gap-2'>
							{selectedAssignees.map((user) => (
								<span
									key={user.id}
									className='inline-flex items-center gap-1.5 rounded-full border bg-background py-1 pl-1 pr-2 text-xs font-medium'>
									<Avatar className='h-5 w-5'>
										<AvatarImage
											src={user.avatar ?? undefined}
											alt={user.full_name}
										/>
										<AvatarFallback className='text-[9px]'>
											{initials(user.full_name)}
										</AvatarFallback>
									</Avatar>
									{user.full_name}
									{canEdit && (
										<button
											type='button'
											onClick={() => removeAssignee(user.id)}
											aria-label={`Bỏ ${user.full_name}`}
											className='rounded-full text-muted-foreground hover:text-foreground'>
											<X className='h-3.5 w-3.5' />
										</button>
									)}
								</span>
							))}
							{canEdit && (
								<Popover
									open={assigneePickerOpen}
									onOpenChange={(open) => {
										setAssigneePickerOpen(open);
										if (!open) setAssigneeQuery("");
									}}>
									<PopoverTrigger asChild>
										<button
											type='button'
											className='inline-flex items-center gap-1.5 rounded-full border border-dashed bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground'>
											<Plus className='h-3.5 w-3.5' />
											Thêm
										</button>
									</PopoverTrigger>
									<PopoverContent align='start' className='w-80 p-0'>
										<div className='border-b p-2'>
											<div className='relative'>
												<Search className='pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
												<Input
													value={assigneeQuery}
													onChange={(e) => setAssigneeQuery(e.target.value)}
													placeholder='Tìm thành viên board...'
													className='h-9 pl-8'
												/>
											</div>
										</div>
										<div className='max-h-64 overflow-y-auto p-1'>
											{assigneeOptions.map((user) => (
													<button
														key={user.id}
														type='button'
														onClick={() => {
															addAssignee(user);
															setAssigneePickerOpen(false);
														}}
														className='flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent'>
														<Avatar className='h-8 w-8'>
															<AvatarImage
																src={user.avatar ?? undefined}
																alt={user.full_name}
															/>
															<AvatarFallback className='text-xs'>
																{initials(user.full_name)}
															</AvatarFallback>
														</Avatar>
														<div className='min-w-0 flex-1'>
															<p className='truncate text-sm font-medium'>
																{user.full_name}
															</p>
															{user.username && (
																<p className='truncate text-xs text-muted-foreground'>
																	@{user.username}
																</p>
															)}
														</div>
														<UserPlus className='h-4 w-4 shrink-0 text-muted-foreground' />
													</button>
												))}
											{assigneeOptions.length === 0 && (
												<p className='px-3 py-6 text-center text-sm text-muted-foreground'>
													Không tìm thấy thành viên phù hợp.
												</p>
											)}
										</div>
									</PopoverContent>
								</Popover>
							)}
						</div>
					</div>

					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label className='flex items-center gap-1.5'>
								<CircleCheckBig className='h-4 w-4' /> Checklist
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
											onCheckedChange={(v) =>
												handleToggleItem(it, v === true)
											}
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
						<Button
							className='text-destructive border-0 bg-transparent hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20'
							onClick={() => onDelete(task.id)}>
							<Trash2 className='h-4 w-4' /> Xoá
						</Button>
						<Button onClick={handleSave} disabled={saving || !title.trim()}>
							{saving ? "Đang lưu..." : "Lưu"}
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default TaskDialog;
