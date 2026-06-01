import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, ChevronLeft, ImagePlus, Loader2, Send, X } from "lucide-react";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import StacksEditorWrapper, { type StacksEditorHandle } from "@/components/ui/StacksEditorWrapper";
import type { AuthUser } from "@/services/auth.service";
import { blogService } from "@/services/blog.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { BlogTag } from "@/types/blog.types";

const MAX_COVER_SIZE = 5 * 1024 * 1024;

const getErrorMessage = (error: unknown) => {
	const response = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;
	const firstFieldError = response?.errors ? Object.values(response.errors)[0]?.[0] : null;
	return firstFieldError || response?.message || "Không thể tạo blog. Vui lòng thử lại.";
};

const BlogCreatePage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useOutletContext<{ user: AuthUser | null }>();
	const editorRef = useRef<StacksEditorHandle>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);

	const [title, setTitle] = useState("");
	const [excerpt, setExcerpt] = useState("");
	const [tags, setTags] = useState<BlogTag[]>([]);
	const [tagsLoading, setTagsLoading] = useState(true);
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
	const [coverImage, setCoverImage] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const coverPreviewUrl = useMemo(() => {
		if (!coverImage) return null;
		return URL.createObjectURL(coverImage);
	}, [coverImage]);

	useEffect(() => {
		return () => {
			if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
		};
	}, [coverPreviewUrl]);

	useEffect(() => {
		setTagsLoading(true);
		blogService
			.getTags()
			.then((res) => setTags(res.data))
			.catch(() => setTags([]))
			.finally(() => setTagsLoading(false));
	}, []);

	const openCoverDialog = () => {
		if (!coverInputRef.current) return;
		coverInputRef.current.value = "";
		coverInputRef.current.click();
	};

	const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const nextFile = event.target.files?.[0] ?? null;
		if (!nextFile) {
			setCoverImage(null);
			return;
		}

		if (!nextFile.type.startsWith("image/")) {
			setCoverImage(null);
			toast.error("Ảnh bìa chỉ hỗ trợ tệp hình ảnh.");
			return;
		}

		if (nextFile.size > MAX_COVER_SIZE) {
			setCoverImage(null);
			toast.error("Ảnh bìa tối đa 5MB.");
			return;
		}

		setCoverImage(nextFile);
	};

	const toggleTag = (tagId: number) => {
		setSelectedTagIds((current) =>
			current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
		);
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (isSubmitting) return;

		if (!user) {
			navigate("/login", { state: { from: location.pathname + location.search } });
			return;
		}

		const content = editorRef.current?.getContent() ?? "";
		const hasContent = content.replace(/<[^>]*>/g, "").trim().length > 0;

		if (title.trim().length < 5) {
			setFormError("Tiêu đề blog cần tối thiểu 5 ký tự.");
			return;
		}

		if (!hasContent) {
			setFormError("Vui lòng nhập nội dung blog.");
			editorRef.current?.focus();
			return;
		}

		setIsSubmitting(true);
		setFormError(null);

		try {
			const response = await blogService.createBlog({
				title: title.trim(),
				excerpt: excerpt.trim() || undefined,
				content,
				tagIds: selectedTagIds,
				featuredImage: coverImage,
			});

			const isPendingReview = response.data.status === "pending_review";
			if (isPendingReview) {
				toast.success("Blog đã được gửi và đang chờ duyệt.", {
					description: "Ban quản trị sẽ xem xét và duyệt bài viết của bạn sớm nhất.",
					duration: 5000,
				});
				navigate("/blog");
			} else {
				toast.success("Đã tạo blog!");
				navigate(`/blog/${response.data.slug}`);
			}
		} catch (error) {
			setFormError(getErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='w-full min-h-screen pb-12 pt-16'>
			<main className='mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8'>
				<div className='mb-7 flex items-center gap-3'>
					<Link
						to='/blog'
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
						aria-label='Quay lại blog'>
						<ChevronLeft className='h-5 w-5' />
					</Link>
					<h1 className='font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
						Tạo blog
					</h1>
				</div>

				<form className='space-y-7' onSubmit={handleSubmit}>
					{formError && (
						<div className='flex items-start gap-3 rounded-[10px] border-2 border-black bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-[3px_3px_0_#111]'>
							<AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
							<span>{formError}</span>
						</div>
					)}

					<div>
						<label
							htmlFor='blog-title'
							className='mb-2 block font-heading text-base font-extrabold text-black'>
							Tiêu đề <span className='text-red-500'>*</span>
						</label>
						<input
							id='blog-title'
							type='text'
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							placeholder='Tiêu đề blog'
							className='h-[3.25rem] w-full rounded-[10px] border-2 border-black bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					<div>
						<label
							htmlFor='blog-excerpt'
							className='mb-2 block font-heading text-base font-extrabold text-black'>
							Tóm tắt
						</label>
						<textarea
							id='blog-excerpt'
							rows={3}
							value={excerpt}
							onChange={(event) => setExcerpt(event.target.value)}
							placeholder='Một đoạn mô tả ngắn hiển thị ngoài danh sách blog'
							maxLength={1000}
							className='w-full resize-none rounded-[10px] border-2 border-black bg-white px-4 py-3 text-sm font-medium leading-6 outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					<div>
						<label className='mb-3 block font-heading text-base font-extrabold text-black'>
							Tag
						</label>
						<div className='flex flex-wrap gap-2'>
							{tagsLoading ? (
								Array.from({ length: 6 }).map((_, i) => (
									<div
										key={i}
										className='h-7 w-20 animate-pulse rounded-full border-2 border-black bg-gray-200'
									/>
								))
							) : tags.length > 0 ? (
								tags.map((tag) => {
									const selected = selectedTagIds.includes(tag.id);
									return (
										<button
											key={tag.id}
											type='button'
											onClick={() => toggleTag(tag.id)}
											className={`rounded-full border-2 border-black px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
												selected
													? "bg-[var(--color-primary)] text-black"
													: "bg-white text-gray-700"
											}`}>
											{tag.name}
										</button>
									);
								})
							) : (
								<p className='text-sm font-semibold text-gray-500'>
									Chưa có tag khả dụng.
								</p>
							)}
						</div>
					</div>

					<div>
						<label className='mb-3 block font-heading text-base font-extrabold text-black'>
							Ảnh bìa
						</label>
						<input
							ref={coverInputRef}
							type='file'
							accept='image/*'
							className='sr-only'
							onChange={handleCoverChange}
						/>
						<div
							role='button'
							tabIndex={0}
							onClick={openCoverDialog}
							onKeyDown={(event) => {
								if (event.key !== "Enter" && event.key !== " ") return;
								event.preventDefault();
								openCoverDialog();
							}}
							aria-label='Tải ảnh bìa blog'
							className='flex min-h-52 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border-2 border-dashed border-black bg-white text-center transition hover:bg-gray-100 focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'>
							{coverPreviewUrl ? (
								<figure className='relative w-full'>
									<button
										type='button'
										onClick={(event) => {
											event.preventDefault();
											event.stopPropagation();
											setCoverImage(null);
											if (coverInputRef.current) coverInputRef.current.value = "";
										}}
										className='absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-red-100 hover:text-red-600 hover:shadow-none'
										aria-label='Xóa ảnh bìa đã chọn'>
										<X className='h-4 w-4' />
									</button>

									{/* Preview 1: Trang chi tiết */}
									<div className='border-b-2 border-black'>
										<p className='bg-gray-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
											Trang chi tiết
										</p>
										<div className='bg-gray-100'>
											<img
												src={coverPreviewUrl}
												alt={coverImage?.name ?? "Ảnh bìa blog"}
												className='max-h-[340px] w-full object-contain'
											/>
										</div>
									</div>

									{/* Preview 2: Card danh sách */}
									<div className='border-b-2 border-black'>
										<p className='bg-gray-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
											Card danh sách
										</p>
										<div className='bg-gray-100'>
											<img
												src={coverPreviewUrl}
												alt={coverImage?.name ?? "Ảnh bìa blog"}
												className='aspect-[21/9] w-full object-contain'
											/>
										</div>
									</div>

									<figcaption className='truncate bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700'>
										{coverImage?.name}
									</figcaption>
								</figure>
							) : (
								<div className='px-6 py-8'>
									<ImagePlus className='mx-auto h-9 w-9 text-gray-500' />
									<p className='mt-3 text-sm font-semibold text-gray-600'>
										Chọn ảnh bìa cho blog, tối đa 5MB.
									</p>
									<span className='mt-4 inline-flex h-9 items-center rounded-lg border-2 border-black bg-white px-4 font-heading text-sm font-extrabold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
										Tải ảnh bìa
									</span>
								</div>
							)}
						</div>
					</div>

					<div>
						<label
							htmlFor='blog-body'
							className='mb-3 block font-heading text-base font-extrabold text-black'>
							Nội dung <span className='text-red-500'>*</span>
						</label>
						<div className='overflow-hidden rounded-[10px] border-2 border-black bg-white'>
							<StacksEditorWrapper ref={editorRef} placeholder='Viết nội dung blog...' />
						</div>
					</div>

					<div className='flex items-center justify-end'>
						<button
							type='submit'
							disabled={isSubmitting}
							className='neo-btn neo-btn-primary h-11 px-6 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60'>
							{isSubmitting ? (
								<Loader2 className='h-4 w-4 animate-spin' />
							) : (
								<Send className='h-4 w-4' />
							)}
							{isSubmitting ? "Đang tạo..." : "Đăng blog"}
						</button>
					</div>
				</form>
			</main>
		</div>
	);
};

export default BlogCreatePage;
