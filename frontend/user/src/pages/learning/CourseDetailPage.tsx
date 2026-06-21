import React, { useEffect, useState } from "react";
import {
	ArrowLeft,
	Award,
	BarChart3,
	BookmarkCheck,
	Bookmark,
	CalendarCheck,
	Check,
	ChevronRight,
	Clock,
	Dumbbell,
	GraduationCap,
	ListChecks,
	Lock,
	MessagesSquare,
	QrCode,
	Sparkles,
	Users,
} from "lucide-react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { learningService } from "@/services/learning.service";
import type { AuthUser } from "@/services/auth.service";
import type {
	CourseDetail,
	CourseLesson,
	CourseLevel,
	CourseProgressStats,
	CourseTrack,
} from "@/types/learning.types";

// ─── Phase khoá học theo timeline ────────────────────────────────────────────────

type CoursePhase = "upcoming" | "enrollment_open" | "in_progress" | "ended";

function getCoursePhase(course: CourseDetail): CoursePhase {
	const now = new Date();
	if (course.enrollment_start && new Date(course.enrollment_start) > now) return "upcoming";
	if (course.enrollment_deadline && new Date(course.enrollment_deadline) > now)
		return "enrollment_open";
	if (course.course_end && new Date(course.course_end) <= now) return "ended";
	return "in_progress";
}

const LEVEL_LABEL: Record<CourseLevel, string> = {
	beginner: "Cơ bản",
	intermediate: "Trung cấp",
	advanced: "Nâng cao",
};

// ─── Hàng buổi học ───────────────────────────────────────────────────────────────

const LessonRow: React.FC<{
	courseSlug: string;
	lesson: CourseLesson;
	track: CourseTrack | null;
	isActiveQrLesson: boolean;
	isFrontendLocked: boolean;
	onCreateTicket: (lessonId: number) => void;
}> = ({ courseSlug, lesson, track, isActiveQrLesson, isFrontendLocked, onCreateTicket }) => {
	const navigate = useNavigate();
	const locked = Boolean(lesson.is_locked) || isFrontendLocked;
	const isOffline = track === "offline";

	return (
		<div
			onClick={() => !locked && navigate(`/khoa-hoc/${courseSlug}/${lesson.slug}`)}
			className={`group flex items-center gap-4 px-5 py-4 transition ${
				locked
					? "cursor-not-allowed opacity-60"
					: "cursor-pointer hover:bg-[var(--color-primary-100)]"
			}`}>
			{/* Chỉ số / trạng thái buổi học */}
			<span
				className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black font-heading text-sm font-extrabold ${
					lesson.completed
						? "bg-[var(--color-primary)] text-black"
						: "bg-white text-black"
				}`}>
				{lesson.completed ? <Check className='h-5 w-5' strokeWidth={3} /> : lesson.order}
			</span>

			{/* Tiêu đề + mô tả */}
			<div className='min-w-0 flex-1'>
				<h3 className='font-heading text-lg font-extrabold leading-tight text-black'>
					{lesson.title}
				</h3>
				{lesson.summary && (
					<p className='mt-0.5 truncate text-sm text-gray-500'>{lesson.summary}</p>
				)}
			</div>

			{/* QR / điểm danh — chỉ hiện với track offline, lesson active, dừng sự kiện click row */}
			{isOffline && !locked && isActiveQrLesson && (
				<div className='shrink-0' onClick={(e) => e.stopPropagation()}>
					{lesson.is_attended ? (
						<span className='flex items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-pastel-green)] px-3 py-1.5 font-heading text-xs font-extrabold text-black'>
							<Check className='h-3.5 w-3.5' strokeWidth={3} />
							Đã điểm danh
						</span>
					) : lesson.qr_ticket ? (
						<Link
							to={`/khoa-hoc/${courseSlug}/${lesson.slug}/qr`}
							onClick={(e) => e.stopPropagation()}
							className='flex items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary)] px-3 py-1.5 font-heading text-xs font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none'>
							<QrCode className='h-3.5 w-3.5' strokeWidth={2.5} />
							QR điểm danh
						</Link>
					) : (
						<button
							type='button'
							onClick={(e) => {
								e.stopPropagation();
								onCreateTicket(lesson.id);
							}}
							className='flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-1.5 font-heading text-xs font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-none'>
							<CalendarCheck className='h-3.5 w-3.5' strokeWidth={2.5} />
							Sẽ tham gia
						</button>
					)}
				</div>
			)}

			{locked ? (
				<Lock className='h-5 w-5 shrink-0 text-gray-400' />
			) : (
				<ChevronRight className='h-5 w-5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-black' />
			)}
		</div>
	);
};

// ─── Thanh tiến độ nhỏ ───────────────────────────────────────────────────────────

const MiniProgress: React.FC<{
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
	label: string;
	done?: number | null;
	total?: number | null;
	accent: string;
}> = ({ icon: Icon, label, done, total, accent }) => {
	const safeDone = done ?? 0;
	const safeTotal = total ?? 0;
	const pct = safeTotal > 0 ? Math.min(100, Math.round((safeDone / safeTotal) * 100)) : 0;
	return (
		<div className='flex items-center gap-3'>
			<span
				className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black ${accent}`}>
				<Icon className='h-4 w-4' strokeWidth={2.5} />
			</span>
			<div className='min-w-0 flex-1'>
				<div className='flex items-center justify-between'>
					<span className='font-heading text-sm font-extrabold text-black'>{label}</span>
					<span className='font-heading text-xs font-bold text-gray-500'>
						{safeDone} / {safeTotal}
					</span>
				</div>
				<div className='mt-1.5 h-2 w-full overflow-hidden rounded-full border-2 border-black bg-white'>
					<div
						className='h-full rounded-full bg-[var(--color-primary)]'
						style={{ width: `${pct}%` }}
					/>
				</div>
			</div>
		</div>
	);
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────────

