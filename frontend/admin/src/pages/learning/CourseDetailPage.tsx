import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
	ArrowLeft,
	Award,
	Ban,
	Eye,
	CalendarCheck,
	CalendarClock,
	CheckCircle2,
	FilePen,
	Download,
	GraduationCap,
	ImageIcon,
	ListChecks,
	MoreHorizontal,
	Pencil,
	Plus,
	RotateCcw,
	ScanLine,
	Trash2,
	Users,
	UserPlus,
	BookOpen,
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
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { TablePaginationFooter } from "@/components/TablePaginationFooter";
import { useAuth } from "@/contexts/AuthContext";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useClientPagination } from "@/hooks/useClientPagination";
import { cn } from "@/lib/utils";
import {
	COURSE_LEVEL_MAP,
	COURSE_AUDIENCE_MAP,
	COURSE_STATUS_MAP,
	type CourseAudience,
	type CourseLevel,
	type CourseStatus,
} from "@/pages/learning/course-meta";
import courseService from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type {
	AdminCourseDetail,
	CourseLessonRow,
	EnrollmentTrack,
} from "@/pages/learning/course-detail.types";
import AssignmentGradeDialog from "@/pages/learning/AssignmentGradeDialog";
import EnrollStudentDialog from "@/pages/learning/EnrollStudentDialog";
import LessonAttendanceDialog from "@/pages/learning/LessonAttendanceDialog";
import LessonCheckInDialog from "@/pages/learning/LessonCheckInDialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });
const compactCardClassName = "gap-0 py-0";

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateFmt.format(d);
}

function formatDateTime(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dateTimeFmt.format(d);
}

