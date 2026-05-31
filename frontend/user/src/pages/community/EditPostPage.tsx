import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ChevronLeft, Loader2, Save, UploadCloud, X } from "lucide-react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import NeoSelect from "@/components/ui/NeoSelect";
import StacksEditorWrapper, { type StacksEditorHandle } from "@/components/ui/StacksEditorWrapper";
import { postService } from "@/services/post.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { CommunityLayoutContext } from "./CommunityLayout";

interface MediaPreview {
	id: string;
	name: string;
	type: string;
	url: string;
	isExisting?: boolean;
}

const MAX_MEDIA_SIZE = 20 * 1024 * 1024;

const getErrorMessage = (error: unknown) => {
	const response = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;
	const firstFieldError = response?.errors ? Object.values(response.errors)[0]?.[0] : null;
	return firstFieldError || response?.message || "Không thể lưu bài viết. Vui lòng thử lại.";
};

const EditPostPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user, channels } = useOutletContext<CommunityLayoutContext>();

	const channelOptions = useMemo(
		() =>
			channels
				.filter((channel) => channel.slug !== "chung")
				.map((channel) => ({
					value: channel.slug,
					label: channel.label,
				})),
		[channels],
	);

	const [loadingPost, setLoadingPost] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [selectedChannel, setSelectedChannel] = useState("");
	const [title, setTitle] = useState("");
	const [mediaFile, setMediaFile] = useState<File | null>(null);
	const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
	const [keepExistingMedia, setKeepExistingMedia] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const editorRef = useRef<StacksEditorHandle>(null);
	const mediaInputRef = useRef<HTMLInputElement>(null);

	// Track whether the editor is ready to set initial content
	const [initialContent, setInitialContent] = useState<string | null>(null);

	useEffect(() => {
		if (!id) return;
		let cancelled = false;
		setLoadingPost(true);
		setLoadError(false);

		postService
			.getPost(Number(id))
			.then((res) => {
				if (cancelled) return;
				const post = res.data;

				// Check ownership
				if (user && post.user?.id && Number(user.id) !== post.user.id) {
					navigate("/cong-dong");
					return;
				}

				setTitle(post.title);
				setInitialContent(post.content ?? "");
				setExistingMediaUrl(post.featured_image ?? null);
				if (post.channel) {
					setSelectedChannel(post.channel.slug);
				}
			})
			.catch(() => {
				if (!cancelled) setLoadError(true);
			})
			.finally(() => {
				if (!cancelled) setLoadingPost(false);
			});

		return () => {
			cancelled = true;
		};
	}, [id, user, navigate]);

	const mediaPreviews = useMemo<MediaPreview[]>(() => {
		if (mediaFile) {
			return [
				{
					id: `${mediaFile.name}-${mediaFile.size}`,
					name: mediaFile.name,
					type: mediaFile.type,
					url: URL.createObjectURL(mediaFile),
				},
			];
		}
		if (keepExistingMedia && existingMediaUrl) {
			const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(existingMediaUrl);
			return [
				{
					id: "existing",
					name: "Media hiện tại",
					type: isVideo ? "video/mp4" : "image/jpeg",
					url: existingMediaUrl,
					isExisting: true,
				},
			];
		}
		return [];
	}, [mediaFile, existingMediaUrl, keepExistingMedia]);

	useEffect(() => {
		return () => {
			mediaPreviews
				.filter((p) => !p.isExisting)
				.forEach((p) => URL.revokeObjectURL(p.url));
		};
	}, [mediaPreviews]);

	const openMediaDialog = () => {
		if (!mediaInputRef.current) return;
		mediaInputRef.current.value = "";
		mediaInputRef.current.click();
	};

	const handleMediaFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const nextFile = event.target.files?.[0] ?? null;
		if (!nextFile) return;
		if (nextFile.size > MAX_MEDIA_SIZE) {
			toast.error("Tệp tải lên tối đa 20MB.");
			return;
		}
		setMediaFile(nextFile);
		setKeepExistingMedia(false);
	};

	const clearMedia = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setMediaFile(null);
		setKeepExistingMedia(false);
		if (mediaInputRef.current) mediaInputRef.current.value = "";
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isSubmitting || !id) return;

		const content = editorRef.current?.getContent() ?? "";
		const hasContent = content.replace(/<[^>]*>/g, "").trim().length > 0;

		if (!selectedChannel) {
			setFormError("Vui lòng chọn kênh đăng bài.");
			return;
		}
		if (title.trim().length < 5) {
			setFormError("Tiêu đề cần tối thiểu 5 ký tự.");
			return;
		}
		if (!hasContent) {
			setFormError("Vui lòng nhập nội dung bài viết.");
			editorRef.current?.focus();
			return;
		}

		setIsSubmitting(true);
		setFormError(null);

		try {
			await postService.updatePost(Number(id), {
				channelSlug: selectedChannel,
				title: title.trim(),
				content,
				...(mediaFile ? { media: mediaFile } : {}),
			});
			toast.success("Đã lưu bài viết!");
			navigate(`/cong-dong/bai-viet/${id}`);
		} catch (error) {
			setFormError(getErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loadingPost) {
		return (
			<main className='min-w-0 px-4 pb-10 text-black md:px-8 lg:px-12'>
				<div className='mx-auto w-full max-w-[52rem] py-5 md:py-8'>
					<div className='animate-pulse space-y-6'>
						<div className='h-9 w-48 rounded bg-gray-200' />
						<div className='h-12 w-full rounded bg-gray-200' />
						<div className='h-64 w-full rounded bg-gray-200' />
					</div>
				</div>
			</main>
		);
	}

	if (loadError) {
		return (
			<main className='min-w-0 px-4 pb-10 text-black md:px-8 lg:px-12'>
				<div className='mx-auto w-full max-w-[52rem] py-5 md:py-8'>
					<p className='text-sm font-bold text-red-600'>Không thể tải bài viết. Vui lòng thử lại.</p>
					<Link to='/cong-dong' className='mt-4 inline-block text-sm font-bold underline'>
						Quay lại cộng đồng
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className='min-w-0 px-4 pb-10 text-black md:px-8 lg:px-12'>
			<div className='mx-auto w-full max-w-[52rem] py-5 md:py-8'>
				<div className='mb-7 flex items-center gap-3'>
					<button
						type='button'
						onClick={() => navigate(-1)}
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
						aria-label='Quay lại'>
						<ChevronLeft className='h-5 w-5' />
					</button>
					<h1 className='font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
						Chỉnh sửa bài viết
					</h1>
				</div>

				<form className='space-y-7' onSubmit={handleSubmit}>
					{formError && (
						<div className='flex items-start gap-3 rounded-[10px] border-2 border-black bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-[3px_3px_0_#111]'>
							<AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
							<span>{formError}</span>
						</div>
					)}

					<div className='max-w-xs'>
						<label
							htmlFor='post-channel'
							className='mb-2 block font-heading text-base font-extrabold text-black'>
							Kênh <span className='text-red-500'>*</span>
						</label>
						<NeoSelect
							id='post-channel'
							options={channelOptions}
							value={selectedChannel}
							onChange={setSelectedChannel}
						/>
					</div>

					<div>
						<label
							htmlFor='post-title'
							className='mb-2 block font-heading text-base font-extrabold text-black'>
							Tiêu đề <span className='text-red-500'>*</span>
						</label>
						<input
							id='post-title'
							type='text'
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder='Tiêu đề bài viết'
							className='h-[3.25rem] w-full rounded-[10px] border-2 border-black bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
							style={{ fontFamily: "var(--font-body)" }}
						/>
					</div>

					<div>
						<label
							htmlFor='post-body'
							className='mb-3 block font-heading text-base font-extrabold text-black'>
							Nội dung <span className='text-red-500'>*</span>
						</label>
						<div className='overflow-hidden rounded-[10px] border-2 border-black bg-white'>
							<StacksEditorWrapper
								ref={editorRef}
								placeholder='Bạn đang nghĩ gì?'
								initialContent={initialContent ?? undefined}
							/>
						</div>
					</div>

					<div>
						<label className='mb-3 block font-heading text-base font-extrabold text-black'>
							Hình ảnh hoặc video
						</label>
						<input
							ref={mediaInputRef}
							type='file'
							accept='image/*,video/*'
							className='sr-only'
							onChange={handleMediaFilesChange}
						/>
						<div
							role='button'
							tabIndex={0}
							onClick={openMediaDialog}
							onKeyDown={(event) => {
								if (event.key !== "Enter" && event.key !== " ") return;
								event.preventDefault();
								openMediaDialog();
							}}
							aria-label='Tải hình ảnh hoặc video'
							className='flex min-h-44 w-full cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-black bg-white px-6 py-8 text-center transition hover:bg-gray-100 focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'>
							{mediaPreviews.length > 0 ? (
								<div className='w-full space-y-4'>
									<div className='mx-auto grid w-full max-w-2xl grid-cols-1 gap-3'>
										{mediaPreviews.map((preview) => (
											<figure
												key={preview.id}
												className='relative min-w-0 overflow-hidden rounded-[10px] border-2 border-black bg-[var(--color-surface)] text-left shadow-[2px_2px_0_#111]'>
												<button
													type='button'
													onClick={clearMedia}
													className='absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-red-100 hover:text-red-600 hover:shadow-none'
													aria-label='Xoá ảnh đã chọn'>
													<X className='h-4 w-4' />
												</button>
												<div className='aspect-video w-full bg-white'>
													{preview.type.startsWith("video/") ? (
														<video
															src={preview.url}
															className='h-full w-full object-cover'
															muted
															playsInline
															preload='metadata'
														/>
													) : (
														<img
															src={preview.url}
															alt={preview.name}
															className='h-full w-full object-cover'
														/>
													)}
												</div>
												<figcaption className='truncate border-t-2 border-black px-3 py-2 text-xs font-bold text-gray-700'>
													{preview.isExisting ? "Ảnh hiện tại" : preview.name}
												</figcaption>
											</figure>
										))}
									</div>
									<p className='text-sm font-semibold text-gray-600'>1 tệp đã chọn</p>
								</div>
							) : (
								<>
									<UploadCloud className='h-8 w-8 text-gray-500' />
									<span className='mt-3 text-sm font-semibold text-gray-600'>
										Kéo và thả hoặc
									</span>
								</>
							)}
							<span className='mt-3 inline-flex h-9 items-center rounded-lg border-2 border-black bg-white px-4 font-heading text-sm font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								{mediaPreviews.length > 0 ? "Thay ảnh" : "Tải lên"}
							</span>
						</div>
					</div>

					<div className='flex items-center justify-end'>
						<button
							type='submit'
							disabled={isSubmitting || channelOptions.length === 0}
							className='neo-btn neo-btn-primary h-11 px-6 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60'>
							{isSubmitting ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								<Save className='h-4 w-4' />
							)}
							{isSubmitting ? "Đang lưu..." : "Lưu bài viết"}
						</button>
					</div>
				</form>
			</div>
		</main>
	);
};

export default EditPostPage;
