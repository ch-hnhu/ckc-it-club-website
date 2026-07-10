import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
	AlignLeft,
	ArrowLeft,
	BookOpen,
	CalendarCheck,
	CalendarClock,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ClipboardCheck,
	FilePen,
	FileText,
	GraduationCap,
	MoreHorizontal,
	Paperclip,
	Pencil,
	PlayCircle,
	ScanLine,
	Search,
	UserCheck,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";
import { COURSE_STATUS_MAP, type CourseStatus } from "@/pages/learning/course-meta";
import courseService, { type LessonFull } from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { AdminCourseDetail, CourseLessonRow } from "@/pages/learning/course-detail.types";
import AssignmentGradeDialog from "@/pages/learning/AssignmentGradeDialog";
import LessonCheckInDialog from "@/pages/learning/LessonCheckInDialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pageSizeOptions = [10, 20, 30, 50];

function formatDateTimeShort(value: string | null | undefined) {
	if (!value) return "--";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "--";
	const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
	return `${time} ${d.toLocaleDateString("vi-VN")}`;
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
	if (!start && !end) return "--";
	if (!start) return formatDateTimeShort(end);
	if (!end) return formatDateTimeShort(start);
	return `${formatDateTimeShort(start)} → ${formatDateTimeShort(end)}`;
}

function lessonLabel(order: number, title: string) {
	const t = title.trim();
	return /^bu[ổô]i\s*\d+/iu.test(t) ? t : `Buổi ${order}: ${t}`;
}

function InfoRow({
	icon,
	label,
	value,
	highlight,
	className,
}: {
	icon?: React.ReactNode;
	label: React.ReactNode;
	value: React.ReactNode;
	highlight?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-1 rounded-lg border p-4",
				highlight ? "border-sky-500/30 bg-sky-500/10" : "bg-muted/20",
				className,
			)}>
			<p
				className={cn(
					"flex items-center gap-1.5 text-xs font-medium uppercase",
					highlight ? "text-sky-700" : "text-muted-foreground",
				)}>
				{icon}
				{label}
			</p>
			<div className={cn("text-sm font-medium break-words", highlight && "text-sky-800")}>
				{value}
			</div>
		</div>
	);
}

type AttendanceFilter = "all" | "attended" | "not_attended";

const attendanceFilterOptions: Array<{ value: AttendanceFilter; label: string }> = [
	{ value: "all", label: "Tất cả" },
	{ value: "attended", label: "Đã điểm danh" },
	{ value: "not_attended", label: "Chưa điểm danh" },
];

// ─── Component ───────────────────────────────────────────────────────────────

