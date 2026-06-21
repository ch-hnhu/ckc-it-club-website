import React, { useEffect, useMemo, useState } from "react";
import {
	ArrowLeft,
	ArrowRight,
	Check,
	FileText,
	ListVideo,
	Radio,
	Video as VideoIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { learningService } from "@/services/learning.service";
import { renderMarkdownContent } from "@/lib/markdown";
import type { VideoDetail } from "@/types/learning.types";

type VideoTabKey = "lecture" | "live";

interface VideoTab {
	key: VideoTabKey;
	label: string;
	url: string;
	icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const isEmbedUrl = (url: string) => url.includes("youtube") || url.includes("/embed");

// ─── Skeleton ───────────────────────────────────────────────────────────────────

const VideoSkeleton: React.FC = () => (
	<div className='grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
		<div className='border-b-2 border-black p-6 lg:border-r-2 lg:border-b-0'>
			<div className='h-[460px] animate-pulse rounded-2xl border-2 border-black bg-gray-200' />
		</div>
		<div className='bg-[#f5f7fb] p-6'>
			<div className='aspect-video animate-pulse rounded-2xl border-2 border-black bg-gray-200' />
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
	const [activeTab, setActiveTab] = useState<VideoTabKey>("lecture");

	useEffect(() => {
		if (!slug || !lessonSlug || !videoSlug) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		learningService
			.getVideo(slug, lessonSlug, videoSlug)
			.then((res) => {
				if (cancelled) return;
				setVideo(res.data);
				setCompleted(res.data.completed);
				// Ưu tiên video bài giảng; nếu chưa có thì mở bản ghi livestream
				setActiveTab(res.data.lecture_url ? "lecture" : "live");
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

	// Các nguồn video khả dụng (bài giảng ưu tiên trước, rồi livestream)
	const tabs = useMemo<VideoTab[]>(() => {
		if (!video) return [];
		const list: VideoTab[] = [];
		if (video.lecture_url) {
			list.push({ key: "lecture", label: "Video bài giảng", url: video.lecture_url, icon: VideoIcon });
		}
		if (video.live_url) {
			list.push({ key: "live", label: "Video bản ghi livestream", url: video.live_url, icon: Radio });
		}
		return list;
	}, [video]);

	const activeUrl = tabs.find((t) => t.key === activeTab)?.url ?? tabs[0]?.url ?? "";
	// Chỉ hiện thanh tab khi có cả 2 nguồn (không có bản ghi livestream → ẩn tab)
	const showTabs = tabs.length > 1;

	const backHref = `/khoa-hoc/${slug}/${lessonSlug}`;
	const prevHref = video?.prev_lesson
		? `/khoa-hoc/${slug}/${video.prev_lesson.slug}/video`
		: backHref;
	const nextHref = video?.next_lesson
		? `/khoa-hoc/${slug}/${video.next_lesson.slug}/video`
		: null;

	return (
		<div className='flex min-h-screen w-full flex-col bg-white pt-16 pb-28 lg:h-screen lg:overflow-hidden lg:pb-[74px]'>
			{loading ? (
				<VideoSkeleton />
			) : error || !video ? (
				<div className='flex flex-1 items-center justify-center px-6 py-16'>
					<div className='w-full max-w-xl rounded-2xl border-2 border-black bg-white px-6 py-16 text-center shadow-[4px_4px_0_#111]'>
						<p className='font-heading text-xl font-extrabold text-black'>Có lỗi xảy ra</p>
						<p className='mt-2 text-sm text-gray-600'>{error ?? "Không tải được video."}</p>
						<Link
							to={backHref}
							className='mt-5 inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Quay lại buổi học
						</Link>
					</div>
				</div>
			) : (
				<div className='grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
					{/* Khối trái: tài liệu bài học */}
					<section className='border-b-2 border-black bg-white px-4 py-5 md:px-6 lg:min-h-0 lg:overflow-y-auto lg:border-r-2 lg:border-b-0'>
						<div className='w-full'>
							<h2 className='mb-3 flex items-center gap-2 font-heading text-lg font-extrabold text-black'>
								<FileText className='h-5 w-5' strokeWidth={2.5} />
								Tài liệu buổi học
							</h2>
							{video.document ? (
								<div className='so-editor-outer community-markdown'>
									<div
										className='s-prose'
										dangerouslySetInnerHTML={{
											__html: renderMarkdownContent(video.document),
										}}
									/>
								</div>
							) : (
								<div className='rounded-2xl border-2 border-black bg-white py-12 text-center shadow-[4px_4px_0_#111]'>
									<FileText className='mx-auto h-9 w-9 text-gray-300' />
									<p className='mt-3 text-sm font-medium text-gray-500'>
										Buổi học này chưa có tài liệu.
									</p>
								</div>
							)}
						</div>
					</section>

					{/* Khối phải: video và thao tác học */}
					<section className='bg-[#f5f7fb] px-4 py-5 md:px-6 lg:min-h-0 lg:overflow-y-auto'>
						<div className='w-full'>
							<h2 className='mb-3 flex items-center gap-2 font-heading text-lg font-extrabold text-black'>
								<VideoIcon className='h-5 w-5' strokeWidth={2.5} />
								Video buổi học
							</h2>

							{/* Tabs nguồn video — chỉ hiện khi có cả bài giảng & livestream */}
							{showTabs && (
								<div className='mb-3 flex flex-wrap gap-2'>
									{tabs.map((tab) => {
										const Icon = tab.icon;
										const active = tab.key === activeTab;
										return (
											<button
												key={tab.key}
												type='button'
												onClick={() => setActiveTab(tab.key)}
												className={`inline-flex items-center gap-2 rounded-xl border-2 border-black px-4 py-2 font-heading text-sm font-extrabold transition ${
													active
														? "bg-[var(--color-primary)] text-black shadow-[3px_3px_0_#111]"
														: "bg-white text-gray-600 hover:bg-gray-50 shadow-none"
												}`}>
												<Icon className='h-4 w-4' strokeWidth={2.5} />
												{tab.label}
											</button>
										);
									})}
								</div>
							)}

							{/* Player */}
							<div className='overflow-hidden rounded-2xl border-2 border-black bg-black shadow-[4px_4px_0_#111]'>
								<div className='aspect-video w-full'>
									{isEmbedUrl(activeUrl) ? (
										<iframe
											key={activeUrl}
											src={activeUrl}
											title={video.title}
											className='h-full w-full'
											allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
											allowFullScreen
										/>
									) : (
										<video key={activeUrl} src={activeUrl} controls className='h-full w-full' />
									)}
								</div>
							</div>

							{/* Tiêu đề */}
							<h1 className='mt-5 font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
								{video.title}
							</h1>

						</div>
					</section>
				</div>
			)}

			{/* ── Footer cố định: hoàn thành · Trước/Tiếp ── */}
			{!loading && !error && video && (
				<div className='fixed inset-x-0 bottom-0 z-40 border-t-2 border-black bg-white'>
					<div className='neo-container mx-0 grid max-w-none grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-6 lg:px-8'>
						{/* Trái: về buổi học */}
						<div className='flex min-w-0 items-center gap-3'>
							<Link
								to={backHref}
								aria-label='Nội dung buổi học'
								className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								<ListVideo className='h-5 w-5' strokeWidth={2.5} />
							</Link>
							<p className='hidden min-w-0 truncate font-heading text-sm font-extrabold text-black sm:block'>
								{video.lesson.title}
							</p>
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

						{/* Phải: Trước / Tiếp (theo buổi học) */}
						<div className='flex items-center justify-end gap-2'>
							<Link
								to={prevHref}
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
