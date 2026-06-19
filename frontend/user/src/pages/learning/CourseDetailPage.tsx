import React, { useEffect, useState } from "react";
import {
	ArrowLeft,
	Award,
	BarChart3,
	CalendarCheck,
	Check,
	ChevronRight,
	Clock,
	Dumbbell,
	GraduationCap,
	ListChecks,
	Lock,
	MessagesSquare,
	Sparkles,
	Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { learningService } from "@/services/learning.service";
import { getCurrentUser, type AuthUser } from "@/services/auth.service";
import type {
	CourseDetail,
	CourseLesson,
	CourseLevel,
	CourseProgressStats,
	CourseTrack,
} from "@/types/learning.types";

const LEVEL_LABEL: Record<CourseLevel, string> = {
	beginner: "Cơ bản",
	intermediate: "Trung cấp",
	advanced: "Nâng cao",
};

// ─── Hàng buổi học ──────────────────────────────────────────────────────────────

const LessonRow: React.FC<{ courseSlug: string; lesson: CourseLesson }> = ({
	courseSlug,
	lesson,
}) => {
	const locked = Boolean(lesson.is_locked);
	const Wrapper: React.ElementType = locked ? "div" : Link;
	const wrapperProps = locked
		? { "aria-disabled": true }
		: { to: `/khoa-hoc/${courseSlug}/${lesson.slug}` };

	return (
		<Wrapper
			{...wrapperProps}
			className={`group flex items-center gap-4 px-5 py-4 transition ${
				locked ? "cursor-not-allowed opacity-60" : "hover:bg-[var(--color-primary-100)]"
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

			<div className='min-w-0 flex-1'>
				<h3 className='font-heading text-lg font-extrabold leading-tight text-black'>
					{lesson.title}
				</h3>
				{lesson.summary && (
					<p className='mt-0.5 truncate text-sm text-gray-500'>{lesson.summary}</p>
				)}
			</div>

			{locked ? (
				<Lock className='h-5 w-5 shrink-0 text-gray-400' />
			) : (
				<ChevronRight className='h-5 w-5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-black' />
			)}
		</Wrapper>
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
	const trackLabel = track === "offline" ? "Loại khoá học: Offline" : "Loại khoá học: Online";
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
			: [
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
				];

	return (
		<div className='space-y-5'>
			{/* Hồ sơ học viên */}
			<SidebarCard>
				<div className='flex items-center gap-3'>
					<span className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[var(--color-pastel-green)]'>
						{user?.picture ? (
							<img src={user.picture} alt='' className='h-full w-full object-cover' />
						) : (
							<GraduationCap className='h-6 w-6 text-black' strokeWidth={2.5} />
						)}
					</span>
					<div className='min-w-0'>
						<p className='truncate font-heading text-base font-extrabold text-black'>
							{user?.name ?? user?.username ?? "Học viên CLB"}
						</p>
						<p className='text-xs font-medium text-gray-500'>{trackLabel}</p>
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

			{/* Tiến độ khóa học */}
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

// ─── Skeleton ───────────────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
	<div className='animate-pulse'>
		<div className='h-56 rounded-2xl border-2 border-black bg-gray-200' />
		<div className='mt-8 grid gap-8 lg:grid-cols-[1fr_320px]'>
			<div className='h-96 rounded-2xl border-2 border-black bg-gray-200' />
			<div className='hidden h-96 rounded-2xl border-2 border-black bg-gray-200 lg:block' />
		</div>
	</div>
);

// ─── CourseDetailPage (tổng quan khóa học) ───────────────────────────────────────

const CourseDetailPage: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const [course, setCourse] = useState<CourseDetail | null>(null);
	const [user, setUser] = useState<AuthUser | null>(null);
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
				if (!cancelled) setCourse(res.data);
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

	useEffect(() => {
		let cancelled = false;
		getCurrentUser()
			.then((u) => {
				if (!cancelled) setUser(u);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	// Buổi học để tiếp tục (buổi chưa hoàn thành đầu tiên)
	const resumeLesson = course?.lessons.find((l) => !l.completed) ?? course?.lessons[0];
	const canClaimCertificate = (course?.progress ?? 0) >= 100;

	return (
		<div className='w-full min-h-screen pb-16 pt-20'>
			<div className='neo-container px-6'>
				{/* Back link */}
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
						{/* ── Hero khóa học ── */}
						<div className='relative overflow-hidden rounded-2xl border-2 border-black shadow-[4px_4px_0_#111]'>
							{/* Nền */}
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

							{/* Nội dung */}
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

								{resumeLesson && (
									<Link
										to={`/khoa-hoc/${course.slug}/${resumeLesson.slug}`}
										className='mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-3 font-heading text-sm font-extrabold text-black shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
										<GraduationCap className='h-4 w-4' strokeWidth={2.5} />
										{course.progress !== null ? "Tiếp tục học" : "Bắt đầu học"}
									</Link>
								)}

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
						<div className='grid items-start gap-8 lg:grid-cols-[1fr_320px]'>
							{/* Danh sách buổi học */}
							<div>
								<h2 className='mb-4 font-heading text-2xl font-extrabold text-black'>
									Nội dung khóa học
								</h2>
								<div className='overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111] divide-y-2 divide-black'>
									{course.lessons.map((lesson) => (
										<LessonRow
											key={lesson.id}
											courseSlug={course.slug}
											lesson={lesson}
										/>
									))}
								</div>
							</div>

							{/* Sidebar — canh đỉnh thẻ đầu tiên ngang với danh sách buổi (bù chiều cao tiêu đề) */}
							<aside className='lg:sticky lg:top-24 lg:self-start lg:pt-[calc(2rem+1rem)]'>
								<Sidebar
									canClaimCertificate={canClaimCertificate}
									stats={course.stats}
									track={course.enrollment_track}
									user={user}
								/>
							</aside>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CourseDetailPage;
