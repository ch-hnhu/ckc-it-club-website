import React, { useEffect, useRef, useState } from "react";
import {
	ChevronLeft,
	Code2,
	Crown,
	Hash,
	Home,
	List,
	Monitor,
	Send,
	Trophy,
	UploadCloud,
	X,
} from "lucide-react";
import { Link } from "react-router-dom";
import NeoSelect from "@/components/ui/NeoSelect";
import StacksEditorWrapper, { type StacksEditorHandle } from "@/components/ui/StacksEditorWrapper";

const PRIMARY_NAV = [
	{ id: "home", label: "Trang chủ", icon: Home },
	{ id: "leaderboard", label: "Bảng xếp hạng", icon: Trophy },
	{ id: "showcase", label: "Showcase dự án", icon: Monitor },
	{ id: "challenge", label: "Thử thách tháng", icon: Crown },
	{ id: "code", label: "#30DaysOfCode", icon: Code2 },
];

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
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [mediaFile, setMediaFile] = useState<File | null>(null);
	const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
	const editorRef = useRef<StacksEditorHandle>(null);
	const mediaInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isSidebarOpen) return;

		const originalBodyOverflow = document.body.style.overflow;
		const originalHtmlOverflow = document.documentElement.style.overflow;
		document.body.style.overflow = "hidden";
		document.documentElement.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = originalBodyOverflow;
			document.documentElement.style.overflow = originalHtmlOverflow;
		};
	}, [isSidebarOpen]);

	useEffect(() => {
		const previews = mediaFile
			? [
					{
						id: `${mediaFile.name}-${mediaFile.size}-${mediaFile.lastModified}`,
						name: mediaFile.name,
						type: mediaFile.type,
						url: URL.createObjectURL(mediaFile),
					},
				]
			: [];

		setMediaPreviews(previews);

		return () => {
			previews.forEach((preview) => URL.revokeObjectURL(preview.url));
		};
	}, [mediaFile]);

	const renderSidebarContent = (isMobile = false) => (
		<div className={isMobile ? "px-4 py-4" : "px-3 py-4"}>
			<nav className='space-y-2'>
				{PRIMARY_NAV.map((item) => {
					const Icon = item.icon;

					return (
						<Link
							key={item.id}
							to='/cong-dong'
							onClick={() => setIsSidebarOpen(false)}
							className={`group relative flex w-full items-center text-left font-bold ${
								isMobile
									? "gap-3 rounded-xl px-3 py-3 text-base"
									: "gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px]"
							} border-2 border-transparent bg-white text-gray-700 hover:bg-gray-100`}>
							<Icon
								className={`transition-colors duration-200 ${
									isMobile ? "h-5 w-5" : "h-4 w-4"
								} text-gray-700`}
							/>
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div
				className={`font-bold uppercase tracking-[0.2em] text-gray-500 ${
					isMobile ? "mt-6 px-1 text-xs" : "mt-7 px-3 text-[11px]"
				}`}>
				Kênh
			</div>
			<nav className='mt-3 space-y-2'>
				{CHANNELS.map((channel) => {
					const isActive = selectedChannel === channel.id;

					return (
						<button
							key={channel.id}
							type='button'
							onClick={() => {
								setSelectedChannel(channel.id);
								setIsSidebarOpen(false);
							}}
							className={`group relative flex w-full items-center justify-between text-left font-bold ${
								isMobile
									? "rounded-xl px-3 py-2.5 text-base"
									: "rounded-lg px-2.5 py-2 text-[13px]"
							} ${
								isActive
									? "bg-primary-100 border-2 border-[var(--color-primary-dark)] text-[var(--color-text-primary)]"
									: "border-2 border-transparent bg-white text-black hover:bg-gray-100"
							}`}>
							<span className='flex items-center gap-3'>
								<Hash
									className={`transition-colors duration-200 ${
										isMobile ? "h-5 w-5" : "h-3.5 w-3.5"
									} ${
										isActive
											? "text-[var(--color-text-primary)]"
											: "text-gray-500"
									}`}
								/>
								{channel.label}
							</span>
							<span
								className={`transition-colors duration-200 ${
									isMobile ? "text-sm" : "text-xs"
								} ${
									isActive ? "text-[var(--color-text-primary)]" : "text-gray-500"
								}`}>
								{channel.count}
							</span>
						</button>
					);
				})}
			</nav>
		</div>
	);

	const openMediaDialog = () => {
		if (!mediaInputRef.current) return;
		mediaInputRef.current.value = "";
		mediaInputRef.current.click();
	};

	const handleMediaFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setMediaFile(event.target.files?.[0] ?? null);
	};

	return (
		<div className='min-h-screen bg-[var(--color-surface)] pt-16 text-black'>
			<div className='community-shell'>
				<aside className='hidden border-r-2 border-black bg-white md:block'>
					<div className='no-scrollbar sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto'>
						{renderSidebarContent()}
					</div>
				</aside>

				<main className='min-w-0 px-4 pb-10 md:px-8 lg:px-12'>
					<div className='sticky top-16 z-30 -mx-3 mb-3 flex h-14 items-center gap-2 border-b border-gray-200 bg-[var(--color-surface)] px-3 md:hidden'>
						<button
							type='button'
							onClick={() => setIsSidebarOpen(true)}
							className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-black transition hover:bg-gray-100'
							aria-label='Mở menu cộng đồng'>
							<List className='h-5 w-5' />
						</button>
						<img
							src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/it_club_ckc.jpg'
							alt='CKC IT CLUB'
							className='h-6 w-6 shrink-0 rounded-full border-2 border-black object-cover'
						/>
						<h1 className='min-w-0 truncate font-heading text-sm font-bold text-black'>
							Đăng bài viết
						</h1>
					</div>

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
														className='min-w-0 overflow-hidden rounded-[10px] border-2 border-black bg-[var(--color-surface)] text-left shadow-[2px_2px_0_#111]'>
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
			</div>

			{isSidebarOpen && (
				<div className='fixed inset-x-0 bottom-0 top-16 z-50 md:hidden'>
					<button
						type='button'
						className='absolute inset-0 h-full w-full bg-black/55'
						onClick={() => setIsSidebarOpen(false)}
						aria-label='Đóng menu cộng đồng'
					/>
					<aside className='no-scrollbar relative h-full w-[min(70vw,20rem)] overflow-y-auto border-r-2 border-black bg-white shadow-[6px_0_0_#111]'>
						<div className='sticky top-0 z-10 flex h-14 items-center justify-between border-b-2 border-black bg-white px-4'>
							<h2 className='font-heading text-lg font-extrabold text-black'>
								Cộng đồng
							</h2>
							<button
								type='button'
								onClick={() => setIsSidebarOpen(false)}
								className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-transparent text-black transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-gray-100'
								aria-label='Đóng menu cộng đồng'>
								<X className='h-4 w-4' />
							</button>
						</div>
						{renderSidebarContent(true)}
					</aside>
				</div>
			)}
		</div>
	);
};

export default CommunityCreatePage;
