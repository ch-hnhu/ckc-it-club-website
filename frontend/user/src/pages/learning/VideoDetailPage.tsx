import React, { useEffect, useMemo, useState } from "react";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	CircleCheck,
	Clock,
	FileText,
	FileArchive,
	Link2,
	ListVideo,
	MessagesSquare,
	PlayCircle,
	Sparkles,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { learningService } from "@/services/learning.service";
import type { VideoAttachment, VideoDetail } from "@/types/learning.types";

const ATTACHMENT_ICON: Record<VideoAttachment["kind"], React.ComponentType<{ className?: string }>> = {
	pdf: FileText,
	zip: FileArchive,
	link: Link2,
};

// ─── Skeleton ───────────────────────────────────────────────────────────────────

const VideoSkeleton: React.FC = () => (
	<div className='animate-pulse'>
		<div className='aspect-video rounded-2xl border-2 border-black bg-gray-200' />
		<div className='mt-8 grid gap-8 lg:grid-cols-[1fr_300px]'>
			<div className='h-40 rounded-2xl border-2 border-black bg-gray-200' />
			<div className='hidden h-72 rounded-2xl border-2 border-black bg-gray-200 lg:block' />
		</div>
	</div>
);

// ─── VideoDetailPage ─────────────────────────────────────────────────────────────

