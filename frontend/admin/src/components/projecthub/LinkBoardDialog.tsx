import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import BoardLinkFields, { useBoardLinkOptions } from "./BoardLinkFields";

interface LinkBoardDialogProps {
	courseId: number | null;
	eventId: number | null;
	onClose: () => void;
	onSave: (payload: { course_id: number | null; event_id: number | null }) => Promise<void>;
}

/** Hộp thoại đổi liên kết course/event của một board đã tồn tại. */
const LinkBoardDialog: React.FC<LinkBoardDialogProps> = ({ courseId, eventId, onClose, onSave }) => {
	const { options, loading } = useBoardLinkOptions();
	const [course, setCourse] = useState<number | null>(courseId);
	const [event, setEvent] = useState<number | null>(eventId);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		try {
			await onSave({ course_id: course, event_id: event });
			onClose();
		} catch {
			// giữ hộp thoại mở; phía gọi đã hiện thông báo lỗi
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Liên kết khoá học / sự kiện</DialogTitle>
				</DialogHeader>

				<BoardLinkFields
					options={options}
					loading={loading}
					courseId={course}
					eventId={event}
					onChange={({ course_id, event_id }) => {
						setCourse(course_id);
						setEvent(event_id);
					}}
				/>

				<DialogFooter>
					<Button variant='outline' onClick={onClose}>
						Hủy
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? "Đang lưu..." : "Lưu liên kết"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default LinkBoardDialog;
