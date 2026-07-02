import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
	/** Gọi sau khi lưu kết quả thành công để parent refetch tiến độ học viên. */
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
	const [search, setSearch] = useState("");
	/** true = đạt, null = chưa chấm */
	const [passed, setPassed] = useState<Record<number, boolean | null>>({});

	useEffect(() => {
		if (!open || !lesson) return;

		let cancelled = false;
		setIsLoading(true);
		setSearch("");

		courseService
			.getGrades(courseSlug, lesson.id)
			.then((res) => {
				if (cancelled) return;
				setStudents(res.data);
				setPassed(Object.fromEntries(res.data.map((s) => [s.user_id, s.passed])));
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

	const filteredStudents = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return students;
		return students.filter(
			(s) =>
				s.full_name?.toLowerCase().includes(q) ||
				s.email?.toLowerCase().includes(q),
		);
	}, [students, search]);

	const handleToggle = useCallback((userId: number, checked: boolean) => {
		setPassed((prev) => ({ ...prev, [userId]: checked ? true : null }));
	}, []);

	const handleSave = useCallback(async () => {
		if (!lesson) return;

		setIsSaving(true);
		try {
			const grades = students.map((s) => ({
				user_id: s.user_id,
				passed: passed[s.user_id] ?? null,
			}));

			const res = await courseService.saveGrades(courseSlug, lesson.id, grades);
			setStudents(res.data);
			toast.success("Đã lưu kết quả bài tập.");
			onSaved();
			onOpenChange(false);
		} catch (err) {
			const message =
				isAxiosError(err) && (err.response?.data as ApiErrorResponse | undefined)?.message
					? String((err.response?.data as ApiErrorResponse).message)
					: "Không thể lưu kết quả. Vui lòng thử lại.";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	}, [courseSlug, lesson, students, passed, onSaved, onOpenChange]);

	const passedCount = Object.values(passed).filter((v) => v === true).length;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-[560px]'>
				<DialogHeader>
					<DialogTitle>Chấm bài tập</DialogTitle>
					<DialogDescription>
						{lesson
							? `${lesson.title}. Đánh dấu học viên đạt yêu cầu bài tập.`
							: "Đánh dấu học viên đạt yêu cầu bài tập."}
					</DialogDescription>
				</DialogHeader>

				<div className='relative'>
					<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
					<Input
						placeholder='Tìm theo họ tên hoặc email...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className='pl-9'
					/>
				</div>

				{isLoading ? (
					<div className='flex flex-col gap-2'>
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className='h-12 w-full' />
						))}
					</div>
				) : (
					<div className='overflow-auto rounded-md border'>
						<Table>
							<TableHeader className='[&_th]:text-sm'>
								<TableRow>
									<TableHead className='min-w-[200px]'>Học viên</TableHead>
									<TableHead className='w-[100px] text-center'>Đạt</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredStudents.length > 0 ? (
									filteredStudents.map((s) => {
										const isPassed = passed[s.user_id] === true;
										return (
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
												<TableCell className='text-center'>
													<div className='flex items-center justify-center gap-2'>
														<Checkbox
															checked={isPassed}
															onCheckedChange={(v) =>
																handleToggle(s.user_id, Boolean(v))
															}
														/>
														{isPassed && (
															<Badge
																variant='outline'
																className='rounded-full border-green-500/30 bg-green-500/10 text-green-700'>
																Đạt
															</Badge>
														)}
													</div>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell
											colSpan={2}
											className='h-24 text-center text-muted-foreground'>
											{students.length === 0
												? "Khóa học chưa có học viên ghi danh track offline."
												: "Không tìm thấy học viên phù hợp."}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				)}

				<DialogFooter className='items-center gap-2 sm:justify-between'>
					<p className='text-sm text-muted-foreground'>
						{passedCount}/{students.length} học viên đạt
					</p>
					<Button
						onClick={handleSave}
						disabled={isLoading || isSaving || students.length === 0}>
						{isSaving ? (
							<Loader2 className='h-4 w-4 animate-spin' />
						) : (
							<Save className='h-4 w-4' />
						)}
						Lưu kết quả
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default AssignmentGradeDialog;