const SidebarCard: React.FC<{ children: React.ReactNode; className?: string }> = ({
	children,
	className = "",
}) => (
	<div
		className={`rounded-2xl border-2 border-black bg-white p-5 shadow-[4px_4px_0_#111] ${className}`}>
		{children}
	</div>
);

const Sidebar: React.FC<{
	canClaimCertificate: boolean;
	stats: CourseProgressStats;
	track: CourseTrack | null;
	user: AuthUser | null;
}> = ({ canClaimCertificate, stats, track, user }) => {
	const trackLabel =
		track === "offline"
			? "Hình thức học: Offline"
			: track === "online"
				? "Hình thức học: Online"
				: null;

	const progressItems =
		track === "offline"
			? [
					{
						icon: CalendarCheck,
						label: "Điểm danh",
						done: stats.attendance_done,
						total: stats.attendance_total,
						accent: "bg-[var(--color-pastel-green)]",
					},
					{
						icon: Dumbbell,
						label: "Bài thực hành",
						done: stats.exercises_done,
						total: stats.exercises_total,
						accent: "bg-[var(--color-pastel-blue)]",
					},
					{
						icon: ListChecks,
						label: "Quiz",
						done: stats.quizzes_done,
						total: stats.quizzes_total,
						accent: "bg-[var(--color-pastel-pink)]",
					},
					{
						icon: Sparkles,
						label: "Điểm XP",
						done: stats.xp_earned,
						total: stats.xp_total,
						accent: "bg-[var(--color-pastel-yellow)]",
					},
				]
			: track === "online"
				? [
						{
							icon: ListChecks,
							label: "Quiz",
							done: stats.quizzes_done,
							total: stats.quizzes_total,
							accent: "bg-[var(--color-pastel-pink)]",
						},
						{
							icon: Sparkles,
							label: "Điểm XP",
							done: stats.xp_earned,
							total: stats.xp_total,
							accent: "bg-[var(--color-pastel-yellow)]",
						},
					]
				: [];

	return (
		<div className='space-y-5'>
			{/* Hồ sơ học viên — chỉ hiện khi đã ghi danh */}
			{track && (
				<SidebarCard>
					<div className='flex items-center gap-3'>
						<span className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[var(--color-pastel-green)]'>
							{user?.picture ? (
								<img
									src={user.picture}
									alt=''
									className='h-full w-full object-cover'
								/>
							) : (
								<GraduationCap className='h-6 w-6 text-black' strokeWidth={2.5} />
							)}
						</span>
						<div className='min-w-0'>
							<p className='truncate font-heading text-base font-extrabold text-black'>
								{user?.name ?? user?.username ?? "Học viên CLB"}
							</p>
							{trackLabel && (
								<p className='text-xs font-medium text-gray-500'>{trackLabel}</p>
							)}
						</div>
					</div>
					{canClaimCertificate && (
						<button
							type='button'
							className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-4 py-3 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<Award className='h-4 w-4' strokeWidth={2.5} />
							Nhận chứng chỉ
						</button>
					)}
				</SidebarCard>
			)}

			{/* Tiến độ — chỉ hiện khi đã ghi danh và có items */}
			{track && progressItems.length > 0 && (
				<SidebarCard>
					<h3 className='mb-4 font-heading text-lg font-extrabold text-black'>
						Tiến độ khóa học
					</h3>
					<div className='space-y-4'>
						{progressItems.map((item) => (
							<MiniProgress
								key={item.label}
								icon={item.icon}
								label={item.label}
								done={item.done}
								total={item.total}
								accent={item.accent}
							/>
						))}
					</div>
				</SidebarCard>
			)}

			{/* CTA cộng đồng */}
			<SidebarCard className='bg-[var(--color-pastel-purple)]'>
				<h3 className='font-heading text-lg font-extrabold text-black'>Cần trợ giúp?</h3>
				<p className='mt-1 text-sm text-gray-600'>Đặt câu hỏi trong cộng đồng CLB.</p>
				<Link
					to='/cong-dong'
					className='mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					<MessagesSquare className='h-4 w-4' strokeWidth={2.5} />
					Đến cộng đồng
				</Link>
			</SidebarCard>
		</div>
	);
};