function statusBadge(status: CourseStatus) {
	const { label, className } = COURSE_STATUS_MAP[status];
	return (
		<Badge variant='outline' className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

type SessionStatus = "upcoming" | "ongoing" | "ended";

/**
 * Trạng thái một buổi học offline theo thời gian diễn ra của chính buổi đó.
 * Trả về null nếu buổi chưa xếp lịch (không có session_start).
 */
function getSessionStatus(lesson: CourseLessonRow, now = new Date()): SessionStatus | null {
	if (!lesson.session_start) return null;
	const start = new Date(lesson.session_start);
	if (now < start) return "upcoming";
	if (!lesson.session_end || now <= new Date(lesson.session_end)) return "ongoing";
	return "ended";
}

const SESSION_STATUS_MAP: Record<
	SessionStatus | "scheduled",
	{ label: string; className: string }
> = {
	upcoming: {
		label: "Sắp diễn ra",
		className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
	},
	scheduled: {
		label: "Chưa diễn ra",
		className: "border-slate-400/20 bg-slate-400/10 text-slate-600 hover:bg-slate-400/10",
	},
	ongoing: {
		label: "Đang diễn ra",
		className:
			"border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
	},
	ended: {
		label: "Đã kết thúc",
		className: "border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/10",
	},
};

/**
 * Badge trạng thái cho ô "Trạng thái" của buổi học:
 * - Buổi nháp → luôn hiện "Bản nháp".
 * - Buổi đã xuất bản có lịch offline → trạng thái theo thời gian diễn ra; trong các buổi
 *   sắp tới chỉ buổi gần nhất (`isNearestUpcoming`) hiện "Sắp diễn ra", còn lại "Chưa diễn ra".
 * - Buổi đã xuất bản không có lịch (online) → giữ "Đã xuất bản".
 */
function lessonStatusBadge(lesson: CourseLessonRow, isNearestUpcoming: boolean) {
	if (lesson.status === "draft") return statusBadge("draft");
	const sessionStatus = getSessionStatus(lesson);
	if (!sessionStatus) return statusBadge(lesson.status);
	const key = sessionStatus === "upcoming" && !isNearestUpcoming ? "scheduled" : sessionStatus;
	const { label, className } = SESSION_STATUS_MAP[key];
	return (
		<Badge variant='outline' className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

function levelBadge(level: CourseLevel) {
	const { label, className } = COURSE_LEVEL_MAP[level];
	return (
		<Badge variant='outline' className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

function audienceBadge(audience: CourseAudience) {
	const { label, className } = COURSE_AUDIENCE_MAP[audience];
	return (
		<Badge variant='outline' className={cn("rounded-full px-3 py-1", className)}>
			{label}
		</Badge>
	);
}

function trackBadge(track: EnrollmentTrack) {
	return track === "offline" ? (
		<Badge
			variant='outline'
			className='rounded-full border-orange-500/20 bg-orange-500/10 px-3 py-1 text-orange-700'>
			Offline
		</Badge>
	) : (
		<Badge
			variant='outline'
			className='rounded-full border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-700'>
			Online
		</Badge>
	);
}

function StatCard({
	icon,
	label,
	value,
	hint,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
	hint?: string;
}) {
	return (
		<Card className={compactCardClassName}>
			<CardContent className='flex items-center gap-3 p-4'>
				<div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
					{icon}
				</div>
				<div className='min-w-0'>
					<p className='text-xs text-muted-foreground'>{label}</p>
					<p className='text-lg font-semibold leading-tight'>{value}</p>
					{hint && <p className='text-xs text-muted-foreground'>{hint}</p>}
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Component ───────────────────────────────────────────────────────────────

function CourseDetailPage() {
	const { slug = "" } = useParams();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { hasPermission } = useAuth();
	const canManageQuiz = hasPermission("quizzes.manage");

	const [course, setCourse] = useState<AdminCourseDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [trackFilter, setTrackFilter] = useState<EnrollmentTrack | "all">("all");
	const [checkInLesson, setCheckInLesson] = useState<AdminCourseDetail["lessons"][number] | null>(
		null,
	);
	const [gradingLesson, setGradingLesson] = useState<AdminCourseDetail["lessons"][number] | null>(
		null,
	);
	const [deletingLesson, setDeletingLesson] = useState<
		AdminCourseDetail["lessons"][number] | null
	>(null);
	const [isDeletingLesson, setIsDeletingLesson] = useState(false);
	const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
	const [removingEnrollment, setRemovingEnrollment] = useState<
		AdminCourseDetail["enrollments"][number] | null
	>(null);
	const [isRemovingEnrollment, setIsRemovingEnrollment] = useState(false);
	const [revokingCertificate, setRevokingCertificate] = useState<
		AdminCourseDetail["certificates"][number] | null
	>(null);
	const [isRevokingCertificate, setIsRevokingCertificate] = useState(false);
	const [reissuingCertificateId, setReissuingCertificateId] = useState<number | null>(null);
	const [editAttendanceLesson, setEditAttendanceLesson] = useState<
		AdminCourseDetail["lessons"][number] | null
	>(null);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Khóa học", link: "/courses" },
		{ title: course?.title ?? "Chi tiết khóa học" },
	]);

	const loadCourse = useCallback(
		async (opts?: { silent?: boolean }) => {
			if (!opts?.silent) setLoading(true);
			try {
				const res = await courseService.getCourse(slug);
				setCourse(res.data);
				setNotFound(false);
			} catch (err) {
				if (isAxiosError(err) && err.response?.status === 404) {
					setNotFound(true);
				} else {
					toast.error("Không thể tải thông tin khóa học.");
					setNotFound(true);
				}
			} finally {
				if (!opts?.silent) setLoading(false);
			}
		},
		[slug],
	);

	useEffect(() => {
		void loadCourse();
	}, [loadCourse]);

	const filteredEnrollments = useMemo(() => {
		if (!course) return [];
		if (trackFilter === "all") return course.enrollments;
		return course.enrollments.filter((e) => e.track === trackFilter);
	}, [course, trackFilter]);

	const offlineLessons = useMemo(() => {
		if (!course) return [];
		return course.lessons.filter((l) => l.session_start);
	}, [course]);

	/**
	 * Buổi học offline "chuẩn bị diễn ra" — buổi sớm nhất theo `order` mà session_end
	 * chưa qua (hoặc chưa đặt session_end). Chỉ buổi này được điểm danh/quét QR để
	 * tránh admin lỡ quét nhầm buổi, và vì học viên chỉ có danh sách ghi danh theo buổi
	 * khi buổi đó đến lượt diễn ra (giống logic bên trang học viên).
	 */
	const activeLessonId = useMemo(() => {
		const now = new Date();
		return (
			offlineLessons.find((l) => !l.session_end || new Date(l.session_end) > now)?.id ?? null
		);
	}, [offlineLessons]);

	/**
	 * Buổi sắp diễn ra gần nhất — buổi đã xuất bản, chưa tới giờ, có session_start
	 * sớm nhất. Chỉ buổi này hiện "Sắp diễn ra"; các buổi tương lai sau đó "Chưa diễn ra".
	 */
	const nearestUpcomingLessonId = useMemo(() => {
		const now = new Date();
		return (
			offlineLessons
				.filter((l) => l.status !== "draft" && new Date(l.session_start!) > now)
				.sort(
					(a, b) =>
						new Date(a.session_start!).getTime() - new Date(b.session_start!).getTime(),
				)[0]?.id ?? null
		);
	}, [offlineLessons]);

	/** Các buổi offline đã kết thúc — chỉ những buổi này mới cho "Sửa điểm danh". */
	const pastOfflineLessonIds = useMemo(() => {
		const now = new Date();
		return new Set(
			offlineLessons
				.filter((l) => l.session_end && new Date(l.session_end) < now)
				.map((l) => l.id),
		);
	}, [offlineLessons]);

	/** Số học viên đã điểm danh từng buổi (để hiện tiến độ ở cột Điểm danh). */
	const attendedByLesson = useMemo(() => {
		const map = new Map<number, number>();
		for (const a of course?.attendances ?? []) {
			map.set(a.lesson_id, (map.get(a.lesson_id) ?? 0) + 1);
		}
		return map;
	}, [course]);

	/** Số học viên đã đăng ký "sẽ tham gia" từng buổi (dự kiến có mặt). */
	const registeredByLesson = useMemo(() => {
		const map = new Map<number, number>();
		for (const r of course?.registrations ?? []) {
			map.set(r.lesson_id, (map.get(r.lesson_id) ?? 0) + 1);
		}
		return map;
	}, [course]);

	const lessonsPg = useClientPagination(course?.lessons ?? []);
	const studentsPg = useClientPagination(filteredEnrollments);
	const certificatesPg = useClientPagination(course?.certificates ?? []);

	const openCreateLesson = () => {
		navigate(`/courses/${slug}/lessons/create`);
	};

	const openEditLesson = (id: number) => {
		navigate(`/courses/${slug}/lessons/${id}/edit`);
	};

	const openLessonDetail = (id: number) => {
		navigate(`/courses/${slug}/lessons/${id}`);
	};

	const openQuizBuilder = (id: number) => {
		navigate(`/learning/courses/${course?.slug ?? slug}/lessons/${id}/quiz/create`);
	};

	const handleDeleteLesson = async () => {
		if (!deletingLesson) return;
		setIsDeletingLesson(true);
		try {
			await courseService.deleteLesson(slug, deletingLesson.id);
			toast.success("Đã xóa buổi học.", { position: "top-right" });
			setDeletingLesson(null);
			await loadCourse({ silent: true });
		} catch {
			toast.error("Không thể xóa buổi học.", { position: "top-right" });
		} finally {
			setIsDeletingLesson(false);
		}
	};

	const handleRemoveEnrollment = async () => {
		if (!removingEnrollment) return;
		setIsRemovingEnrollment(true);
		try {
			await courseService.removeEnrollment(slug, removingEnrollment.id);
			toast.success("Đã xóa ghi danh.", { position: "top-right" });
			setRemovingEnrollment(null);
			await loadCourse({ silent: true });
		} catch {
			toast.error("Không thể xóa ghi danh.", { position: "top-right" });
		} finally {
			setIsRemovingEnrollment(false);
		}
	};

	const handleRevokeCertificate = async () => {
		if (!revokingCertificate) return;
		setIsRevokingCertificate(true);
		try {
			await courseService.revokeCertificate(slug, revokingCertificate.id);
			toast.success("Đã thu hồi chứng chỉ.", { position: "top-right" });
			setRevokingCertificate(null);
			await loadCourse({ silent: true });
		} catch (err) {
			const message =
				isAxiosError(err) && (err.response?.data as ApiErrorResponse | undefined)?.message
					? String((err.response?.data as ApiErrorResponse).message)
					: "Không thể thu hồi chứng chỉ.";
			toast.error(message, { position: "top-right" });
		} finally {
			setIsRevokingCertificate(false);
		}
	};

	const handleReissueCertificate = async (cert: AdminCourseDetail["certificates"][number]) => {
		setReissuingCertificateId(cert.id);
		try {
			await courseService.reissueCertificate(slug, cert.id);
			toast.success("Đã cấp lại chứng chỉ.", { position: "top-right" });
			await loadCourse({ silent: true });
		} catch (err) {
			const message =
				isAxiosError(err) && (err.response?.data as ApiErrorResponse | undefined)?.message
					? String((err.response?.data as ApiErrorResponse).message)
					: "Không thể cấp lại chứng chỉ.";
			toast.error(message, { position: "top-right" });
		} finally {
			setReissuingCertificateId(null);
		}
	};

	if (loading) {
		return (
			<div className='space-y-6 p-4 md:p-6 lg:p-8'>
				<Skeleton className='h-8 w-64' />
				<Skeleton className='h-40 w-full' />
				<Skeleton className='h-64 w-full' />
			</div>
		);
	}

	if (notFound || !course) {
		return (
			<div className='flex flex-col items-center justify-center gap-4 p-16 text-center'>
				<GraduationCap className='h-12 w-12 text-muted-foreground' />
				<div>
					<h2 className='text-lg font-semibold'>Không tìm thấy khóa học</h2>
					<p className='text-sm text-muted-foreground'>
						Khóa học không tồn tại hoặc đã bị xóa.
					</p>
				</div>
				<Button variant='outline' onClick={() => navigate("/courses")}>
					<ArrowLeft className='h-4 w-4' />
					Về danh sách khóa học
				</Button>
			</div>
		);
	}

	const hasOffline = course.max_offline_slots !== null;

	return (
		<div className='min-h-full bg-background'>
			<div className='space-y-6 p-4 md:p-6 lg:p-8'>
				{/* Back + actions */}
				<div className='flex items-center justify-between'>
					<Button
						variant='ghost'
						size='sm'
						className='-ml-2 h-8 text-muted-foreground'
						onClick={() => navigate("/courses")}>
						<ArrowLeft className='h-4 w-4' />
						Danh sách khóa học
					</Button>
					<Button
						size='sm'
						className='h-8'
						onClick={() => navigate(`/courses/${course.slug}/edit`)}>
						<Pencil className='h-4 w-4' />
						Chỉnh sửa
					</Button>
				</div>

				{/* Header */}
				<div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
					<div className='flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted'>
						{course.thumbnail ? (
							<img
								src={course.thumbnail}
								alt=''
								className='h-full w-full object-cover'
							/>
						) : (
							<ImageIcon className='h-6 w-6 text-muted-foreground' />
						)}
					</div>
					<div className='min-w-0 space-y-2'>
						<div className='flex flex-wrap items-center gap-2'>
							{statusBadge(course.status)}
							{levelBadge(course.level)}
							{audienceBadge(course.audience)}
							{course.categories.map((c) => (
								<Badge
									key={c.id}
									variant='outline'
									className='rounded-full px-3 py-1 font-normal text-muted-foreground'>
									{c.name}
								</Badge>
							))}
						</div>
						<h2 className='text-2xl font-semibold tracking-tight'>{course.title}</h2>
						<p className='max-w-2xl text-sm text-muted-foreground'>
							{course.description ?? "Chưa có mô tả."}
						</p>
					</div>
				</div>

				{/* Stat cards */}
				<div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
					<StatCard
						icon={<BookOpen className='h-5 w-5' />}
						label='Buổi học'
						value={course.lessons_count}
					/>
					<StatCard
						icon={<Users className='h-5 w-5' />}
						label='Học viên'
						value={course.enrollments_count}
					/>
					<StatCard
						icon={<CalendarClock className='h-5 w-5' />}
						label='Lớp offline'
						value={
							hasOffline
								? `${course.offline_enrollments_count}/${course.max_offline_slots}`
								: "Chỉ online"
						}
					/>
					<StatCard
						icon={<Award className='h-5 w-5' />}
						label='Chứng chỉ đã cấp'
						value={course.certificates_count}
					/>
				</div>

				{/* Tabs */}
				<Tabs
					defaultValue={
						["overview", "lessons", "students", "certificates"].includes(
							searchParams.get("tab") ?? "",
						)
							? searchParams.get("tab")!
							: "overview"
					}
					className='w-full'>
					<TabsList>
						<TabsTrigger value='overview'>Tổng quan</TabsTrigger>
						<TabsTrigger value='lessons'>Buổi học ({course.lessons_count})</TabsTrigger>
						<TabsTrigger value='students'>
							Học viên ({course.enrollments_count})
						</TabsTrigger>
						<TabsTrigger value='certificates'>
							Chứng chỉ ({course.certificates_count})
						</TabsTrigger>
					</TabsList>

					{/* ─── Tổng quan ─── */}
					<TabsContent value='overview' className='mt-4'>
						<div className='grid gap-4 lg:grid-cols-2'>
							<Card className={compactCardClassName}>
								<CardContent className='space-y-3 p-5'>
									<h3 className='flex items-center gap-2 font-semibold'>
										<CalendarClock className='h-4 w-4' />
										Hạn đăng ký khoá học offline
									</h3>
									<Separator />
									<dl className='grid grid-cols-[140px_1fr] gap-y-2 text-sm'>
										<dt className='text-muted-foreground'>Mở đăng ký</dt>
										<dd>{formatDate(course.enrollment_start)}</dd>
										<dt className='text-muted-foreground'>Hạn chót đăng ký</dt>
										<dd>{formatDate(course.enrollment_deadline)}</dd>
										<dt className='text-muted-foreground'>
											Ngày kết thúc khoá
										</dt>
										<dd>{formatDate(course.course_end)}</dd>
									</dl>
									<p className='text-xs text-muted-foreground'>
										Sau thời hạn đăng ký lớp offline, học viên mới chỉ có thể
										học với hình thức online.
									</p>
								</CardContent>
							</Card>

							<Card className={compactCardClassName}>
								<CardContent className='space-y-3 p-5'>
									<h3 className='flex items-center gap-2 font-semibold'>
										<ListChecks className='h-4 w-4' />
										Cấu hình khóa
									</h3>
									<Separator />
									<dl className='grid grid-cols-[180px_1fr] gap-y-2 text-sm'>
										{hasOffline && (
											<>
												<dt className='text-muted-foreground'>
													Sức chứa lớp offline
												</dt>
												<dd>{course.max_offline_slots}</dd>
												<dt className='text-muted-foreground'>
													Số buổi vắng tối đa
												</dt>
												<dd>{course.max_absent_allowed}</dd>
											</>
										)}
										<dt className='text-muted-foreground'>Ngưỡng đạt quiz</dt>
										<dd>{course.quiz_pass_threshold}%</dd>
										<dt className='text-muted-foreground'>Đối tượng học</dt>
										<dd>{COURSE_AUDIENCE_MAP[course.audience].label}</dd>
										<dt className='text-muted-foreground'>Người tạo</dt>
										<dd>{course.creator?.full_name ?? "--"}</dd>
									</dl>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					{/* ─── Buổi học ─── */}
					<TabsContent value='lessons' className='mt-4'>
						<div className='mb-3 flex items-center justify-end'>
							<Button size='sm' className='h-8' onClick={openCreateLesson}>
								<Plus className='h-4 w-4' />
								Thêm
							</Button>
						</div>
						<div className='overflow-hidden rounded-md border'>
							<Table>
								<TableHeader className='[&_th]:text-sm'>
									<TableRow>
										<TableHead className='w-[60px]'>#</TableHead>
										<TableHead className='min-w-[260px]'>Buổi học</TableHead>
										{hasOffline && (
											<TableHead className='min-w-[180px]'>
												Lịch offline
											</TableHead>
										)}
										{hasOffline && (
											<TableHead className='w-[220px]'>Điểm danh</TableHead>
										)}
										<TableHead className='w-[120px]'>Trạng thái</TableHead>
										<TableHead className='w-[52px]' />
									</TableRow>
								</TableHeader>
								<TableBody>
									{course.lessons.length > 0 ? (
										lessonsPg.pageItems.map((lesson) => {
											// Điểm danh chỉ áp với buổi offline có học viên offline.
											// QR: chỉ buổi đang diễn ra. Thủ công: đang diễn ra hoặc đã qua.
											const isOffline = !!lesson.session_start;
											const isActive = lesson.id === activeLessonId;
											const isPast = pastOfflineLessonIds.has(lesson.id);
											const hasOfflineStudents =
												course.offline_enrollments_count > 0;
											const canQr =
												isOffline && isActive && hasOfflineStudents;
											return (
												<TableRow key={lesson.id}>
													<TableCell className='font-medium text-muted-foreground'>
														{lesson.order}
													</TableCell>
													<TableCell className='font-medium'>
														{hasOffline ? (
															<button
																type='button'
																className='text-left hover:text-primary hover:underline'
																onClick={() =>
																	openLessonDetail(lesson.id)
																}>
																{lesson.title}
															</button>
														) : (
															<span>{lesson.title}</span>
														)}
													</TableCell>
													{hasOffline && (
														<TableCell className='text-sm text-muted-foreground'>
															{lesson.session_start
																? formatDateTime(
																		lesson.session_start,
																	)
																: "—"}
														</TableCell>
													)}
													{hasOffline && (
														<TableCell className='text-sm'>
															{!isOffline ? (
																<span className='text-muted-foreground'>
																	—
																</span>
															) : isActive || isPast ? (
																<div className='flex flex-col gap-0.5 text-muted-foreground'>
																	<span className='flex items-center gap-1.5'>
																		<CheckCircle2 className='h-3.5 w-3.5' />
																		{attendedByLesson.get(
																			lesson.id,
																		) ?? 0}
																		/
																		{
																			course.offline_enrollments_count
																		}{" "}
																		điểm danh
																	</span>
																	<span className='flex items-center gap-1.5 text-xs'>
																		<CalendarCheck className='h-3 w-3' />
																		{registeredByLesson.get(
																			lesson.id,
																		) ?? 0}{" "}
																		sẽ tham gia
																	</span>
																</div>
															) : (
																<span className='text-muted-foreground'>
																	Chưa diễn ra
																</span>
															)}
														</TableCell>
													)}
													<TableCell>
														{lessonStatusBadge(
															lesson,
															lesson.id === nearestUpcomingLessonId,
														)}
													</TableCell>
													<TableCell>
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant='ghost'
																	className='h-8 w-8 p-0 data-[state=open]:bg-muted'>
																	<MoreHorizontal className='h-4 w-4' />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent
																align='end'
																className='w-[160px]'>
																{hasOffline && (
																	<DropdownMenuItem
																		onClick={() =>
																			openLessonDetail(
																				lesson.id,
																			)
																		}>
																		<Eye className='h-4 w-4' />
																		Xem chi tiết
																	</DropdownMenuItem>
																)}
																<DropdownMenuItem
																	onClick={() =>
																		openEditLesson(lesson.id)
																	}>
																	<Pencil className='h-4 w-4' />
																	Sửa
																</DropdownMenuItem>

																{canQr && (
																	<DropdownMenuItem
																		onClick={() =>
																			setCheckInLesson(lesson)
																		}>
																		<ScanLine className='h-4 w-4' />
																		Điểm danh
																	</DropdownMenuItem>
																)}

																{canManageQuiz && (
																	<DropdownMenuItem
																		onClick={() =>
																			openQuizBuilder(
																				lesson.id,
																			)
																		}>
																		<FilePen className='h-4 w-4' />
																		Quiz
																	</DropdownMenuItem>
																)}

																{hasOffline &&
																	lesson.has_assignment &&
																	(isActive || isPast) && (
																		<DropdownMenuItem
																			onClick={() =>
																				setGradingLesson(
																					lesson,
																				)
																			}>
																			<ListChecks className='h-4 w-4' />
																			Chấm bài
																		</DropdownMenuItem>
																	)}
																<DropdownMenuItem
																	className='text-destructive focus:bg-destructive/10 focus:text-destructive'
																	onClick={() =>
																		setDeletingLesson(lesson)
																	}>
																	<Trash2 className='h-4 w-4 text-destructive' />
																	Xóa
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell
												colSpan={hasOffline ? 6 : 4}
												className='h-32 text-center text-muted-foreground'>
												Khóa học chưa có buổi học nào. Nhấn "Thêm buổi học"
												để bắt đầu.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								{course.lessons.length > 0 && (
									<TablePaginationFooter
										colSpan={hasOffline ? 6 : 4}
										shown={lessonsPg.pageItems.length}
										total={lessonsPg.total}
										noun='buổi học'
										page={lessonsPg.page}
										perPage={lessonsPg.perPage}
										lastPage={lessonsPg.lastPage}
										onPageChange={lessonsPg.setPage}
										onPerPageChange={lessonsPg.setPerPage}
									/>
								)}
							</Table>
						</div>
					</TabsContent>

					{/* ─── Học viên ─── */}
					<TabsContent value='students' className='mt-4'>
						<div className='mb-3 flex flex-wrap items-center gap-2'>
							{(["all", "offline", "online"] as const).map((t) => (
								<Button
									key={t}
									size='sm'
									variant={trackFilter === t ? "default" : "outline"}
									className='h-8'
									onClick={() => {
										setTrackFilter(t);
										studentsPg.setPage(1);
									}}>
									{t === "all"
										? "Tất cả"
										: t === "offline"
											? "Offline"
											: "Online"}
								</Button>
							))}
							<div className='ml-auto flex items-center gap-3'>
								<Button
									size='sm'
									variant='outline'
									className='h-8'
									onClick={() => setEnrollDialogOpen(true)}>
									<UserPlus className='h-4 w-4' />
									Ghi danh
								</Button>
							</div>
						</div>
						<div className='overflow-hidden rounded-md border'>
							<Table>
								<TableHeader className='[&_th]:text-sm'>
									<TableRow>
										<TableHead className='w-[70px]'>STT</TableHead>
										<TableHead className='min-w-[240px]'>Học viên</TableHead>
										<TableHead className='w-[110px]'>Hình thức</TableHead>
										<TableHead className='min-w-[180px]'>Tiến độ</TableHead>
										<TableHead className='w-[150px]'>Hoàn thành</TableHead>
										<TableHead className='w-[52px]' />
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredEnrollments.length > 0 ? (
										studentsPg.pageItems.map((e, index) => (
											<TableRow key={e.id}>
												<TableCell className='text-sm text-muted-foreground'>
													{(studentsPg.page - 1) * studentsPg.perPage +
														index +
														1}
												</TableCell>
												<TableCell>
													<div className='flex items-center gap-2.5'>
														<Avatar className='h-8 w-8'>
															<AvatarImage
																src={e.user.avatar ?? undefined}
															/>
															<AvatarFallback className='text-xs'>
																{e.user.full_name
																	.charAt(0)
																	.toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className='min-w-0'>
															<p className='truncate text-sm font-medium leading-none'>
																{e.user.full_name}
															</p>
															<p className='truncate text-xs text-muted-foreground'>
																{e.user.email}
															</p>
														</div>
													</div>
												</TableCell>
												<TableCell>{trackBadge(e.track)}</TableCell>
												<TableCell>
													<div className='flex items-center gap-2'>
														<Progress
															value={e.progress}
															className='h-2 w-24'
														/>
														<span className='text-xs text-muted-foreground'>
															{e.progress}%
														</span>
													</div>
												</TableCell>
												<TableCell className='text-sm text-muted-foreground'>
													{e.completed_at ? (
														<span className='flex items-center gap-1.5 text-emerald-600'>
															<CheckCircle2 className='h-3.5 w-3.5' />
															{formatDate(e.completed_at)}
														</span>
													) : (
														"Đang học"
													)}
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant='ghost'
																className='h-8 w-8 p-0 data-[state=open]:bg-muted'>
																<MoreHorizontal className='h-4 w-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align='end'
															className='w-[180px]'>
															<DropdownMenuItem
																className='text-destructive focus:bg-destructive/10 focus:text-destructive'
																onClick={() =>
																	setRemovingEnrollment(e)
																}>
																<Trash2 className='h-4 w-4 text-destructive' />
																Xóa ghi danh
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={7}
												className='h-32 text-center text-muted-foreground'>
												Chưa có học viên nào ghi danh.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								{filteredEnrollments.length > 0 && (
									<TablePaginationFooter
										colSpan={6}
										shown={studentsPg.pageItems.length}
										total={studentsPg.total}
										noun='học viên'
										page={studentsPg.page}
										perPage={studentsPg.perPage}
										lastPage={studentsPg.lastPage}
										onPageChange={studentsPg.setPage}
										onPerPageChange={studentsPg.setPerPage}
									/>
								)}
							</Table>
						</div>
					</TabsContent>

					{/* ─── Chứng chỉ ─── */}
					<TabsContent value='certificates' className='mt-4'>
						<div className='overflow-hidden rounded-md border'>
							<Table>
								<TableHeader className='[&_th]:text-sm'>
									<TableRow>
										<TableHead className='min-w-[200px]'>
											Mã chứng chỉ
										</TableHead>
										<TableHead className='min-w-[240px]'>Học viên</TableHead>
										<TableHead className='w-[110px]'>Hình thức</TableHead>
										<TableHead className='w-[150px]'>Ngày cấp</TableHead>
										<TableHead className='w-[130px]'>Trạng thái</TableHead>
										<TableHead className='w-[52px]' />
									</TableRow>
								</TableHeader>
								<TableBody>
									{course.certificates.length > 0 ? (
										certificatesPg.pageItems.map((cert) => (
											<TableRow key={cert.id}>
												<TableCell className='font-mono text-sm font-medium'>
													{cert.cert_code}
												</TableCell>
												<TableCell>
													<div className='min-w-0'>
														<p className='truncate text-sm font-medium'>
															{cert.user.full_name}
														</p>
														<p className='truncate text-xs text-muted-foreground'>
															{cert.user.email}
														</p>
													</div>
												</TableCell>
												<TableCell>{trackBadge(cert.track)}</TableCell>
												<TableCell className='text-sm text-muted-foreground'>
													{formatDate(cert.issued_at)}
												</TableCell>
												<TableCell>
													{cert.revoked_at ? (
														<Badge variant='destructive'>
															Đã thu hồi
														</Badge>
													) : (
														<Badge className='bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>
															Còn hiệu lực
														</Badge>
													)}
												</TableCell>
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant='ghost'
																className='h-8 w-8 p-0 data-[state=open]:bg-muted'
																disabled={
																	reissuingCertificateId ===
																	cert.id
																}>
																<MoreHorizontal className='h-4 w-4' />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align='end'
															className='w-[180px]'>
															{cert.cert_url && (
																<DropdownMenuItem asChild>
																	<a
																		href={cert.cert_url}
																		target='_blank'
																		rel='noreferrer'>
																		<Download className='h-4 w-4' />
																		Xem PDF
																	</a>
																</DropdownMenuItem>
															)}
															{cert.revoked_at ? (
																<DropdownMenuItem
																	onClick={() =>
																		handleReissueCertificate(
																			cert,
																		)
																	}>
																	<RotateCcw className='h-4 w-4' />
																	Cấp lại
																</DropdownMenuItem>
															) : (
																<DropdownMenuItem
																	className='text-destructive focus:bg-destructive/10 focus:text-destructive'
																	onClick={() =>
																		setRevokingCertificate(cert)
																	}>
																	<Ban className='h-4 w-4 text-destructive' />
																	Thu hồi
																</DropdownMenuItem>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={6}
												className='h-32 text-center text-muted-foreground'>
												Chưa cấp chứng chỉ nào. Chứng chỉ được cấp khi học
												viên hoàn thành khóa học.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								{course.certificates.length > 0 && (
									<TablePaginationFooter
										colSpan={6}
										shown={certificatesPg.pageItems.length}
										total={certificatesPg.total}
										noun='chứng chỉ'
										page={certificatesPg.page}
										perPage={certificatesPg.perPage}
										lastPage={certificatesPg.lastPage}
										onPageChange={certificatesPg.setPage}
										onPerPageChange={certificatesPg.setPerPage}
									/>
								)}
							</Table>
						</div>
					</TabsContent>
				</Tabs>
			</div>

			<LessonCheckInDialog
				open={checkInLesson !== null}
				onOpenChange={(o) => !o && setCheckInLesson(null)}
				courseSlug={course.slug}
				lesson={checkInLesson}
				onCheckedIn={() => void loadCourse({ silent: true })}
			/>

			<LessonAttendanceDialog
				open={editAttendanceLesson !== null}
				onOpenChange={(o) => !o && setEditAttendanceLesson(null)}
				courseSlug={course.slug}
				lesson={editAttendanceLesson}
				students={course.enrollments.filter((e) => e.track === "offline")}
				attendedUserIds={course.attendances
					.filter((a) => a.lesson_id === editAttendanceLesson?.id)
					.map((a) => a.user_id)}
				registeredUserIds={course.registrations
					.filter((r) => r.lesson_id === editAttendanceLesson?.id)
					.map((r) => r.user_id)}
				onChanged={() => void loadCourse({ silent: true })}
			/>

			<AssignmentGradeDialog
				open={gradingLesson !== null}
				onOpenChange={(o) => !o && setGradingLesson(null)}
				courseSlug={course.slug}
				lesson={gradingLesson}
				onSaved={() => void loadCourse({ silent: true })}
			/>

			<EnrollStudentDialog
				open={enrollDialogOpen}
				onOpenChange={setEnrollDialogOpen}
				courseSlug={course.slug}
				onEnrolled={() => void loadCourse({ silent: true })}
			/>

			<AlertDialog
				open={removingEnrollment !== null}
				onOpenChange={(o) => !o && setRemovingEnrollment(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Xóa ghi danh?</AlertDialogTitle>
						<AlertDialogDescription>
							{removingEnrollment
								? `Bạn có chắc muốn xóa ghi danh của "${removingEnrollment.user.full_name}"? Tiến độ và điểm danh liên quan trong khóa này sẽ bị xóa.`
								: "Bạn có chắc muốn xóa ghi danh này?"}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRemovingEnrollment}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								void handleRemoveEnrollment();
							}}
							disabled={isRemovingEnrollment}
							className='bg-destructive text-white hover:bg-destructive/90'>
							{isRemovingEnrollment ? "Đang xóa..." : "Xóa ghi danh"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={revokingCertificate !== null}
				onOpenChange={(o) => !o && setRevokingCertificate(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Thu hồi chứng chỉ?</AlertDialogTitle>
						<AlertDialogDescription>
							{revokingCertificate
								? `Bạn có chắc muốn thu hồi chứng chỉ "${revokingCertificate.cert_code}" của "${revokingCertificate.user.full_name}"? Có thể cấp lại sau nếu cần.`
								: "Bạn có chắc muốn thu hồi chứng chỉ này?"}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRevokingCertificate}>Hủy</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								void handleRevokeCertificate();
							}}
							disabled={isRevokingCertificate}
							className='bg-destructive text-white hover:bg-destructive/90'>
							{isRevokingCertificate ? "Đang thu hồi..." : "Thu hồi"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<Dialog
				open={deletingLesson !== null}
				onOpenChange={(o) => !o && setDeletingLesson(null)}>
				<DialogContent className='sm:max-w-[440px]'>
					<DialogHeader>
						<DialogTitle>Xác nhận xóa buổi học</DialogTitle>
					</DialogHeader>
					{deletingLesson && (
						<div className='space-y-2 text-sm text-muted-foreground'>
							<p>
								Bạn sắp xóa buổi học{" "}
								<span className='font-semibold text-foreground'>
									"{deletingLesson.title}"
								</span>
								.
							</p>
							<p>Tiến độ và điểm danh liên quan sẽ không còn truy cập được.</p>
						</div>
					)}
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setDeletingLesson(null)}
							disabled={isDeletingLesson}>
							Hủy
						</Button>
						<Button
							variant='destructive'
							onClick={() => void handleDeleteLesson()}
							disabled={isDeletingLesson}>
							{isDeletingLesson ? "Đang xóa..." : "Xóa buổi học"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default CourseDetailPage;
