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

type LinkType = "none" | "course" | "event";

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

/** Liên kết dự án với 1 khoá học hoặc 1 sự kiện: chọn loại rồi chọn mục theo loại đó. */
const BoardLinkFields: React.FC<BoardLinkFieldsProps> = ({
	options,
	loading,
	courseId,
	eventId,
	onChange,
}) => {
	const [type, setType] = React.useState<LinkType>(() =>
		courseId != null ? "course" : eventId != null ? "event" : "none",
	);

	const itemId = type === "course" ? courseId : type === "event" ? eventId : null;
	const items = type === "course" ? options?.courses : type === "event" ? options?.events : [];

	const handleTypeChange = (value: string) => {
		setType(value as LinkType);
		onChange({ course_id: null, event_id: null });
	};

	const handleItemChange = (value: string) => {
		const id = value === NONE ? null : Number(value);
		onChange({
			course_id: type === "course" ? id : null,
			event_id: type === "event" ? id : null,
		});
	};

	return (
		<div className='space-y-1.5'>
			<Label>Liên kết</Label>
			<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
				<Select disabled={loading} value={type} onValueChange={handleTypeChange}>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Loại dự án' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='none'>Không liên kết</SelectItem>
						<SelectItem value='course'>Khoá học</SelectItem>
						<SelectItem value='event'>Sự kiện</SelectItem>
					</SelectContent>
				</Select>

				<Select
					disabled={loading || type === "none"}
					value={itemId != null ? String(itemId) : NONE}
					onValueChange={handleItemChange}>
					<SelectTrigger className='w-full'>
						<SelectValue
							placeholder={type === "none" ? "Chọn loại trước" : "Chọn dự án"}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={NONE}>Không chọn</SelectItem>
						{items?.map((item) => (
							<SelectItem key={item.id} value={String(item.id)}>
								{item.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};

export default BoardLinkFields;