// ─── Panel yêu cầu đăng nhập ────────────────────────────────────────────────────

const CourseContentLoginPanel: React.FC<{ courseSlug: string }> = ({ courseSlug }) => (
	<div className='relative overflow-hidden rounded-2xl border-2 border-black bg-[var(--color-surface)] shadow-[4px_4px_0_#111]'>
		<div className='flex items-center justify-between border-b-2 border-black bg-white px-4 py-3 sm:px-5'>
			<span className='flex items-center gap-2 font-heading text-xs font-extrabold uppercase tracking-[0.12em] text-black'>
				<Lock className='h-4 w-4' strokeWidth={2.5} />
				Learning dashboard
			</span>
			<span className='rounded-full border-2 border-black bg-[var(--color-pastel-yellow)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-black'>
				Đang khóa
			</span>
		</div>

		<div className='relative grid gap-5 p-5 sm:grid-cols-[1fr_190px] sm:p-7'>
			<div className='flex flex-col justify-center'>
				<span className='flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-[var(--color-primary)]'>
					<Lock className='h-5 w-5 text-black' strokeWidth={2.75} />
				</span>
				<h3 className='mt-5 font-heading text-xl font-extrabold leading-tight text-black sm:text-2xl'>
					Đăng nhập để mở khóa nội dung
				</h3>
				<p className='mt-2 max-w-md text-sm leading-6 text-gray-600'>
					Theo dõi các buổi học, tiến độ và tài liệu của bạn trong một không gian học tập
					cá nhân.
				</p>
				<Link
					to={`/login?returnTo=${encodeURIComponent(`/khoa-hoc/${courseSlug}`)}`}
					className='mt-5 inline-flex w-fit items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-4 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					<ArrowLeft className='h-4 w-4 rotate-180' strokeWidth={2.75} />
					Đăng nhập ngay
				</Link>
			</div>

			<div className='grid grid-cols-2 gap-3 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0_#111]'>
				<div className='col-span-2 flex items-center justify-between border-b-2 border-black pb-2'>
					<span className='text-[10px] font-extrabold uppercase tracking-wider text-gray-500'>
						Tiến độ của bạn
					</span>
					<Lock className='h-3.5 w-3.5 text-gray-400' />
				</div>
				<div className='rounded-lg border-2 border-black bg-[var(--color-pastel-blue)] p-2'>
					<p className='text-[10px] font-bold text-gray-600'>Hoàn thành</p>
					<p className='mt-1 font-heading text-xl font-extrabold text-black'>—%</p>
				</div>
				<div className='rounded-lg border-2 border-black bg-[var(--color-pastel-pink)] p-2'>
					<p className='text-[10px] font-bold text-gray-600'>Điểm XP của bạn</p>
					<p className='mt-1 font-heading text-xl font-extrabold text-black'>—XP</p>
				</div>
				<div className='col-span-2 h-2 overflow-hidden rounded-full border-2 border-black bg-gray-100'>
					<div className='h-full w-1/3 bg-gray-300' />
				</div>
			</div>
		</div>
	</div>
);

