import React, { useRef, useState } from "react";
import { Plus } from "lucide-react";
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
import type { CreateProjectInput } from "@/types/projecthub.types";
import { BOARD_COLORS } from "./constants";
import BoardLinkFields, { useBoardLinkOptions } from "./BoardLinkFields";

interface CreateBoardDialogProps {
	onClose: () => void;
	onCreate: (body: CreateProjectInput) => Promise<void>;
}

const CreateBoardDialog: React.FC<CreateBoardDialogProps> = ({ onClose, onCreate }) => {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState<string>(BOARD_COLORS[0]);
	const [courseId, setCourseId] = useState<number | null>(null);
	const [eventId, setEventId] = useState<number | null>(null);
	const [saving, setSaving] = useState(false);
	const { options, loading: loadingOptions } = useBoardLinkOptions();
	const customColorInputRef = useRef<HTMLInputElement>(null);
	const isCustomColor = !BOARD_COLORS.includes(color);

	const handleCreate = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			await onCreate({
				name: name.trim(),
				description: description.trim() || null,
				color,
				course_id: courseId,
				event_id: eventId,
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
							placeholder='VD: Sự kiện Hành trang tân sinh viên 2026'
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
							<button
								type='button'
								onClick={() => customColorInputRef.current?.click()}
								aria-label='Chọn màu tự do'
								title='Chọn màu tự do'
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-full border transition",
									isCustomColor
										? "ring-2 ring-ring ring-offset-2"
										: "border-dashed",
								)}
								style={isCustomColor ? { backgroundColor: color } : undefined}>
								{!isCustomColor && (
									<Plus className='h-4 w-4 text-muted-foreground' />
								)}
							</button>
							<input
								ref={customColorInputRef}
								type='color'
								value={isCustomColor ? color : BOARD_COLORS[0]}
								onChange={(e) => setColor(e.target.value)}
								className='sr-only'
							/>
						</div>
					</div>

					<BoardLinkFields
						options={options}
						loading={loadingOptions}
						courseId={courseId}
						eventId={eventId}
						onChange={({ course_id, event_id }) => {
							setCourseId(course_id);
							setEventId(event_id);
						}}
					/>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={onClose}>
						Hủy
					</Button>
					<Button onClick={handleCreate} disabled={saving || !name.trim()}>
						{saving ? "Đang tạo..." : "Tạo"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CreateBoardDialog;
