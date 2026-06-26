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
	FileText,
	GraduationCap,
	Loader2,
	Paperclip,
	Pencil,
	PlayCircle,
	Save,
	ScanLine,
	Search,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { cn } from "@/lib/utils";
import { COURSE_STATUS_MAP, type CourseStatus } from "@/pages/learning/course-meta";
import courseService, { type AssignmentGradeDTO, type LessonFull } from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { AdminCourseDetail, CourseLessonRow } from "@/pages/learning/course-detail.types";
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

type AttendanceFilter = "all" | "attended" | "not_attended" | "registered";

const attendanceFilterOptions: Array<{ value: AttendanceFilter; label: string }> = [
	{ value: "all", label: "Tất cả học viên" },
	{ value: "registered", label: "Sẽ tham gia" },
	{ value: "attended", label: "Đã điểm danh" },
	{ value: "not_attended", label: "Chưa điểm danh" },
];

// ─── Component ───────────────────────────────────────────────────────────────

function LessonDetailPage() {
	const { slug = "", lessonId = "" } = useParams();
	const lessonIdNum = Number(lessonId);
	const navigate = useNavigate();

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
	const [pendingAttendance, setPendingAttendance] = useState<Set<number>>(new Set());

	// Chấm bài tập
	const [scores, setScores] = useState<Record<number, string>>({});
	const [isSavingGrades, setIsSavingGrades] = useState(false);

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

				try {
					const gradesRes = await courseService.getGrades(slug, lessonIdNum);
					setScores(
						Object.fromEntries(
							gradesRes.data.map((s) => [
								s.user_id,
								s.score === null ? "" : String(s.score),
							]),
						),
					);
				} catch {
					/* bỏ qua — phần điểm không chặn cả trang */
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
		return offlineLessons.find((l) => !l.session_end || new Date(l.session_end) > now)?.id ?? null;
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
	const hasOfflineStudents = offlineStudents.length > 0;
	const canManualAttendance = isOffline && (isActive || isPast) && hasOfflineStudents;
	const canQr = isOffline && isActive && hasOfflineStudents;
	const hasAssignment = !!lesson?.assignment_url;

	// Lọc + sắp xếp (đăng ký "sẽ tham gia" lên đầu) + tìm kiếm.
	const filteredStudents = useMemo(() => {
		const normalized = search.trim().toLowerCase();
		return [...offlineStudents]
			.filter((e) => {
				const matchesSearch =
					!normalized ||
					e.user.full_name.toLowerCase().includes(normalized) ||
					e.user.email.toLowerCase().includes(normalized);
				const attended = present.has(e.user.id);
				const registered = registeredSet.has(e.user.id);
				const matchesStatus =
					statusFilter === "all" ||
					(statusFilter === "attended" && attended) ||
					(statusFilter === "not_attended" && !attended) ||
					(statusFilter === "registered" && registered);
				return matchesSearch && matchesStatus;
			})
			.sort((a, b) => {
				const ra = registeredSet.has(a.user.id) ? 0 : 1;
				const rb = registeredSet.has(b.user.id) ? 0 : 1;
				return ra - rb;
			});
	}, [offlineStudents, search, statusFilter, present, registeredSet]);

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

	const handleToggleAttendance = async (userId: number, next: boolean) => {
		if (!lesson) return;
		setPendingAttendance((p) => new Set(p).add(userId));
		setPresent((prev) => {
			const s = new Set(prev);
			if (next) s.add(userId);
			else s.delete(userId);
			return s;
		});
		try {
			await courseService.toggleAttendance(slug, lesson.id, userId, next);
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

	const handleSaveGrades = async () => {
		if (!lesson) return;
		setIsSavingGrades(true);
		try {
			const grades = offlineStudents.map((e) => {
				const raw = scores[e.user.id]?.trim() ?? "";
				return { user_id: e.user.id, score: raw === "" ? null : Number(raw) };
			});
			const res = await courseService.saveGrades(slug, lesson.id, grades);
			setScores(
				Object.fromEntries(
					res.data.map((s: AssignmentGradeDTO) => [
						s.user_id,
						s.score === null ? "" : String(s.score),
					]),
				),
			);
			toast.success("Đã lưu điểm bài tập.", { position: "top-right" });
		} catch (err) {
			const message =
				isAxiosError(err) && (err.response?.data as ApiErrorResponse | undefined)?.message
					? String((err.response?.data as ApiErrorResponse).message)
					: "Không thể lưu điểm. Vui lòng thử lại.";
			toast.error(message, { position: "top-right" });
		} finally {
			setIsSavingGrades(false);
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
										<Badge variant='secondary' className='border-transparent'>
											Buổi {lesson.order}
										</Badge>
										<Badge
											variant='outline'
											className={cn("rounded-full px-3 py-1", status.className)}>
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
										{isActive && isOffline && (
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
								value={`${attendedCount}/${offlineStudents.length} điểm danh · ${registeredSet.size} sẽ tham gia`}
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
											<a href={lesson.video_url} target='_blank' rel='noreferrer'>
												<PlayCircle className='h-4 w-4' />
												Video bài học
											</a>
										</Button>
									)}
									{lesson.document && (
										<Button asChild size='sm' variant='outline' className='h-8'>
											<a href={lesson.document} target='_blank' rel='noreferrer'>
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
												Đề bài tập
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
						<h3 className='text-base font-semibold'>Học viên offline</h3>
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
											Quét QR
										</Button>
									)}
									{hasAssignment && (
										<Button
											size='sm'
											className='h-8 bg-foreground text-background hover:bg-foreground/90'
											onClick={() => void handleSaveGrades()}
											disabled={isSavingGrades || offlineStudents.length === 0}>
											{isSavingGrades ? (
												<Loader2 className='h-4 w-4 animate-spin' />
											) : (
												<Save className='h-4 w-4' />
											)}
											Lưu điểm
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
											<TableHead className='w-[130px]'>Sẽ tham gia</TableHead>
											<TableHead className='w-[110px]'>Điểm danh</TableHead>
											{hasAssignment && (
												<TableHead className='w-[120px]'>
													Điểm bài tập
												</TableHead>
											)}
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedStudents.map((e, index) => {
											const registered = registeredSet.has(e.user.id);
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
													<TableCell>
														{registered ? (
															<Badge
																variant='outline'
																className='rounded-full border-amber-500/30 bg-amber-500/10 text-amber-700'>
																Sẽ tham gia
															</Badge>
														) : (
															<span className='text-sm text-muted-foreground'>
																--
															</span>
														)}
													</TableCell>
													<TableCell>
														<Switch
															checked={present.has(e.user.id)}
															disabled={
																!canManualAttendance ||
																pendingAttendance.has(e.user.id)
															}
															onCheckedChange={(v) =>
																void handleToggleAttendance(
																	e.user.id,
																	v,
																)
															}
														/>
													</TableCell>
													{hasAssignment && (
														<TableCell>
															<Input
																type='number'
																min={0}
																max={100}
																step={1}
																placeholder='--'
																className='h-8 w-20'
																value={scores[e.user.id] ?? ""}
																onChange={(ev) =>
																	setScores((prev) => ({
																		...prev,
																		[e.user.id]: ev.target.value,
																	}))
																}
															/>
														</TableCell>
													)}
												</TableRow>
											);
										})}
										{paginatedStudents.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={hasAssignment ? 6 : 5}
													className='h-40 text-center'>
													<div className='flex flex-col items-center gap-2'>
														<div className='text-sm font-medium'>
															Không có học viên phù hợp.
														</div>
														<p className='text-sm text-muted-foreground'>
															{hasOfflineStudents
																? "Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."
																: "Chưa có học viên track offline nào ghi danh."}
														</p>
													</div>
												</TableCell>
											</TableRow>
										) : null}
									</TableBody>
									<TableFooter className='bg-transparent'>
										<TableRow>
											<TableCell colSpan={hasAssignment ? 6 : 5}>
												<div className='flex flex-col gap-3 px-2 py-1 sm:flex-row sm:items-center sm:justify-between'>
													<div className='flex flex-1 items-center gap-3 text-sm text-muted-foreground'>
														Đang hiện {paginatedStudents.length} trên tổng{" "}
														{filteredStudents.length} học viên.
														<span className='text-border'>|</span>
														<span>
															Đã điểm danh{" "}
															<span className='font-medium text-foreground'>
																{attendedCount}/{offlineStudents.length}
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
																	<SelectValue placeholder={perPage} />
																</SelectTrigger>
																<SelectContent side='top'>
																	{pageSizeOptions.map((pageSize) => (
																		<SelectItem
																			key={pageSize}
																			value={`${pageSize}`}>
																			{pageSize}
																		</SelectItem>
																	))}
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
																		Math.min(lastPage, prev + 1),
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
		</div>
	);
}

export default LessonDetailPage;