// ─── Skeleton ────────────────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
	<div className='animate-pulse'>
		<div className='h-56 rounded-2xl border-2 border-black bg-gray-200' />
		<div className='mt-8 grid gap-8 lg:grid-cols-[1fr_320px]'>
			<div className='h-96 rounded-2xl border-2 border-black bg-gray-200' />
			<div className='hidden h-96 rounded-2xl border-2 border-black bg-gray-200 lg:block' />
		</div>
	</div>
);

// ─── CourseDetailPage ─────────────────────────────────────────────────────────────

type LayoutOutletContext = { user: AuthUser | null; loadingUser: boolean };

const CourseDetailPage: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const { user, loadingUser } = useOutletContext<LayoutOutletContext>();
	const [course, setCourse] = useState<CourseDetail | null>(null);
	const [lessons, setLessons] = useState<CourseLesson[]>([]);
	const [interested, setInterested] = useState(false);
	const [enrolling, setEnrolling] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!slug) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		learningService
			.getCourse(slug)
			.then((res) => {
				if (!cancelled) {
					setCourse(res.data);
					setLessons(res.data.lessons);
					setInterested(res.data.is_interested);
				}
			})
			.catch(() => {
				if (!cancelled) setError("Không tìm thấy khóa học này.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [slug]);

	// ─── Derived state ────────────────────────────────────────────────────────────

	const phase = course ? getCoursePhase(course) : "in_progress";
	const isEnrolled = Boolean(course?.enrollment_track);
	const hasLessons = lessons.length > 0;
	const hasAccessToken = Boolean(localStorage.getItem("access_token"));
	const shouldWaitForUser = loadingUser && hasAccessToken;
	const showSidebar = Boolean(user) && !shouldWaitForUser;
	const resumeLesson = lessons.find((l) => !l.completed) ?? lessons[0];
	const canClaimCertificate = (course?.progress ?? 0) >= 100;

	// Khoá đã đóng đăng ký và có lesson → tự động coi là học online cho sidebar
	const effectiveTrack =
		course?.enrollment_track ??
		((phase === "in_progress" || phase === "ended") && hasLessons ? "online" : null);

	// Lock lesson theo phase + session_start:
	// - upcoming/enrollment_open → lock toàn bộ (chưa có buổi nào diễn ra)
	// - in_progress/ended → chỉ lock lesson có session_start trong tương lai,
	//   trừ lesson gần nhất (mở để click vào xem, nhưng hiện panel "chưa diễn ra")
	const frontendLockedIds = (() => {
		if (phase === "upcoming" || phase === "enrollment_open") {
			return new Set<number>(lessons.map((l) => l.id));
		}
		const now = new Date();
		const upcoming = lessons
			.filter((l) => l.session_start && new Date(l.session_start) > now)
			.sort(
				(a, b) =>
					new Date(a.session_start!).getTime() - new Date(b.session_start!).getTime(),
			);
		return new Set<number>(upcoming.slice(1).map((l) => l.id));
	})();

	// Lesson offline active: lesson chưa điểm danh + session_end chưa qua (hoặc chưa set), đầu tiên theo thứ tự
	const activeQrLessonId = (() => {
		const now = new Date();
		return (
			lessons.find((l) => {
				if (l.is_attended) return false;
				// Ẩn chỉ khi session_end tồn tại VÀ đã qua — nếu chưa set thì vẫn hiện
				if (l.session_end && new Date(l.session_end) <= now) return false;
				return true;
			})?.id ?? null
		);
	})();

	// ─── Handlers ─────────────────────────────────────────────────────────────────

	const handleEnrollOffline = async () => {
		if (enrolling) return;
		setEnrolling(true);
		try {
			// TODO: await learningService.enrollOffline(slug!);
			// Reload course để lấy enrollment_track mới
		} finally {
			setEnrolling(false);
		}
	};

	const handleToggleInterest = () => {
		setInterested((prev) => !prev);
		// TODO: await learningService.toggleInterest(slug!);
	};

	// Optimistic: cấp vé QR tạm, server trả về token thật sau
	const handleCreateTicket = (lessonId: number) => {
		setLessons((prev) =>
			prev.map((l) =>
				l.id === lessonId ? { ...l, qr_ticket: { token: "pending", used_at: null } } : l,
			),
		);
		// TODO: const ticket = await learningService.createQrTicket(lessonId);
		// setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, qr_ticket: ticket } : l));
	};

	return (
		<div className='w-full min-h-screen pb-16 pt-20'>
			<div className='neo-container px-6'>
				<Link
					to='/khoa-hoc'
					className='mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 transition hover:text-black'>
					<ArrowLeft className='h-4 w-4' />
					Tất cả khóa học
				</Link>

				{loading ? (
					<DetailSkeleton />
				) : error || !course ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center shadow-[4px_4px_0_#111]'>
						<p className='font-heading text-xl font-extrabold text-black'>
							Có lỗi xảy ra
						</p>
						<p className='mt-2 text-sm text-gray-600'>
							{error ?? "Không tải được khóa học."}
						</p>
						<Link
							to='/khoa-hoc'
							className='mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Quay lại danh sách
						</Link>
					</div>
				) : (
					<div className='space-y-8'>
						{/* ── Hero ── */}
						<div className='relative overflow-hidden rounded-2xl border-2 border-black shadow-[4px_4px_0_#111]'>
							<div className='absolute inset-0'>
								{course.thumbnail ? (
									<img
										src={course.thumbnail}
										alt=''
										className='h-full w-full object-cover'
									/>
								) : (
									<div className='h-full w-full bg-[var(--color-pastel-green)]' />
								)}
								<div className='absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20' />
							</div>

							<div className='relative max-w-2xl p-6 md:p-10'>
								<span className='inline-flex w-fit items-center gap-2 rounded-full border-2 border-black bg-[var(--color-primary)] px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em] text-black shadow-[2px_2px_0_#111]'>
									<BarChart3 className='h-3.5 w-3.5' strokeWidth={2.5} />
									{LEVEL_LABEL[course.level]} · Khóa học
								</span>

								<h1 className='mt-4 font-heading text-4xl font-extrabold leading-tight text-white drop-shadow-[2px_2px_0_#111] md:text-5xl'>
									{course.title}
								</h1>
								{course.excerpt && (
									<p className='mt-3 max-w-xl text-base leading-7 text-white/90'>
										{course.excerpt}
									</p>
								)}

								{/* ── CTA chính ── */}
								<div className='mt-6 flex flex-wrap items-center gap-3'>
									{isEnrolled ? (
										/* Đã ghi danh → tiếp tục / bắt đầu học */
										resumeLesson && (
											<Link
												to={`/khoa-hoc/${course.slug}/${resumeLesson.slug}`}
												className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-3 font-heading text-sm font-extrabold text-black shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
												<GraduationCap
													className='h-4 w-4'
													strokeWidth={2.5}
												/>
												{(course.progress ?? 0) > 0
													? "Tiếp tục học"
													: "Bắt đầu học"}
											</Link>
										)
									) : phase === "enrollment_open" ? (
										/* Đang mở đăng ký → đăng ký offline */
										<button
											type='button'
											onClick={handleEnrollOffline}
											disabled={enrolling}
											className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-3 font-heading text-sm font-extrabold text-black shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60 disabled:cursor-not-allowed'>
											<Users className='h-4 w-4' strokeWidth={2.5} />
											{enrolling
												? "Đang đăng ký..."
												: "Đăng ký lớp học offline"}
										</button>
									) : hasLessons && phase !== "upcoming" ? (
										/* Đã đóng đăng ký, có bài học → học online */
										<Link
											to={`/khoa-hoc/${course.slug}/${resumeLesson?.slug}`}
											className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-3 font-heading text-sm font-extrabold text-black shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
											<GraduationCap className='h-4 w-4' strokeWidth={2.5} />
											Bắt đầu học
										</Link>
									) : (
										/* Khoá chưa mở hoặc chưa có bài học → quan tâm */
										<button
											type='button'
											onClick={handleToggleInterest}
											className={`inline-flex items-center gap-2 rounded-xl border-2 border-black px-6 py-3 font-heading text-sm font-extrabold shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
												interested
													? "bg-white text-black shadow-none translate-x-[1px] translate-y-[1px]"
													: "bg-[var(--color-primary)] text-black"
											}`}>
											{interested ? (
												<BookmarkCheck
													className='h-4 w-4'
													strokeWidth={2.5}
												/>
											) : (
												<Bookmark className='h-4 w-4' strokeWidth={2.5} />
											)}
											{interested ? "Đã quan tâm" : "Quan tâm"}
										</button>
									)}
								</div>

								{/* Meta */}
								<div className='mt-5 flex flex-wrap items-center gap-5 text-sm font-semibold text-white/80'>
									<span className='flex items-center gap-1.5'>
										<GraduationCap className='h-4 w-4' />
										{course.lessons_count} buổi
									</span>
									<span className='flex items-center gap-1.5'>
										<Clock className='h-4 w-4' />
										{Math.round(course.duration_minutes / 60)} giờ
									</span>
									<span className='flex items-center gap-1.5'>
										<Users className='h-4 w-4' />
										{course.enrolled_count} học viên
									</span>
								</div>
							</div>
						</div>

						{/* ── Bố cục 2 cột ── */}
						<div
							className={`grid items-start gap-8 ${
								showSidebar ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"
							}`}>
							{/* Danh sách buổi học */}
							<div>
								<h2 className='mb-4 font-heading text-2xl font-extrabold text-black'>
									Nội dung khóa học
								</h2>

								{shouldWaitForUser ? (
									<div className='flex min-h-72 items-center justify-center rounded-2xl border-2 border-black bg-[var(--color-surface)] px-6 text-center shadow-[4px_4px_0_#111]'>
										<p className='font-heading text-sm font-extrabold text-gray-600'>
											Đang kiểm tra phiên đăng nhập...
										</p>
									</div>
								) : !user ? (
									<CourseContentLoginPanel courseSlug={course.slug} />
								) : hasLessons ? (
									<div className='overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111] divide-y-2 divide-black'>
										{lessons.map((lesson) => (
											<LessonRow
												key={lesson.id}
												courseSlug={course.slug}
												lesson={lesson}
												track={effectiveTrack}
												isActiveQrLesson={lesson.id === activeQrLessonId}
												isFrontendLocked={frontendLockedIds.has(lesson.id)}
												onCreateTicket={handleCreateTicket}
											/>
										))}
									</div>
								) : (
									<div className='rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center'>
										<span className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-300'>
											<GraduationCap
												className='h-7 w-7 text-white'
												strokeWidth={3}
											/>
										</span>
										<p className='mt-4 font-heading text-base font-extrabold text-black'>
											Chưa có buổi học nào
										</p>
										<p className='mt-1 text-sm text-gray-500'>
											Khoá học hiện chưa có buổi học nào, vui lòng quay lại
											sau.
										</p>
									</div>
								)}
							</div>

							{/* Sidebar chỉ hiển thị sau khi xác thực thành công */}
							{showSidebar && (
								<aside className='lg:sticky lg:top-24 lg:self-start lg:pt-[calc(2rem+1rem)]'>
									<Sidebar
										canClaimCertificate={canClaimCertificate}
										stats={course.stats}
										track={effectiveTrack}
										user={user}
									/>
								</aside>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CourseDetailPage;