const VideoDetailPage: React.FC = () => {
	const { slug, lessonSlug, videoSlug } = useParams<{
		slug: string;
		lessonSlug: string;
		videoSlug: string;
	}>();
	const [video, setVideo] = useState<VideoDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [completed, setCompleted] = useState(false);
	const [startAt, setStartAt] = useState(0);

	useEffect(() => {
		if (!slug || !lessonSlug || !videoSlug) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		setStartAt(0);
		learningService
			.getVideo(slug, lessonSlug, videoSlug)
			.then((res) => {
				if (cancelled) return;
				setVideo(res.data);
				setCompleted(res.data.completed);
			})
			.catch(() => {
				if (!cancelled) setError("Không tìm thấy video này.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [slug, lessonSlug, videoSlug]);

	// Nguồn phát: nhúng iframe (YouTube) hoặc file mp4
	const isEmbed = useMemo(
		() => Boolean(video && (video.url.includes("youtube") || video.url.includes("/embed"))),
		[video],
	);

	const embedSrc = useMemo(() => {
		if (!video) return "";
		const sep = video.url.includes("?") ? "&" : "?";
		return `${video.url}${sep}start=${startAt}${startAt ? "&autoplay=1" : ""}`;
	}, [video, startAt]);

	// Điều hướng tuần tự dựa trên playlist của buổi học
	const playlist = video?.playlist ?? [];
	const curIdx = playlist.findIndex((p) => p.current);
	const prevItem = curIdx > 0 ? playlist[curIdx - 1] : null;
	const nextItem =
		curIdx >= 0 && curIdx < playlist.length - 1 ? playlist[curIdx + 1] : null;
	// Back: video trước, hoặc về trang buổi học nếu đang ở video đầu
	const backHref = prevItem
		? `/khoa-hoc/${slug}/${lessonSlug}/${prevItem.slug}`
		: `/khoa-hoc/${slug}/${lessonSlug}`;
	// Next: video kế → buổi kế → null (vô hiệu hóa)
	const nextHref = nextItem
		? `/khoa-hoc/${slug}/${lessonSlug}/${nextItem.slug}`
		: video?.next_lesson
			? `/khoa-hoc/${slug}/${video.next_lesson.slug}`
			: null;

	return (
		<div className='w-full min-h-screen pb-28 pt-20'>
			<div className='neo-container px-6'>
				{/* Back link → trang buổi học */}
				<Link
					to={`/khoa-hoc/${slug}/${lessonSlug}`}
					className='mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 transition hover:text-black'>
					<ArrowLeft className='h-4 w-4' />
					{video ? `Buổi ${video.lesson.order} · ${video.lesson.title}` : "Quay lại buổi học"}
				</Link>

				{loading ? (
					<VideoSkeleton />
				) : error || !video ? (
					<div className='rounded-2xl border-2 border-black bg-white px-6 py-16 text-center shadow-[4px_4px_0_#111]'>
						<p className='font-heading text-xl font-extrabold text-black'>Có lỗi xảy ra</p>
						<p className='mt-2 text-sm text-gray-600'>{error ?? "Không tải được video."}</p>
						<Link
							to={`/khoa-hoc/${slug}/${lessonSlug}`}
							className='mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Quay lại buổi học
						</Link>
					</div>
				) : (
					<div className='grid gap-8 lg:grid-cols-[1fr_300px]'>
						{/* ── Cột trái: player + thông tin ── */}
						<div>
							{/* Player */}
							<div className='overflow-hidden rounded-2xl border-2 border-black bg-black shadow-[4px_4px_0_#111]'>
								<div className='aspect-video w-full'>
									{isEmbed ? (
										<iframe
											key={embedSrc}
											src={embedSrc}
											title={video.title}
											className='h-full w-full'
											allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
											allowFullScreen
										/>
									) : (
										<video src={video.url} controls className='h-full w-full' />
									)}
								</div>
							</div>

							{/* Tiêu đề + meta */}
							<h1 className='mt-5 font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
								{video.title}
							</h1>
							<div className='mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-500'>
								<span className='inline-flex items-center gap-1.5'>
									<Clock className='h-4 w-4' />
									{video.duration}
								</span>
								<span className='inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-[var(--color-pastel-yellow)] px-2.5 py-0.5 text-xs font-extrabold text-black'>
									<Sparkles className='h-3.5 w-3.5' strokeWidth={2.5} />+{video.xp} XP
								</span>
							</div>

							{/* Chương trong video */}
							<div className='mt-8'>
								<h2 className='mb-3 flex items-center gap-2 font-heading text-lg font-extrabold text-black'>
									<ListVideo className='h-5 w-5' strokeWidth={2.5} />
									Chương trong video
								</h2>
								<div className='overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111] divide-y-2 divide-black'>
									{video.chapters.map((ch) => (
										<button
											key={ch.seconds}
											type='button'
											onClick={() => setStartAt(ch.seconds)}
											className={`flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-[var(--color-primary-100)] ${
												startAt === ch.seconds ? "bg-[var(--color-primary-100)]" : ""
											}`}>
											<span className='font-heading text-sm font-extrabold tabular-nums text-[var(--color-text-primary)]'>
												{ch.time}
											</span>
											<span className='flex-1 text-sm font-semibold text-black'>{ch.label}</span>
											<PlayCircle className='h-4 w-4 shrink-0 text-gray-400' />
										</button>
									))}
								</div>
							</div>

							{/* Tài liệu đính kèm */}
							<div className='mt-8'>
								<h2 className='mb-3 font-heading text-lg font-extrabold text-black'>
									Tài liệu đính kèm
								</h2>
								<div className='flex flex-wrap gap-3'>
									{video.attachments.map((att) => {
										const Icon = ATTACHMENT_ICON[att.kind];
										return (
											<button
												key={att.id}
												type='button'
												className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
												<Icon className='h-4 w-4' />
												{att.title}
											</button>
										);
									})}
								</div>
							</div>
						</div>

						{/* ── Cột phải: playlist + hỏi đáp ── */}
						<aside className='space-y-5 lg:sticky lg:top-24 lg:self-start'>
							{/* Playlist buổi học */}
							<div className='overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
								<div className='flex items-center justify-between border-b-2 border-black bg-[var(--color-pastel-blue)] px-4 py-3'>
									<span className='inline-flex items-center gap-2 font-heading text-sm font-extrabold text-black'>
										<ListVideo className='h-4 w-4' strokeWidth={2.5} />
										Trong buổi này
									</span>
									<span className='font-heading text-xs font-bold text-black'>
										{video.playlist.filter((p) => p.completed).length}/{video.playlist.length}
									</span>
								</div>
								<ul className='divide-y-2 divide-black'>
									{video.playlist.map((p) => (
										<li key={p.id}>
											<Link
												to={`/khoa-hoc/${slug}/${lessonSlug}/${p.slug}`}
												className={`flex items-center gap-3 px-4 py-3 transition ${
													p.current
														? "bg-[var(--color-primary-100)]"
														: "hover:bg-gray-50"
												}`}>
												{p.completed ? (
													<CircleCheck className='h-5 w-5 shrink-0 text-[var(--color-text-primary)]' />
												) : p.current ? (
													<PlayCircle className='h-5 w-5 shrink-0 text-black' />
												) : (
													<PlayCircle className='h-5 w-5 shrink-0 text-gray-300' />
												)}
												<span
													className={`flex-1 text-sm ${
														p.current ? "font-extrabold text-black" : "font-semibold text-black"
													}`}>
													{p.title}
												</span>
												<span className='shrink-0 text-xs font-medium text-gray-400'>
													{p.duration}
												</span>
											</Link>
										</li>
									))}
								</ul>
							</div>

							{/* Hỏi đáp → cộng đồng */}
							<div className='rounded-2xl border-2 border-black bg-[var(--color-pastel-purple)] p-5 shadow-[4px_4px_0_#111]'>
								<h3 className='font-heading text-base font-extrabold text-black'>
									Mắc kẹt ở đâu đó?
								</h3>
								<p className='mt-1 text-sm text-gray-600'>
									Đặt câu hỏi cho cộng đồng CLB về nội dung video này.
								</p>
								<Link
									to='/cong-dong'
									className='mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-white px-4 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
									<MessagesSquare className='h-4 w-4' strokeWidth={2.5} />
									Đặt câu hỏi
								</Link>
							</div>
						</aside>
					</div>
				)}
			</div>

			{/* ── Footer cố định: mục lục · hoàn thành · Back/Next ── */}
			{!loading && !error && video && (
				<div className='fixed inset-x-0 bottom-0 z-40 border-t-2 border-black bg-white'>
					<div className='neo-container grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:px-6'>
						{/* Trái: mục lục buổi + thông tin */}
						<div className='flex min-w-0 items-center gap-3'>
							<Link
								to={`/khoa-hoc/${slug}/${lessonSlug}`}
								aria-label='Nội dung buổi học'
								className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								<ListVideo className='h-5 w-5' strokeWidth={2.5} />
							</Link>
							<div className='hidden min-w-0 sm:block'>
								<p className='truncate font-heading text-sm font-extrabold text-black'>
									{video.title}
								</p>
								<p className='flex items-center gap-2 text-xs font-medium text-gray-500'>
									Video {curIdx + 1}/{playlist.length}
									<span className='rounded-full border-2 border-black bg-[var(--color-pastel-yellow)] px-2 py-0.5 text-[11px] font-extrabold text-black'>
										{video.xp} XP
									</span>
								</p>
							</div>
						</div>

						{/* Giữa: đánh dấu hoàn thành */}
						<button
							type='button'
							onClick={() => setCompleted((c) => !c)}
							className={`inline-flex items-center justify-center gap-2 justify-self-center rounded-xl border-2 border-black px-5 py-2.5 font-heading text-sm font-extrabold shadow-[4px_4px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
								completed
									? "bg-[var(--color-pastel-green)] text-black"
									: "bg-[var(--color-primary)] text-black"
							}`}>
							<Check className='h-4 w-4' strokeWidth={3} />
							<span className='hidden sm:inline'>
								{completed ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
							</span>
							<span className='sm:hidden'>{completed ? "Xong" : "Hoàn thành"}</span>
						</button>

						{/* Phải: Back / Next */}
						<div className='flex items-center justify-end gap-2'>
							<Link
								to={backHref}
								className='inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-4 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								<ArrowLeft className='h-4 w-4' />
								<span className='hidden sm:inline'>Trước</span>
							</Link>
							{nextHref ? (
								<Link
									to={nextHref}
									className='inline-flex items-center gap-1.5 rounded-xl border-2 border-black bg-white px-4 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
									<span className='hidden sm:inline'>Tiếp</span>
									<ArrowRight className='h-4 w-4' />
								</Link>
							) : (
								<span
									aria-disabled
									className='inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border-2 border-gray-300 bg-gray-100 px-4 py-2.5 font-heading text-sm font-extrabold text-gray-400'>
									<span className='hidden sm:inline'>Tiếp</span>
									<ArrowRight className='h-4 w-4' />
								</span>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default VideoDetailPage;