function LessonDetailPage() {
	const { slug = "", lessonId = "" } = useParams();
	const lessonIdNum = Number(lessonId);
	const navigate = useNavigate();
	const { hasPermission } = useAuth();

	const [course, setCourse] = useState<AdminCourseDetail | null>(null);
	const [lesson, setLesson] = useState<LessonFull | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [checkInOpen, setCheckInOpen] = useState(false);

	// Toolbar
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<AttendanceFilter>("all");
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);

	// Điểm danh (trạng thái có mặt buổi này)
	const [present, setPresent] = useState<Set<number>>(new Set());
	const [, setPendingAttendance] = useState<Set<number>>(new Set());
	const [manualTarget, setManualTarget] = useState<{ id: number; name: string } | null>(null);
	const [manualNote, setManualNote] = useState("");
	const [isManualSubmitting, setIsManualSubmitting] = useState(false);

	// Chấm bài tập (true = đạt, null = chưa chấm) — chỉ dùng để hiển thị
	const [passed, setPassed] = useState<Record<number, boolean | null>>({});
	const [gradeOpen, setGradeOpen] = useState(false);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Khóa học", link: "/courses" },
		{ title: course?.title ?? "Khóa học", link: `/courses/${slug}?tab=lessons` },
		{ title: lesson ? lessonLabel(lesson.order, lesson.title) : "Chi tiết buổi học" },
	]);

	const loadAll = useCallback(
		async (opts?: { silent?: boolean }) => {
			if (!opts?.silent) setLoading(true);
			try {
				const [courseRes, lessonRes] = await Promise.all([
					courseService.getCourse(slug),
					courseService.getLesson(slug, lessonIdNum),
				]);
				setCourse(courseRes.data);
				setLesson(lessonRes.data);
				setPresent(
					new Set(
						courseRes.data.attendances
							.filter((a) => a.lesson_id === lessonIdNum)
							.map((a) => a.user_id),
					),
				);
				setNotFound(false);

				if (courseRes.data.max_offline_slots !== null && lessonRes.data.assignment_url) {
					try {
						const gradesRes = await courseService.getGrades(slug, lessonIdNum);
						setPassed(
							Object.fromEntries(
								gradesRes.data.map((s) => [
									s.user_id,
									s.score === null ? null : s.score >= 1 ? true : false,
								]),
							),
						);
					} catch {
						/* bỏ qua — phần điểm không chặn cả trang */
					}
				} else {
					setPassed({});
				}
			} catch (err) {
				if (isAxiosError(err) && err.response?.status === 404) {
					setNotFound(true);
				} else {
					toast.error("Không thể tải thông tin buổi học.");
					setNotFound(true);
				}
			} finally {
				if (!opts?.silent) setLoading(false);
			}
		},
		[slug, lessonIdNum],
	);

	useEffect(() => {
		void loadAll();
	}, [loadAll]);

	useEffect(() => {
		setPage(1);
	}, [search, statusFilter, perPage]);

	const offlineStudents = useMemo(
		() => course?.enrollments.filter((e) => e.track === "offline") ?? [],
		[course],
	);

	const offlineLessons = useMemo(
		() => course?.lessons.filter((l) => l.session_start) ?? [],
		[course],
	);

	const activeLessonId = useMemo(() => {
		const now = new Date();
		return (
			offlineLessons.find((l) => !l.session_end || new Date(l.session_end) > now)?.id ?? null
		);
	}, [offlineLessons]);

	const registeredSet = useMemo(
		() =>
			new Set(
				(course?.registrations ?? [])
					.filter((r) => r.lesson_id === lessonIdNum)
					.map((r) => r.user_id),
			),
		[course, lessonIdNum],
	);

	const isOffline = !!lesson?.session_start;
	const isActive = lessonIdNum === activeLessonId;
	const isPast = useMemo(() => {
		if (!lesson?.session_end) return false;
		return new Date(lesson.session_end) < new Date();
	}, [lesson]);
	const isHappening = useMemo(() => {
		if (!lesson?.session_start || !lesson?.session_end) return false;
		const now = new Date();
		return new Date(lesson.session_start) <= now && new Date(lesson.session_end) >= now;
	}, [lesson]);
	const hasOfflineStudents = offlineStudents.length > 0;
	const canManualAttendance = isOffline && (isActive || isPast) && hasOfflineStudents;
	const canQr = isOffline && isActive && hasOfflineStudents;
	const hasOfflineCourse = course ? course.max_offline_slots !== null : false;
	const hasAssignment = !!lesson?.assignment_url;
	const canGradeAssignment = hasOfflineCourse && hasAssignment;
	const canManageQuiz = hasPermission("quizzes.manage");

	const registeredStudents = useMemo(
		() => offlineStudents.filter((e) => registeredSet.has(e.user.id)),
		[offlineStudents, registeredSet],
	);

	// Lọc + tìm kiếm (chỉ trên danh sách đã đăng ký buổi học).
	const filteredStudents = useMemo(() => {
		const normalized = search.trim().toLowerCase();
		return registeredStudents.filter((e) => {
			const matchesSearch =
				!normalized ||
				e.user.full_name.toLowerCase().includes(normalized) ||
				e.user.email.toLowerCase().includes(normalized);
			const attended = present.has(e.user.id);
			const matchesStatus =
				statusFilter === "all" ||
				(statusFilter === "attended" && attended) ||
				(statusFilter === "not_attended" && !attended);
			return matchesSearch && matchesStatus;
		});
	}, [registeredStudents, search, statusFilter, present]);

	const lastPage = Math.max(1, Math.ceil(filteredStudents.length / perPage));
	const currentPage = Math.min(page, lastPage);
	const paginatedStudents = filteredStudents.slice(
		(currentPage - 1) * perPage,
		currentPage * perPage,
	);

	const lessonRow = useMemo<CourseLessonRow | null>(
		() => course?.lessons.find((l) => l.id === lessonIdNum) ?? null,
		[course, lessonIdNum],
	);

	const attendanceMap = useMemo(
		() =>
			new Map(
				(course?.attendances ?? [])
					.filter((a) => a.lesson_id === lessonIdNum)
					.map((a) => [a.user_id, a]),
			),
		[course, lessonIdNum],
	);

	const handleToggleAttendance = async (userId: number, next: boolean, note?: string) => {
		if (!lesson) return;
		setPendingAttendance((p) => new Set(p).add(userId));
		setPresent((prev) => {
			const s = new Set(prev);
			if (next) s.add(userId);
			else s.delete(userId);
			return s;
		});
		try {
			await courseService.toggleAttendance(slug, lesson.id, userId, next, note);
			// Tải lại để đồng bộ chi tiết điểm danh (ghi chú, kiểu, người ghi nhận) từ server.
			await loadAll({ silent: true });
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
			setPendingAttendance((p) => {
				const s = new Set(p);
				s.delete(userId);
				return s;
			});
		}
	};

	const handleManualCheckIn = async () => {
		if (!manualTarget) return;
		setIsManualSubmitting(true);
		try {
			await handleToggleAttendance(manualTarget.id, true, manualNote.trim() || undefined);
			toast.success(`Đã điểm danh cho ${manualTarget.name}.`, { position: "top-right" });
			setManualTarget(null);
			setManualNote("");
		} finally {
			setIsManualSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-10 w-28' />
				<Skeleton className='h-48 w-full rounded-xl' />
				<Skeleton className='h-96 w-full rounded-xl' />
			</div>
		);
	}

	if (notFound || !course || !lesson) {
		return (
			<div className='flex min-h-[420px] flex-col items-center justify-center gap-3 p-6 text-center'>
				<GraduationCap className='h-12 w-12 text-muted-foreground' />
				<h2 className='text-xl font-semibold'>Không tìm thấy buổi học</h2>
				<p className='text-sm text-muted-foreground'>
					Buổi học không tồn tại hoặc không thuộc khóa học này.
				</p>
				<Button variant='outline' onClick={() => navigate(`/courses/${slug}?tab=lessons`)}>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Button>
			</div>
		);
	}

	const status = COURSE_STATUS_MAP[lesson.status as CourseStatus];
	const attendedCount = present.size;
	const hasResources =
		lesson.video_url || lesson.document || lesson.resource_url || lesson.assignment_url;

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button
				variant='outline'
				onClick={() => navigate(`/courses/${slug}?tab=lessons`)}
				className='w-fit'>
				<ArrowLeft className='h-4 w-4' />
				Quay lại
			</Button>

			<div className='flex flex-col gap-6'>
				{/* Info card */}
				<Card className='shadow-sm'>
					<CardHeader className='pb-2'>
						<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
							<div className='flex items-start gap-4'>
								<div className='flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted'>
									<BookOpen className='h-5 w-5 text-muted-foreground' />
								</div>
								<div>
									<div className='mb-1 flex flex-wrap items-center gap-2'>
										<Badge
											variant='outline'
											className={cn(
												"rounded-full px-3 py-1",
												status.className,
											)}>
											{status.label}
										</Badge>
										{isOffline ? (
											<Badge
												variant='outline'
												className='border-orange-500/30 bg-orange-500/10 text-orange-700'>
												Buổi offline
											</Badge>
										) : (
											<Badge
												variant='outline'
												className='border-cyan-500/30 bg-cyan-500/10 text-cyan-700'>
												Chỉ online
											</Badge>
										)}
										{isHappening && isOffline && (
											<Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>
												Đang diễn ra
											</Badge>
										)}
									</div>
									<CardTitle className='text-lg leading-snug'>
										{lessonLabel(lesson.order, lesson.title)}
									</CardTitle>
									<CardDescription>Thông tin buổi học</CardDescription>
								</div>
							</div>
							<Button
								type='button'
								size='sm'
								variant='outline'
								onClick={() =>
									navigate(`/courses/${slug}/lessons/${lesson.id}/edit`)
								}
								className='h-8 w-fit self-start'>
								<Pencil className='h-4 w-4' />
								Sửa
							</Button>
						</div>
					</CardHeader>
					<CardContent className='flex flex-col gap-4'>
						{/* Thông tin cốt lõi */}
						<div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
							<InfoRow
								icon={<CalendarClock className='h-3.5 w-3.5' />}
								label='Lịch buổi học'
								value={
									isOffline
										? formatDateRange(lesson.session_start, lesson.session_end)
										: "Không xếp lịch (online)"
								}
							/>
							<InfoRow
								icon={<CalendarCheck className='h-3.5 w-3.5' />}
								label='Hạn nộp bài tập'
								value={
									lesson.assignment_deadline
										? formatDateTimeShort(lesson.assignment_deadline)
										: "--"
								}
							/>
							<InfoRow
								highlight
								icon={<ClipboardCheck className='h-3.5 w-3.5' />}
								label='Điểm danh offline'
								value={`${attendedCount}/${registeredStudents.length} đã điểm danh`}
							/>
						</div>

						{/* Tài nguyên */}
						{hasResources && (
							<div className='rounded-lg border p-4'>
								<p className='flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground'>
									<Paperclip className='h-3.5 w-3.5' />
									Tài nguyên buổi học
								</p>
								<div className='mt-2 flex flex-wrap gap-2'>
									{lesson.video_url && (
										<Button asChild size='sm' variant='outline' className='h-8'>
											<a
												href={lesson.video_url}
												target='_blank'
												rel='noreferrer'>
												<PlayCircle className='h-4 w-4' />
												Video bài học
											</a>
										</Button>
									)}
									{lesson.document && (
										<Button asChild size='sm' variant='outline' className='h-8'>
											<a
												href={lesson.document}
												target='_blank'
												rel='noreferrer'>
												<FileText className='h-4 w-4' />
												Tài liệu
											</a>
										</Button>
									)}
									{lesson.resource_url && (
										<Button asChild size='sm' variant='outline' className='h-8'>
											<a
												href={lesson.resource_url}
												target='_blank'
												rel='noreferrer'>
												<Paperclip className='h-4 w-4' />
												Tài nguyên
											</a>
										</Button>
									)}
									{lesson.assignment_url && (
										<Button asChild size='sm' variant='outline' className='h-8'>
											<a
												href={lesson.assignment_url}
												target='_blank'
												rel='noreferrer'>
												<BookOpen className='h-4 w-4' />
												Bài tập
											</a>
										</Button>
									)}
								</div>
							</div>
						)}

						{/* Mô tả */}
						<div className='rounded-lg border p-4'>
							<p className='flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground'>
								<AlignLeft className='h-3.5 w-3.5' />
								Mô tả
							</p>
							<p className='mt-1 whitespace-pre-line text-sm leading-relaxed'>
								{lesson.description || "--"}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Học viên offline */}
				<div className='flex flex-col gap-4'>
					<div className='flex items-center gap-2'>
						<Users className='h-5 w-5' />
						<h3 className='text-base font-semibold'>
							Danh sách sinh viên tham gia buổi học
						</h3>
					</div>

					{!isOffline ? (
						<div className='flex h-28 items-center justify-center rounded-md border border-dashed text-center text-sm text-muted-foreground'>
							Buổi học này chỉ có hình thức online — không có điểm danh offline.
						</div>
					) : (
						<>
							{!canManualAttendance && (
								<p className='rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700'>
									{!hasOfflineStudents
										? "Khóa học chưa có học viên track offline."
										: "Buổi học chưa đến lượt diễn ra — chỉ điểm danh được buổi đang diễn ra hoặc đã qua."}
								</p>
							)}

							{/* Toolbar */}
							<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex flex-1 items-center gap-2'>
									<div className='relative flex-1 sm:max-w-sm'>
										<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
										<Input
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											placeholder='Tìm theo họ tên hoặc email...'
											className='h-8 pl-9'
										/>
									</div>
									<Select
										value={statusFilter}
										onValueChange={(v) =>
											setStatusFilter(v as AttendanceFilter)
										}>
										<SelectTrigger className='h-8 w-[170px]'>
											<SelectValue placeholder='Lọc trạng thái' />
										</SelectTrigger>
										<SelectContent>
											{attendanceFilterOptions.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className='flex items-center gap-2'>
									{canQr && (
										<Button
											size='sm'
											variant='outline'
											className='h-8'
											onClick={() => setCheckInOpen(true)}>
											<ScanLine className='h-4 w-4' />
											Điểm danh
										</Button>
									)}
									{canManageQuiz && (
										<Button
											size='sm'
											variant='outline'
											className='h-8'
											onClick={() =>
												navigate(
													`/learning/courses/${slug}/lessons/${lessonIdNum}/quiz/create`,
												)
											}>
											<FilePen className='h-4 w-4' />
											Tạo Quiz
										</Button>
									)}
									{canGradeAssignment && (isActive || isPast) && (
										<Button
											size='sm'
											variant='outline'
											className='h-8'
											onClick={() => setGradeOpen(true)}>
											<FilePen className='h-4 w-4' />
											Chấm bài
										</Button>
									)}
								</div>
							</div>

							{/* Table */}
							<div className='overflow-hidden rounded-md border'>
								<Table>
									<TableHeader>
										<TableRow className='bg-muted/30 hover:bg-muted/30 [&>th]:text-sm'>
											<TableHead className='w-[72px]'>STT</TableHead>
											<TableHead>Họ tên</TableHead>
											<TableHead>Email</TableHead>
											{canGradeAssignment && (
												<TableHead className='w-[90px] text-center'>
													Bài tập
												</TableHead>
											)}
											<TableHead className='w-[110px]'>Điểm danh</TableHead>
											<TableHead>Ghi chú</TableHead>
											<TableHead className='w-[52px]' />
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedStudents.map((e, index) => {
											return (
												<TableRow
													key={e.id}
													className='transition-colors duration-150 hover:bg-muted/40'>
													<TableCell className='text-muted-foreground'>
														{(currentPage - 1) * perPage + index + 1}
													</TableCell>
													<TableCell>
														<div className='flex items-center gap-2.5'>
															<Avatar className='h-7 w-7'>
																<AvatarImage
																	src={e.user.avatar ?? undefined}
																/>
																<AvatarFallback className='text-xs'>
																	{e.user.full_name
																		.charAt(0)
																		.toUpperCase()}
																</AvatarFallback>
															</Avatar>
															<div className='font-medium'>
																{e.user.full_name}
															</div>
														</div>
													</TableCell>
													<TableCell className='text-muted-foreground'>
														{e.user.email}
													</TableCell>
													{canGradeAssignment && (
														<TableCell className='text-center'>
															<div className='flex items-center justify-center gap-2'>
																<Checkbox
																	checked={
																		passed[e.user.id] === true
																	}
																	disabled
																/>
																{passed[e.user.id] === true && (
																	<Badge
																		variant='outline'
																		className='rounded-full border-green-500/30 bg-green-500/10 text-green-700'>
																		Đạt
																	</Badge>
																)}
															</div>
														</TableCell>
													)}
													<TableCell>
														{(() => {
															const att = attendanceMap.get(
																e.user.id,
															);
															if (!att)
																return (
																	<span className='text-sm text-muted-foreground'>
																		--
																	</span>
																);
															return (
																<div className='space-y-0.5 text-sm'>
																	<p>
																		{att.attended_at
																			? formatDateTimeShort(
																					att.attended_at,
																				)
																			: "--"}
																	</p>
																	<p className='text-xs text-muted-foreground'>
																		{att.type === "qr"
																			? "Quét QR"
																			: "Thủ công"}
																		{att.recorded_by_name
																			? ` · bởi ${att.recorded_by_name}`
																			: ""}
																	</p>
																</div>
															);
														})()}
													</TableCell>
													<TableCell className='text-sm text-muted-foreground'>
														{attendanceMap.get(e.user.id)?.note ?? (
															<span className='text-border'>--</span>
														)}
													</TableCell>

													<TableCell>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant='ghost'
																	className='h-8 w-8 p-0'>
																	<MoreHorizontal className='h-4 w-4' />
																	<span className='sr-only'>
																		Mở thao tác
																	</span>
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent
																align='end'
																className='w-[200px]'>
																<DropdownMenuItem
																	disabled={
																		!canManualAttendance ||
																		present.has(e.user.id)
																	}
																	onClick={() =>
																		setManualTarget({
																			id: e.user.id,
																			name: e.user.full_name,
																		})
																	}>
																	<UserCheck className='h-4 w-4' />
																	Điểm danh thủ công
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</TableRow>
											);
										})}
										{paginatedStudents.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={canGradeAssignment ? 7 : 6}
													className='h-40 text-center'>
													<div className='flex flex-col items-center gap-2'>
														<div className='text-sm font-medium'>
															Không có học viên phù hợp.
														</div>
														<p className='text-sm text-muted-foreground'>
															{registeredStudents.length > 0
																? "Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."
																: "Chưa có học viên nào đăng ký tham gia buổi học này."}
														</p>
													</div>
												</TableCell>
											</TableRow>
										) : null}
									</TableBody>
									<TableFooter className='bg-transparent'>
										<TableRow>
											<TableCell colSpan={canGradeAssignment ? 7 : 6}>
												<div className='flex flex-col gap-3 px-2 py-1 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
														Đang hiện {paginatedStudents.length} trên
														tổng {filteredStudents.length} học viên.
														<span className='text-border'>|</span>
														<span>
															Đã điểm danh{" "}
															<span className='font-medium text-foreground'>
																{attendedCount}/
																{registeredStudents.length}
															</span>
														</span>
													</div>
													<div className='flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6'>
														<div className='flex items-center gap-2'>
															<p className='text-sm font-medium'>
																Rows per page
															</p>
															<Select
																value={`${perPage}`}
																onValueChange={(value) =>
																	setPerPage(Number(value))
																}>
																<SelectTrigger className='h-8 w-[70px]'>
																	<SelectValue
																		placeholder={perPage}
																	/>
																</SelectTrigger>
																<SelectContent side='top'>
																	{pageSizeOptions.map(
																		(pageSize) => (
																			<SelectItem
																				key={pageSize}
																				value={`${pageSize}`}>
																				{pageSize}
																			</SelectItem>
																		),
																	)}
																</SelectContent>
															</Select>
														</div>
														<div className='flex w-[100px] items-center justify-center text-sm font-medium'>
															Trang {currentPage} / {lastPage}
														</div>
														<div className='flex items-center gap-2'>
															<Button
																variant='outline'
																className='hidden h-8 w-8 p-0 lg:flex'
																onClick={() => setPage(1)}
																disabled={currentPage === 1}>
																<ChevronsLeft className='h-4 w-4' />
															</Button>
															<Button
																variant='outline'
																className='h-8 w-8 p-0'
																onClick={() =>
																	setPage((prev) =>
																		Math.max(1, prev - 1),
																	)
																}
																disabled={currentPage === 1}>
																<ChevronLeft className='h-4 w-4' />
															</Button>
															<Button
																variant='outline'
																className='h-8 w-8 p-0'
																onClick={() =>
																	setPage((prev) =>
																		Math.min(
																			lastPage,
																			prev + 1,
																		),
																	)
																}
																disabled={currentPage === lastPage}>
																<ChevronRight className='h-4 w-4' />
															</Button>
															<Button
																variant='outline'
																className='hidden h-8 w-8 p-0 lg:flex'
																onClick={() => setPage(lastPage)}
																disabled={currentPage === lastPage}>
																<ChevronsRight className='h-4 w-4' />
															</Button>
														</div>
													</div>
												</div>
											</TableCell>
										</TableRow>
									</TableFooter>
								</Table>
							</div>
						</>
					)}
				</div>
			</div>

			<LessonCheckInDialog
				open={checkInOpen}
				onOpenChange={setCheckInOpen}
				courseSlug={slug}
				lesson={lessonRow}
				onCheckedIn={() => void loadAll({ silent: true })}
			/>

			<AssignmentGradeDialog
				open={gradeOpen}
				onOpenChange={setGradeOpen}
				courseSlug={slug}
				lesson={lessonRow}
				onSaved={() => {
					void loadAll({ silent: true });
					setPassed({});
				}}
			/>

			<AlertDialog
				open={Boolean(manualTarget)}
				onOpenChange={(open) => {
					if (!open) {
						setManualTarget(null);
						setManualNote("");
					}
				}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Điểm danh thủ công?</AlertDialogTitle>
						<AlertDialogDescription>
							Xác nhận điểm danh cho{" "}
							<span className='font-semibold text-foreground'>
								{manualTarget?.name ?? "học viên"}
							</span>{" "}
							mà không cần quét mã QR.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='px-1 pb-2'>
						<Textarea
							placeholder='Ghi chú (không bắt buộc)'
							value={manualNote}
							onChange={(e) => setManualNote(e.target.value)}
							disabled={isManualSubmitting}
							maxLength={500}
							rows={3}
							className='resize-none'
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isManualSubmitting}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(ev) => {
								ev.preventDefault();
								void handleManualCheckIn();
							}}
							disabled={isManualSubmitting}>
							{isManualSubmitting ? "Đang điểm danh..." : "Điểm danh"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

export default LessonDetailPage;
