import React from "react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { projectHubService } from "@/services/projecthub.service";
import type { BoardLinkOptions } from "@/types/projecthub.types";

const NONE = "none";

/** Tải danh sách course/event để chọn liên kết (dùng chung cho dialog tạo & liên kết board). */
export function useBoardLinkOptions() {
	const [options, setOptions] = React.useState<BoardLinkOptions | null>(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		let active = true;
		projectHubService
			.getLinkOptions()
			.then((res) => active && setOptions(res.data))
			.catch(() => active && setOptions({ courses: [], events: [] }))
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, []);

	return { options, loading };
}

interface BoardLinkFieldsProps {
	options: BoardLinkOptions | null;
	loading?: boolean;
	courseId: number | null;
	eventId: number | null;
	onChange: (next: { course_id: number | null; event_id: number | null }) => void;
}

/** Hai select tuỳ chọn: liên kết board với 1 khoá học và/hoặc 1 sự kiện. */
const BoardLinkFields: React.FC<BoardLinkFieldsProps> = ({
	options,
	loading,
	courseId,
	eventId,
	onChange,
}) => {
	return (
		<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
			<div className='space-y-1.5'>
				<Label>Khoá học liên kết</Label>
				<Select
					disabled={loading}
					value={courseId != null ? String(courseId) : NONE}
					onValueChange={(v) =>
						onChange({ course_id: v === NONE ? null : Number(v), event_id: eventId })
					}>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Không liên kết' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE}>Không liên kết</SelectItem>
						{options?.courses.map((c) => (
							<SelectItem key={c.id} value={String(c.id)}>
								{c.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='space-y-1.5'>
				<Label>Sự kiện liên kết</Label>
				<Select
					disabled={loading}
					value={eventId != null ? String(eventId) : NONE}
					onValueChange={(v) =>
						onChange({ course_id: courseId, event_id: v === NONE ? null : Number(v) })
					}>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Không liên kết' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE}>Không liên kết</SelectItem>
						{options?.events.map((e) => (
							<SelectItem key={e.id} value={String(e.id)}>
								{e.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};

export default BoardLinkFields;
