import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Tạo dự án mới</DialogTitle>
				</DialogHeader>

				<div className='space-y-4'>
					<div className='space-y-1.5'>
						<Label>Tên dự án *</Label>
						<Input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreate();
							}}
							placeholder='VD: Website CLB 2026'
						/>
					</div>

					<div className='space-y-1.5'>
						<Label>Mô tả</Label>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							placeholder='Mục tiêu của dự án...'
							className='resize-none'
						/>
					</div>

					<div className='space-y-1.5'>
						<Label>Màu nhãn</Label>
						<div className='flex flex-wrap gap-2'>
							{BOARD_COLORS.map((c) => (
								<button
									key={c}
									type='button'
									onClick={() => setColor(c)}
									aria-label={`Màu ${c}`}
									className={cn(
										"h-8 w-8 rounded-full border transition",
										color === c && "ring-2 ring-ring ring-offset-2",
									)}
									style={{ backgroundColor: c }}
								/>
							))}
						</div>
					</div>

					<div className='space-y-1.5'>
						<Label>Phạm vi</Label>
						<div className='flex gap-2'>
							{VISIBILITIES.map((v) => (
								<Button
									key={v}
									type='button'
									variant={visibility === v ? "default" : "outline"}
									className='flex-1'
									onClick={() => setVisibility(v)}>
									{VISIBILITY_META[v].label}
								</Button>
							))}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={onClose}>
						Hủy
					</Button>
					<Button onClick={handleCreate} disabled={saving || !name.trim()}>
						{saving ? "Đang tạo..." : "Tạo dự án"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateBoardDialog;
