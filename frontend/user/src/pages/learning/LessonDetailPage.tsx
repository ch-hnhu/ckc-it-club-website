import React, { useEffect, useState } from "react";
import {
	ArrowLeft,
	BookMarked,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Circle,
	Code2,
	GraduationCap,
	ListChecks,
	PlayCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { learningService } from "@/services/learning.service";
import type { CourseContentItem, LessonDetail } from "@/types/learning.types";

interface PanelConfig {
	key: keyof Pick<LessonDetail, "videos" | "references" | "exercises" | "quizzes">;
	title: string;
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
	accent: string; // class nền pastel cho header
}

const PANELS: PanelConfig[] = [
	{ key: "videos", title: "Video bài giảng", icon: PlayCircle, accent: "bg-[var(--color-pastel-blue)]" },
	{ key: "references", title: "Tham khảo", icon: BookMarked, accent: "bg-[var(--color-pastel-purple)]" },
	{ key: "exercises", title: "Bài tập", icon: Code2, accent: "bg-[var(--color-pastel-yellow)]" },
	{ key: "quizzes", title: "Quiz", icon: ListChecks, accent: "bg-[var(--color-pastel-pink)]" },
];

// ─── Khối nội dung (1 trong 4 góc) ──────────────────────────────────────────────

const ContentPanel: React.FC<{
	config: PanelConfig;
	items: CourseContentItem[];
	/** Nếu có, mục có slug sẽ thành link `${linkBase}/${slug}` (vd video) */
	linkBase?: string;
}> = ({ config, items, linkBase }) => {
	const Icon = config.icon;
	const doneCount = items.filter((i) => i.completed).length;
	const rowClass =
		"flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-gray-50";

	return (
		<div className='flex flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
			<div className={`flex items-center gap-3 border-b-2 border-black px-5 py-3 ${config.accent}`}>
				<span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white'>
					<Icon className='h-5 w-5' strokeWidth={2.5} />
				</span>
				<h3 className='font-heading text-lg font-extrabold text-black'>{config.title}</h3>
				<span className='ml-auto rounded-full border-2 border-black bg-white px-2.5 py-0.5 font-heading text-xs font-extrabold text-black'>
					{doneCount}/{items.length}
				</span>
			</div>
			<ul className='flex-1 p-2'>
				{items.map((it) => {
					const inner = (
						<>
							{it.completed ? (
								<CheckCircle2 className='h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
							) : (
								<Circle className='h-5 w-5 shrink-0 text-gray-300' />
							)}
							<span className='flex-1 text-sm font-semibold text-black'>{it.title}</span>
							{it.meta && (
								<span className='shrink-0 text-xs font-medium text-gray-400'>{it.meta}</span>
							)}
						</>
					);
					const linkable = linkBase && it.slug;
					return (
						<li key={it.id}>
							{linkable ? (
								<Link to={`${linkBase}/${it.slug}`} className={rowClass}>
									{inner}
								</Link>
							) : (
								<button type='button' className={rowClass}>
									{inner}
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
};

// ─── Vòng tròn buổi học ở trung tâm ─────────────────────────────────────────────

const CenterNode: React.FC<{ progress: number | null; order: number }> = ({ progress, order }) => {
	const pct = Math.max(0, Math.min(100, progress ?? 0));
	const size = 176;
	const stroke = 16;
	const r = (size - stroke) / 2;
	const circ = 2 * Math.PI * r;
	const dash = (pct / 100) * circ;

	return (
		<div className='relative h-44 w-44'>
			{/* Nền tròn + đổ bóng cứng (phong cách neo) */}
			<div className='absolute inset-0 rounded-full border-2 border-black bg-white shadow-[5px_5px_0_#111]' />

			{/* Vòng tiến độ: rãnh xám + cung xanh chạy theo % */}
			<svg
				viewBox={`0 0 ${size} ${size}`}
				className='absolute inset-0 h-full w-full -rotate-90'>
				<circle cx={size / 2} cy={size / 2} r={r} fill='none' stroke='#e5e7eb' strokeWidth={stroke} />
				{pct > 0 && (
					<circle
						cx={size / 2}
						cy={size / 2}
						r={r}
						fill='none'
						stroke='var(--color-primary)'
						strokeWidth={stroke}
						strokeLinecap='round'
						strokeDasharray={`${dash} ${circ}`}
						className='transition-[stroke-dasharray] duration-700 ease-out'
					/>
				)}
			</svg>

			{/* Đĩa trung tâm */}
			<div className='absolute inset-[28px] flex flex-col items-center justify-center rounded-full border-2 border-black bg-white text-center'>
				<span className='font-heading text-[11px] font-extrabold uppercase tracking-wide text-gray-500'>
					Buổi {order}
				</span>
				{progress !== null ? (
					<>
						<span className='font-heading text-3xl font-extrabold leading-none text-black'>
							{pct}
							<span className='text-lg'>%</span>
						</span>
						<span className='mt-0.5 text-[10px] font-bold text-gray-400'>hoàn thành</span>
					</>
				) : (
					<>
						<GraduationCap className='h-7 w-7 text-black' strokeWidth={2.5} />
						<span className='mt-1 text-[10px] font-bold text-gray-400'>Bắt đầu</span>
					</>
				)}
			</div>
		</div>
	);
};

// ─── Skeleton ───────────────────────────────────────────────────────────────────

const DetailSkeleton: React.FC = () => (
	<div className='animate-pulse space-y-8'>
		<div className='h-28 rounded-2xl border-2 border-black bg-gray-200' />
		<div className='grid gap-6 md:grid-cols-2'>
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className='h-64 rounded-2xl border-2 border-black bg-gray-200' />
			))}
		</div>
	</div>
);

// ─── LessonDetailPage ───────────────────────────────────────────────────────────

const LessonDetailPage: React.FC = () => {
	const { slug, lessonSlug } = useParams<{ slug: string; lessonSlug: string }>();
	const [lesson, setLesson] = useState<LessonDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!slug || !lessonSlug) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		learningService
			.getLesson(slug, lessonSlug)
			.then((res) => {
				if (!cancelled) setLesson(res.data);
			})
			.catch(() => {
				if (!cancelled) setError("Không tìm thấy buổi học này.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [slug, lessonSlug]);

	return (
		<div className='w-full min-h-screen pb-16 pt-20'>
			<div className='neo-container px-6'>
				{/* Back link → trang tổng quan khóa học */}
				<Link
					to={`/khoa-hoc/${slug}`}
					className='mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 transition hover:text-black'>
					<ArrowLeft className='h-4 w-4' />
					{lesson ? lesson.course.title : "Quay lại khóa học"}
				</Link>

				{loading ? (
					<DetailSkeleton />
				) : error || !lesson ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center shadow-[4px_4px_0_#111]'>
						<p className='font-heading text-xl font-extrabold text-black'>Có lỗi xảy ra</p>
						<p className='mt-2 text-sm text-gray-600'>{error ?? "Không tải được buổi học."}</p>
						<Link
							to={`/khoa-hoc/${slug}`}
							className='mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Quay lại khóa học
						</Link>
					</div>
				) : (
					<div className='space-y-10'>
						{/* ── Header buổi học ── */}
						<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111] md:p-8'>
							<span className='inline-flex w-fit items-center gap-2 rounded-full border-2 border-black bg-[var(--color-pastel-green)] px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em] text-black shadow-[2px_2px_0_#111]'>
								Buổi {lesson.order}
							</span>
							<h1 className='mt-4 font-heading text-3xl font-extrabold leading-tight text-black md:text-4xl'>
								{lesson.title}
							</h1>
							{lesson.summary && (
								<p className='mt-3 text-base leading-7 text-gray-600'>{lesson.summary}</p>
							)}
						</div>

						{/* ── Hub nội dung buổi học ── */}
						<div>
							<h2 className='mb-6 text-center font-heading text-3xl font-extrabold leading-tight text-black md:text-4xl'>
								Nội dung buổi học
							</h2>

							{/* Vòng tròn trung tâm — hiển thị phía trên trên mobile */}
							<div className='mb-8 flex justify-center md:hidden'>
								<CenterNode progress={lesson.progress} order={lesson.order} />
							</div>

							<div className='relative'>
								<div className='grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-72 md:gap-y-12'>
									{PANELS.map((cfg) => (
										<ContentPanel
											key={cfg.key}
											config={cfg}
											items={lesson[cfg.key]}
											linkBase={
												cfg.key === "videos"
													? `/khoa-hoc/${slug}/${lessonSlug}`
													: undefined
											}
										/>
									))}
								</div>

								{/* Vòng tròn trung tâm — chồng lên khoảng giữa trên desktop */}
								<div className='pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block'>
									<CenterNode progress={lesson.progress} order={lesson.order} />
								</div>
							</div>
						</div>

						{/* ── Điều hướng buổi trước / sau ── */}
						<div className='flex flex-col gap-4 border-t-2 border-dashed border-gray-300 pt-6 sm:flex-row sm:justify-between'>
							{lesson.prev ? (
								<Link
									to={`/khoa-hoc/${slug}/${lesson.prev.slug}`}
									className='group inline-flex max-w-full items-center gap-3 rounded-xl border-2 border-black bg-white px-4 py-3 shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
									<ChevronLeft className='h-5 w-5 shrink-0' />
									<span className='min-w-0'>
										<span className='block text-[11px] font-bold uppercase tracking-wide text-gray-400'>
											Buổi trước
										</span>
										<span className='block truncate font-heading text-sm font-extrabold text-black'>
											{lesson.prev.title}
										</span>
									</span>
								</Link>
							) : (
								<span />
							)}
							{lesson.next && (
								<Link
									to={`/khoa-hoc/${slug}/${lesson.next.slug}`}
									className='group inline-flex max-w-full items-center gap-3 rounded-xl border-2 border-black bg-[var(--color-primary)] px-4 py-3 text-right shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none sm:ml-auto'>
									<span className='min-w-0'>
										<span className='block text-[11px] font-bold uppercase tracking-wide text-black/60'>
											Buổi tiếp theo
										</span>
										<span className='block truncate font-heading text-sm font-extrabold text-black'>
											{lesson.next.title}
										</span>
									</span>
									<ChevronRight className='h-5 w-5 shrink-0' />
								</Link>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default LessonDetailPage;
