import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import {
	ArrowLeft,
	Award,
	BookOpen,
	CalendarClock,
	CheckCircle2,
	FileText,
	GraduationCap,
	ImageIcon,
	ListChecks,
	Pencil,
	PlayCircle,
	Plus,
	ScanLine,
	Users,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
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
import { TablePaginationFooter } from "@/components/TablePaginationFooter";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import { useClientPagination } from "@/hooks/useClientPagination";
import { cn } from "@/lib/utils";
import {
	COURSE_LEVEL_MAP,
	COURSE_STATUS_MAP,
	type CourseLevel,
	type CourseStatus,
} from "@/pages/learning/course-meta";
import courseService from "@/services/course.service";
import type {
	AdminCourseDetail,
	EnrollmentTrack,
} from "@/pages/learning/course-detail-mock";
import LessonCheckInDialog, {
	type CheckInStudent,
} from "@/pages/learning/LessonCheckInDialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const dateFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

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

function levelBadge(level: CourseLevel) {
	const { label, className } = COURSE_LEVEL_MAP[level];
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
		<Card>
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

	const [course, setCourse] = useState<AdminCourseDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [trackFilter, setTrackFilter] = useState<EnrollmentTrack | "all">("all");
	const [checkInLesson, setCheckInLesson] = useState<AdminCourseDetail["lessons"][number] | null>(
		null,
	);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Khóa học", link: "/courses" },
		{ title: course?.title ?? "Chi tiết khóa học" },
	]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setNotFound(false);

		courseService
			.getCourse(slug)
			.then((res) => {
				if (cancelled) return;
				setCourse(res.data);
			})
			.catch((err) => {
				if (cancelled) return;
				if (isAxiosError(err) && err.response?.status === 404) {
					setNotFound(true);
				} else {
					toast.error("Không thể tải thông tin khóa học.");
					setNotFound(true);
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [slug]);

	const filteredEnrollments = useMemo(() => {
		if (!course) return [];
		if (trackFilter === "all") return course.enrollments;
		return course.enrollments.filter((e) => e.track === trackFilter);
	}, [course, trackFilter]);

	const offlineLessons = useMemo(() => {
		if (!course) return [];
		return course.lessons.filter((l) => l.session_start);
	}, [course]);

	const offlineStudents = useMemo<CheckInStudent[]>(() => {
		if (!course) return [];
		return course.enrollments
			.filter((e) => e.track === "offline")
			.map((e) => ({
				id: e.user.id,
				full_name: e.user.full_name,
				email: e.user.email,
				avatar: e.user.avatar,
			}));
	}, [course]);

	const lessonsPg = useClientPagination(course?.lessons ?? []);
	const studentsPg = useClientPagination(filteredEnrollments);
	const certificatesPg = useClientPagination(course?.certificates ?? []);

	// Mock: cộng dồn số đã điểm danh của buổi (chặn trên = số học viên offline)
	const handleCheckedIn = (lessonId: number, student: CheckInStudent) => {
		setCourse((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				lessons: prev.lessons.map((l) =>
					l.id === lessonId
						? {
								...l,
								attendances_count: Math.min(
									l.attendances_count + 1,
									prev.offline_enrollments_count,
								),
						  }
						: l,
				),
			};
		});
		toast.success(`Đã điểm danh ${student.full_name}.`, { position: "top-right" });
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
							<img src={course.thumbnail} alt='' className='h-full w-full object-cover' />
						) : (
							<ImageIcon className='h-6 w-6 text-muted-foreground' />
						)}
					</div>
					<div className='min-w-0 space-y-2'>
						<div className='flex flex-wrap items-center gap-2'>
							{statusBadge(course.status)}
							{levelBadge(course.level)}
							{course.categories.map((c) => (
								<span
									key={c.id}
									className='rounded-full border px-2 py-0.5 text-xs text-muted-foreground'>
									{c.name}
								</span>
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
						hint={`${course.offline_enrollments_count} offline · ${course.online_enrollments_count} online`}
					/>
					<StatCard
						icon={<CalendarClock className='h-5 w-5' />}
						label='Lớp offline'
						value={
							hasOffline
								? `${course.offline_enrollments_count}/${course.max_offline_slots}`
								: "Chỉ online"
						}
						hint={hasOffline ? "đã đăng ký / sức chứa" : undefined}
					/>
					<StatCard
						icon={<Award className='h-5 w-5' />}
						label='Chứng chỉ đã cấp'
						value={course.certificates_count}
					/>
				</div>

				{/* Tabs */}
				<Tabs defaultValue='overview' className='w-full'>
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
							<Card>
								<CardContent className='space-y-3 p-5'>
									<h3 className='flex items-center gap-2 font-semibold'>
										<CalendarClock className='h-4 w-4' />
										Mốc thời gian
									</h3>
									<Separator />
									<dl className='grid grid-cols-[140px_1fr] gap-y-2 text-sm'>
										<dt className='text-muted-foreground'>Mở ghi danh</dt>
										<dd>{formatDate(course.enrollment_start)}</dd>
										<dt className='text-muted-foreground'>Hạn ghi danh offline</dt>
										<dd>{formatDate(course.enrollment_deadline)}</dd>
										<dt className='text-muted-foreground'>Kết thúc khóa</dt>
										<dd>{formatDate(course.course_end)}</dd>
									</dl>
									<p className='text-xs text-muted-foreground'>
										Sau hạn ghi danh, lớp offline đóng; học viên mới chỉ vào được track
										online tới khi kết thúc khóa.
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardContent className='space-y-3 p-5'>
									<h3 className='flex items-center gap-2 font-semibold'>
										<ListChecks className='h-4 w-4' />
										Cấu hình khóa
									</h3>
									<Separator />
									<dl className='grid grid-cols-[180px_1fr] gap-y-2 text-sm'>
										<dt className='text-muted-foreground'>Sức chứa lớp offline</dt>
										<dd>{hasOffline ? course.max_offline_slots : "Không mở offline"}</dd>
										<dt className='text-muted-foreground'>Số buổi vắng tối đa</dt>
										<dd>{course.max_absent_allowed}</dd>
										<dt className='text-muted-foreground'>Ngưỡng đạt quiz</dt>
										<dd>{course.quiz_pass_threshold}%</dd>
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
							<Button size='sm' className='h-8'>
								<Plus className='h-4 w-4' />
								Thêm buổi học
							</Button>
						</div>
						<div className='overflow-hidden rounded-md border'>
							<Table>
								<TableHeader className='[&_th]:text-sm'>
									<TableRow>
										<TableHead className='w-[60px]'>#</TableHead>
										<TableHead className='min-w-[260px]'>Buổi học</TableHead>
										<TableHead className='min-w-[180px]'>Lịch offline</TableHead>
										<TableHead className='w-[180px]'>Nội dung</TableHead>
										<TableHead className='w-[180px]'>Điểm danh</TableHead>
										<TableHead className='w-[120px]'>Trạng thái</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{course.lessons.length > 0 ? (
										lessonsPg.pageItems.map((lesson) => (
											<TableRow key={lesson.id}>
												<TableCell className='font-medium text-muted-foreground'>
													{lesson.order}
												</TableCell>
												<TableCell className='font-medium'>{lesson.title}</TableCell>
												<TableCell className='text-sm text-muted-foreground'>
													{lesson.session_start
														? formatDateTime(lesson.session_start)
														: "—"}
												</TableCell>
												<TableCell>
													<div className='flex flex-wrap gap-1.5'>
														{lesson.has_video && (
															<span className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground'>
																<PlayCircle className='h-3 w-3' /> Video
															</span>
														)}
														{lesson.has_document && (
															<span className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground'>
																<FileText className='h-3 w-3' /> Tài liệu
															</span>
														)}
														{lesson.has_assignment && (
															<span className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground'>
																<ListChecks className='h-3 w-3' /> Bài tập
															</span>
														)}
													</div>
												</TableCell>
												<TableCell className='text-sm'>
													{lesson.session_start ? (
														<div className='flex items-center gap-2'>
															<span className='flex items-center gap-1.5'>
																<CheckCircle2 className='h-3.5 w-3.5 text-muted-foreground' />
																{lesson.attendances_count}/
																{course.offline_enrollments_count}
															</span>
															<Button
																size='sm'
																variant='outline'
																className='h-7'
																disabled={course.offline_enrollments_count === 0}
																onClick={() => setCheckInLesson(lesson)}>
																<ScanLine className='h-3.5 w-3.5' />
																QR
															</Button>
														</div>
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
												</TableCell>
												<TableCell>{statusBadge(lesson.status)}</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={6}
												className='h-32 text-center text-muted-foreground'>
												Khóa học chưa có buổi học nào. Nhấn "Thêm buổi học" để bắt đầu.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								{course.lessons.length > 0 && (
									<TablePaginationFooter
										colSpan={6}
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
									{t === "all" ? "Tất cả" : t === "offline" ? "Offline" : "Online"}
								</Button>
							))}
							<div className='ml-auto flex items-center gap-3'>
								{trackFilter === "offline" && offlineStudents.length > 0 && (
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button size='sm' className='h-8'>
												<ScanLine className='h-4 w-4' />
												Điểm danh QR
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end' className='w-[280px]'>
											<DropdownMenuLabel>Chọn buổi để điểm danh</DropdownMenuLabel>
											<DropdownMenuSeparator />
											{offlineLessons.length > 0 ? (
												offlineLessons.map((l) => (
													<DropdownMenuItem
														key={l.id}
														onClick={() => setCheckInLesson(l)}>
														<span className='flex-1 truncate'>
															Buổi {l.order}: {l.title}
														</span>
														<span className='ml-2 shrink-0 text-xs text-muted-foreground'>
															{l.attendances_count}/{course.offline_enrollments_count}
														</span>
													</DropdownMenuItem>
												))
											) : (
												<div className='px-2 py-1.5 text-xs text-muted-foreground'>
													Chưa có buổi offline nào được xếp lịch.
												</div>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>
						<div className='overflow-hidden rounded-md border'>
							<Table>
								<TableHeader className='[&_th]:text-sm'>
									<TableRow>
										<TableHead className='min-w-[240px]'>Học viên</TableHead>
										<TableHead className='w-[110px]'>Track</TableHead>
										<TableHead className='min-w-[180px]'>Tiến độ</TableHead>
										<TableHead className='w-[100px]'>Vắng</TableHead>
										<TableHead className='w-[150px]'>Hoàn thành</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredEnrollments.length > 0 ? (
										studentsPg.pageItems.map((e) => (
											<TableRow key={e.id}>
												<TableCell>
													<div className='flex items-center gap-2.5'>
														<Avatar className='h-8 w-8'>
															<AvatarImage src={e.user.avatar ?? undefined} />
															<AvatarFallback className='text-xs'>
																{e.user.full_name.charAt(0).toUpperCase()}
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
														<Progress value={e.progress} className='h-2 w-24' />
														<span className='text-xs text-muted-foreground'>
															{e.progress}%
														</span>
													</div>
												</TableCell>
												<TableCell className='text-sm'>
													{e.track === "offline" ? (
														<span
															className={cn(
																e.absent_count > course.max_absent_allowed &&
																	"font-medium text-rose-600",
															)}>
															{e.absent_count}/{course.max_absent_allowed}
														</span>
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
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
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={5}
												className='h-32 text-center text-muted-foreground'>
												Chưa có học viên nào ghi danh.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								{filteredEnrollments.length > 0 && (
									<TablePaginationFooter
										colSpan={5}
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
										<TableHead className='min-w-[200px]'>Mã chứng chỉ</TableHead>
										<TableHead className='min-w-[240px]'>Học viên</TableHead>
										<TableHead className='w-[110px]'>Track</TableHead>
										<TableHead className='w-[150px]'>Ngày cấp</TableHead>
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
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={4}
												className='h-32 text-center text-muted-foreground'>
												Chưa cấp chứng chỉ nào. Chứng chỉ được cấp khi học viên hoàn
												thành khóa học.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								{course.certificates.length > 0 && (
									<TablePaginationFooter
										colSpan={4}
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
				lesson={checkInLesson}
				students={offlineStudents}
				onCheckedIn={handleCheckedIn}
			/>
		</div>
	);
}

export default CourseDetailPage;
