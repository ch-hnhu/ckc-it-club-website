import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreateProjectInput, ProjectVisibility } from "@/types/projecthub.types";
import { BOARD_COLORS, VISIBILITY_META } from "./constants";

interface CreateBoardDialogProps {
	onClose: () => void;
	onCreate: (body: CreateProjectInput) => Promise<void>;
}

const VISIBILITIES: ProjectVisibility[] = ["private", "members", "public"];

const CreateBoardDialog: React.FC<CreateBoardDialogProps> = ({ onClose, onCreate }) => {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState<string>(BOARD_COLORS[0]);
	const [visibility, setVisibility] = useState<ProjectVisibility>("members");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleCreate = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			await onCreate({
				name: name.trim(),
				description: description.trim() || null,
				color,
				visibility,
			});
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4' onClick={onClose}>
			<div
				className='relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[6px_6px_0_#111]'
				onClick={(e) => e.stopPropagation()}>
				<div className='flex items-center justify-between border-b-2 border-black bg-[var(--color-primary)] px-5 py-3'>
					<h2 className='text-base font-bold text-black'>Tạo dự án mới</h2>
					<button onClick={onClose} className='rounded-md p-1 hover:bg-black/10' aria-label='Đóng'>
						<X className='h-5 w-5' />
					</button>
				</div>

				<div className='space-y-4 p-5'>
					<div>
						<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Tên dự án *</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate();
							}}
							placeholder='VD: Website CLB 2026'
							className='w-full rounded-lg border-2 border-black px-3 py-2 text-sm font-semibold outline-none'
						/>
					</div>

					<div>
						<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Mô tả</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder='Mục tiêu của dự án...'
							className='w-full resize-none rounded-lg border-2 border-black px-3 py-2 text-sm outline-none'
						/>
					</div>

					<div>
						<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Màu nhãn</label>
						<div className='flex flex-wrap gap-2'>
							{BOARD_COLORS.map((c) => (
								<button
									key={c}
									type='button'
									onClick={() => setColor(c)}
									aria-label={`Màu ${c}`}
									className={cn(
										"h-8 w-8 rounded-full border-2 border-black",
										color === c && "ring-2 ring-black ring-offset-2",
									)}
									style={{ backgroundColor: c }}
								/>
							))}
						</div>
					</div>

					<div>
						<label className='mb-1 block text-xs font-bold uppercase text-gray-500'>Phạm vi</label>
						<div className='flex gap-2'>
							{VISIBILITIES.map((v) => (
								<button
									key={v}
									type='button'
									onClick={() => setVisibility(v)}
									className={cn(
										"flex-1 rounded-lg border-2 border-black px-3 py-2 text-sm font-bold",
										visibility === v ? "bg-[var(--color-primary)]" : "bg-white",
									)}>
									{VISIBILITY_META[v].label}
								</button>
							))}
						</div>
					</div>
				</div>

				<div className='flex justify-end gap-2 border-t-2 border-black p-4'>
					<button
						onClick={onClose}
						className='rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold shadow-[2px_2px_0_#111] hover:translate-y-0.5'>
						Hủy
					</button>
					<button
						onClick={handleCreate}
						disabled={saving || !name.trim()}
						className='rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2 text-sm font-bold shadow-[2px_2px_0_#111] hover:translate-y-0.5 disabled:opacity-50'>
						{saving ? "Đang tạo..." : "Tạo dự án"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default CreateBoardDialog;
