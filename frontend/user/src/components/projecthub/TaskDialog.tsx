import React, { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { cn, buildAvatar } from "@/lib/utils";
import type { ProjectMember, ProjectTask, TaskPriority, UpdateTaskInput } from "@/types/projecthub.types";
import { PRIORITY_META, PRIORITY_ORDER, toDateInput } from "./constants";

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
	const [assigneeIds, setAssigneeIds] = useState<number[]>(
		(task.assignees ?? []).map((u) => u.id),
	);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

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
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onClick={onClose}>
			<div
				className='relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0_#111]'
				onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className='flex items-center justify-between border-b-2 border-black bg-[var(--color-primary)] px-5 py-3'>
					<h2 className='text-base font-bold text-black'>Chi tiết công việc</h2>
					<button onClick={onClose} className='rounded-md p-1 hover:bg-black/10' aria-label='Đóng'>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Body */}
				<div className='flex-1 space-y-4 overflow-y-auto p-5'>
					<div>
						<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Tiêu đề</label>
						<input
							value={title}
							disabled={!canEdit}
							onChange={(e) => setTitle(e.target.value)}
							className='w-full rounded-lg border-2 border-black px-3 py-2 text-sm font-semibold outline-none disabled:bg-gray-100'
						/>
					</div>

					<div>
						<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Mô tả</label>
						<textarea
							value={description}
							disabled={!canEdit}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
							placeholder='Thêm mô tả chi tiết...'
							className='w-full resize-none rounded-lg border-2 border-black px-3 py-2 text-sm outline-none disabled:bg-gray-100'
						/>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Bắt đầu</label>
							<input
								type='date'
								value={startDate}
								disabled={!canEdit}
								onChange={(e) => setStartDate(e.target.value)}
								className='w-full rounded-lg border-2 border-black px-3 py-2 text-sm outline-none disabled:bg-gray-100'
							/>
						</div>
						<div>
							<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Hạn chót</label>
							<input
								type='date'
								value={dueDate}
								disabled={!canEdit}
								onChange={(e) => setDueDate(e.target.value)}
								className='w-full rounded-lg border-2 border-black px-3 py-2 text-sm outline-none disabled:bg-gray-100'
							/>
						</div>
					</div>

					<div>
						<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Ưu tiên</label>
						<div className='flex flex-wrap gap-2'>
							<button
								type='button'
								disabled={!canEdit}
								onClick={() => setPriority("")}
								className={cn(
									"rounded-full border-2 border-black px-3 py-1 text-xs font-bold",
									priority === "" ? "bg-black text-white" : "bg-white",
								)}>
								Không
							</button>
							{PRIORITY_ORDER.map((p) => (
								<button
									key={p}
									type='button'
									disabled={!canEdit}
									onClick={() => setPriority(p)}
									className={cn(
										"rounded-full border-2 border-black px-3 py-1 text-xs font-bold",
										priority === p ? PRIORITY_META[p].className : "bg-white",
									)}>
									{PRIORITY_META[p].label}
								</button>
							))}
						</div>
					</div>

					{members.length > 0 && (
						<div>
							<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Người phụ trách</label>
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
												"flex items-center gap-1.5 rounded-full border-2 border-black py-0.5 pl-0.5 pr-2.5 text-xs font-semibold",
												active ? "bg-[var(--color-primary)]" : "bg-white",
											)}>
											<img
												src={buildAvatar(m.full_name, m.avatar)}
												alt={m.full_name}
												className='h-5 w-5 rounded-full object-cover'
											/>
											{m.full_name}
										</button>
									);
								})}
							</div>
						</div>
					)}

					<label className='flex items-center gap-2 text-sm font-semibold'>
						<input
							type='checkbox'
							checked={completed}
							disabled={!canEdit}
							onChange={(e) => setCompleted(e.target.checked)}
							className='h-4 w-4 accent-[var(--color-primary)]'
						/>
						Đánh dấu đã hoàn thành
					</label>
				</div>

				{/* Footer */}
				{canEdit && (
					<div className='flex items-center justify-between border-t-2 border-black p-4'>
						<button
							onClick={() => onDelete(task.id)}
							className='flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold text-red-600 shadow-[2px_2px_0_#111] hover:translate-y-0.5'>
							<Trash2 className='h-4 w-4' /> Xóa
						</button>
						<button
							onClick={handleSave}
							disabled={saving || !title.trim()}
							className='rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2 text-sm font-bold shadow-[2px_2px_0_#111] hover:translate-y-0.5 disabled:opacity-50'>
							{saving ? "Đang lưu..." : "Lưu thay đổi"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default TaskDialog;
