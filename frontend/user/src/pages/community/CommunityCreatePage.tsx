import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Send, UploadCloud, X } from "lucide-react";
import { Link } from "react-router-dom";
import NeoSelect from "@/components/ui/NeoSelect";
import StacksEditorWrapper, { type StacksEditorHandle } from "@/components/ui/StacksEditorWrapper";

const CHANNELS = [
	{ id: "general", label: "Chung", count: 128 },
	{ id: "discussion", label: "Thảo luận", count: 42 },
	{ id: "qa", label: "Hỏi đáp", count: 35 },
	{ id: "project", label: "Dự án", count: 18 },
	{ id: "resources", label: "Tài nguyên", count: 23 },
	{ id: "events", label: "Sự kiện", count: 10 },
	{ id: "career", label: "Cơ hội nghề nghiệp", count: 12 },
	{ id: "bugs", label: "Báo lỗi", count: 7 },
];

interface MediaPreview {
	id: string;
	name: string;
	type: string;
	url: string;
}

const CommunityCreatePage: React.FC = () => {
	const [selectedChannel, setSelectedChannel] = useState("general");
	const [title, setTitle] = useState("");
	const [mediaFile, setMediaFile] = useState<File | null>(null);
	const editorRef = useRef<StacksEditorHandle>(null);
	const mediaInputRef = useRef<HTMLInputElement>(null);

	const mediaPreviews = useMemo<MediaPreview[]>(() => {
		if (!mediaFile) return [];
		return [
			{
				id: `${mediaFile.name}-${mediaFile.size}-${mediaFile.lastModified}`,
				name: mediaFile.name,
				type: mediaFile.type,
				url: URL.createObjectURL(mediaFile),
			},
		];
	}, [mediaFile]);

	useEffect(() => {
		return () => {
			mediaPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
		};
	}, [mediaPreviews]);

	const openMediaDialog = () => {
		if (!mediaInputRef.current) return;
		mediaInputRef.current.value = "";
		mediaInputRef.current.click();
	};

	const handleMediaFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setMediaFile(event.target.files?.[0] ?? null);
	};

	const clearMediaFile = () => {
		setMediaFile(null);
		if (mediaInputRef.current) mediaInputRef.current.value = "";
	};

	const handleClearMediaClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		clearMediaFile();
	};

	return (
		<main className='min-w-0 px-4 pb-10 text-black md:px-8 lg:px-12'>
			<div className='mx-auto w-full max-w-[52rem] py-5 md:py-8'>
				<div className='mb-7 flex items-center gap-3'>
					<Link
						to='/cong-dong'
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
						aria-label='Quay lại cộng đồng'>
						<ChevronLeft className='h-5 w-5' />
					</Link>
					<h1 className='font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
						Đăng bài viết
					</h1>
				</div>

						<form
							className='space-y-7'
							onSubmit={(event) => {
								event.preventDefault();
								const content = editorRef.current?.getContent() ?? "";
								console.log({
									channel: selectedChannel,
									title,
									content,
									mediaFile,
								});
							}}>
							<div className='max-w-xs'>
								<label
									htmlFor='post-channel'
									className='mb-2 block font-heading text-base font-extrabold text-black'>
									Đăng vào kênh <span className='text-red-500'>*</span>
								</label>
								<NeoSelect
									id='post-channel'
									options={CHANNELS.map((ch) => ({
										value: ch.id,
										label: ch.label,
									}))}
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
								<p className='mb-3 max-w-3xl text-sm font-semibold leading-6 text-gray-600'>
									Viết một tiêu đề ngắn gọn để mọi người hiểu nhanh nội dung bài
									viết.
								</p>
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
															onClick={handleClearMediaClick}
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
															{preview.name}
														</figcaption>
													</figure>
												))}
											</div>
											<p className='text-sm font-semibold text-gray-600'>
												1 tệp đã chọn
											</p>
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
										{mediaPreviews.length > 0 ? "Tải ảnh lên" : "Tải lên"}
									</span>
								</div>
							</div>

							<div className='flex items-center justify-end'>
								<button
									type='submit'
									className='neo-btn neo-btn-primary h-11 px-6 py-0 text-sm'>
									<Send className='h-4 w-4' />
									Đăng
								</button>
							</div>
						</form>
			</div>
		</main>
	);
};

export default CommunityCreatePage;
