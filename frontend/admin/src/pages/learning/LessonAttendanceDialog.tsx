import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { CalendarCheck, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import courseService from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type {
	CourseEnrollmentRow,
	CourseLessonRow,
} from "@/pages/learning/course-detail.types";

function formatLessonLabel(lesson: CourseLessonRow): string {
	const title = lesson.title.trim();
	if (/^bu[ổô]i\s*\d+/iu.test(title)) return title;
	return `Buổi ${lesson.order}: ${title}`;
}

interface LessonAttendanceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	courseSlug: string;
	lesson: CourseLessonRow | null;
	/** Học viên track offline của khóa (ứng viên điểm danh). */
	students: CourseEnrollmentRow[];
	/** ID học viên đã điểm danh buổi này (khởi tạo trạng thái switch). */
	attendedUserIds: number[];
	/** ID học viên đã đăng ký "sẽ tham gia" buổi này (dự kiến có mặt). */
	registeredUserIds: number[];
	/** Gọi khi đóng hộp thoại nếu có thay đổi — để parent refetch số liệu. */
	onChanged: () => void;
}

/**
 * Điểm danh thủ công cho một buổi học offline — dùng khi máy quét QR lỗi hoặc cần
 * chỉnh lại buổi đã qua. Mỗi switch bật/tắt gọi API ngay (cập nhật lạc quan, tự hoàn
 * tác nếu lỗi); khi đóng có thay đổi thì báo parent tải lại để đồng bộ số buổi vắng.
 */
function LessonAttendanceDialog({
	open,
	onOpenChange,
	courseSlug,
	lesson,
	students,
	attendedUserIds,
	registeredUserIds,
	onChanged,
}: LessonAttendanceDialogProps) {
	const [present, setPresent] = useState<Set<number>>(new Set());
	const [pending, setPending] = useState<Set<number>>(new Set());
	const [dirty, setDirty] = useState(false);

	const registeredSet = useMemo(() => new Set(registeredUserIds), [registeredUserIds]);

	// Xếp học viên đã đăng ký "sẽ tham gia" lên đầu cho dễ theo dõi danh sách dự kiến.
	const sortedStudents = useMemo(
		() =>
			[...students].sort((a, b) => {
				const ra = registeredSet.has(a.user.id) ? 0 : 1;
				const rb = registeredSet.has(b.user.id) ? 0 : 1;
				return ra - rb;
			}),
		[students, registeredSet],
	);

	// Khởi tạo lại trạng thái mỗi khi mở hộp thoại cho một buổi khác. Không phụ thuộc
	// attendedUserIds (parent tạo mảng mới mỗi render) để tránh reset giữa chừng.
	useEffect(() => {
		if (!open) return;
		setPresent(new Set(attendedUserIds));
		setPending(new Set());
		setDirty(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, lesson?.id]);

	const handleToggle = async (userId: number, next: boolean) => {
		if (!lesson) return;
		setPending((p) => new Set(p).add(userId));
		setPresent((prev) => {
			const s = new Set(prev);
			if (next) s.add(userId);
			else s.delete(userId);
			return s;
		});
		try {
			await courseService.toggleAttendance(courseSlug, lesson.id, userId, next);
			setDirty(true);
		} catch (err) {
			setPresent((prev) => {
				const s = new Set(prev);
				if (next) s.delete(userId);
				else s.add(userId);
				return s;
			});
			const message =
				isAxiosError(err) && (err.response?.data as ApiErrorResponse | undefined)?.message
					? String((err.response?.data as ApiErrorResponse).message)
					: "Không thể cập nhật điểm danh.";
			toast.error(message, { position: "top-right" });
		} finally {
			setPending((p) => {
				const s = new Set(p);
				s.delete(userId);
				return s;
			});
		}
	};

	const handleOpenChange = (o: boolean) => {
		if (!o && dirty) onChanged();
		onOpenChange(o);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className='max-h-[calc(100dvh-2rem)] overflow-hidden sm:max-w-[460px]'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<ClipboardCheck className='h-5 w-5' />
						Điểm danh thủ công
					</DialogTitle>
					<DialogDescription>
						{lesson
							? `${formatLessonLabel(lesson)}. Bật/tắt để đánh dấu học viên có mặt — dùng khi máy quét QR lỗi.`
							: "Đánh dấu học viên có mặt."}
					</DialogDescription>
				</DialogHeader>

				<div className='flex items-center justify-between gap-4 text-sm text-muted-foreground'>
					<span className='flex items-center gap-1.5'>
						<CalendarCheck className='h-3.5 w-3.5' />
						Đã đăng ký:{" "}
						<span className='font-medium text-foreground'>
							{registeredSet.size}
						</span>
					</span>
					<span>
						Có mặt:{" "}
						<span className='font-medium text-foreground'>
							{present.size}/{students.length}
						</span>
					</span>
				</div>

				{students.length > 0 ? (
					<ScrollArea className='max-h-[52vh] pr-3'>
						<div className='space-y-1'>
							{sortedStudents.map((s) => {
								const registered = registeredSet.has(s.user.id);
								return (
									<label
										key={s.id}
										className='flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/60'>
										<Avatar className='h-8 w-8'>
											<AvatarImage src={s.user.avatar ?? undefined} />
											<AvatarFallback className='text-xs'>
												{s.user.full_name.charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className='min-w-0 flex-1'>
											<div className='flex items-center gap-2'>
												<p className='truncate text-sm font-medium leading-none'>
													{s.user.full_name}
												</p>
												{registered && (
													<Badge
														variant='outline'
														className='shrink-0 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] font-medium text-amber-700'>
														Sẽ tham gia
													</Badge>
												)}
											</div>
											<p className='truncate text-xs text-muted-foreground'>
												{s.user.email}
											</p>
										</div>
										<Switch
											checked={present.has(s.user.id)}
											disabled={pending.has(s.user.id)}
											onCheckedChange={(v) =>
												void handleToggle(s.user.id, v)
											}
										/>
									</label>
								);
							})}
						</div>
					</ScrollArea>
				) : (
					<div className='flex h-32 items-center justify-center text-center text-sm text-muted-foreground'>
						Chưa có học viên offline nào ghi danh.
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

export default LessonAttendanceDialog;
