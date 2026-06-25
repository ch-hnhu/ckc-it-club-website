import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import courseService, { type AssignmentGradeDTO } from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { CourseLessonRow } from "@/pages/learning/course-detail.types";

interface AssignmentGradeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	courseSlug: string;
	lesson: CourseLessonRow | null;
	/** Gọi sau khi lưu điểm thành công để parent refetch tiến độ học viên. */
	onSaved: () => void;
}

function AssignmentGradeDialog({
	open,
	onOpenChange,
	courseSlug,
	lesson,
	onSaved,
}: AssignmentGradeDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [students, setStudents] = useState<AssignmentGradeDTO[]>([]);
	const [scores, setScores] = useState<Record<number, string>>({});

	useEffect(() => {
		if (!open || !lesson) return;

		let cancelled = false;
		setIsLoading(true);

		courseService
			.getGrades(courseSlug, lesson.id)
			.then((res) => {
				if (cancelled) return;
				setStudents(res.data);
				setScores(
					Object.fromEntries(
						res.data.map((s) => [s.user_id, s.score === null ? "" : String(s.score)]),
					),
				);
			})
			.catch(() => {
				if (cancelled) return;
				toast.error("Không thể tải danh sách học viên.");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, lesson, courseSlug]);

	const handleScoreChange = useCallback((userId: number, value: string) => {
		setScores((prev) => ({ ...prev, [userId]: value }));
	}, []);

	const handleSave = useCallback(async () => {
		if (!lesson) return;

		setIsSaving(true);
		try {
			const grades = students.map((s) => {
				const raw = scores[s.user_id]?.trim() ?? "";
				return { user_id: s.user_id, score: raw === "" ? null : Number(raw) };
			});

			const res = await courseService.saveGrades(courseSlug, lesson.id, grades);
			setStudents(res.data);
			toast.success("Đã lưu điểm bài tập.");
			onSaved();
			onOpenChange(false);
		} catch (err) {
			const message =
				isAxiosError(err) && (err.response?.data as ApiErrorResponse | undefined)?.message
					? String((err.response?.data as ApiErrorResponse).message)
					: "Không thể lưu điểm. Vui lòng thử lại.";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	}, [courseSlug, lesson, students, scores, onSaved, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]'>
				<DialogHeader>
					<DialogTitle>Chấm bài tập</DialogTitle>
					<DialogDescription>
						{lesson
							? `Buổi ${lesson.order}: ${lesson.title}. Nhập điểm 0–100 cho từng học viên.`
							: "Nhập điểm 0–100 cho từng học viên."}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className='flex flex-col gap-2'>
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className='h-12 w-full' />
						))}
					</div>
				) : (
					<div className='overflow-hidden rounded-md border'>
						<Table>
							<TableHeader className='[&_th]:text-sm'>
								<TableRow>
									<TableHead className='min-w-[200px]'>Học viên</TableHead>
									<TableHead className='w-[100px]'>Điểm</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{students.length > 0 ? (
									students.map((s) => (
										<TableRow key={s.user_id}>
											<TableCell>
												<div className='flex items-center gap-2.5'>
													<Avatar className='h-7 w-7'>
														<AvatarImage src={s.avatar ?? undefined} />
														<AvatarFallback className='text-xs'>
															{(s.full_name ?? "?").charAt(0).toUpperCase()}
														</AvatarFallback>
													</Avatar>
													<div className='min-w-0'>
														<p className='truncate text-sm font-medium leading-none'>
															{s.full_name}
														</p>
														<p className='truncate text-xs text-muted-foreground'>
															{s.email}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<Input
													type='number'
													min={0}
													max={100}
													step={1}
													placeholder="—"
													className='h-8 w-20'
													value={scores[s.user_id] ?? ""}
													onChange={(e) => handleScoreChange(s.user_id, e.target.value)}
												/>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={2} className='h-24 text-center text-muted-foreground'>
											Khóa học chưa có học viên ghi danh track offline.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				)}

				<DialogFooter>
					<Button
						onClick={handleSave}
						disabled={isLoading || isSaving || students.length === 0}>
						{isSaving ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Save className='h-4 w-4' />
						)}
						Lưu điểm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default AssignmentGradeDialog;
