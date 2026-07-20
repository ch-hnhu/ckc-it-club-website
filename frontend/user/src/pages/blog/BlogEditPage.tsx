import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
	AlertCircle,
	ChevronLeft,
	ImagePlus,
	Loader2,
	Save,
	Send,
	X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import StacksEditorWrapper, { type StacksEditorHandle } from "@/components/ui/StacksEditorWrapper";
import type { AuthUser } from "@/services/auth.service";
import { blogService } from "@/services/blog.service";
import { buildProfileUrl } from "@/lib/utils";
import type { ApiErrorResponse } from "@/types/api.types";
import type { BlogDetail, BlogTag } from "@/types/blog.types";

const MAX_COVER_SIZE = 5 * 1024 * 1024;

const getErrorMessage = (error: unknown) => {
	const response = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;
	const firstFieldError = response?.errors ? Object.values(response.errors)[0]?.[0] : null;
	return firstFieldError || response?.message || "Không thể cập nhật blog. Vui lòng thử lại.";
};

const BlogEditPage: React.FC = () => {
	const { slug } = useParams<{ slug: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useOutletContext<{ user: AuthUser | null }>();
	const editorRef = useRef<StacksEditorHandle>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);

	const [loadingBlog, setLoadingBlog] = useState(true);
	const [blog, setBlog] = useState<BlogDetail | null>(null);
	const [notFound, setNotFound] = useState(false);

	const [title, setTitle] = useState("");
	const [excerpt, setExcerpt] = useState("");
	const [allTags, setAllTags] = useState<BlogTag[]>([]);
	const [tagsLoading, setTagsLoading] = useState(true);
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
	const [coverImage, setCoverImage] = useState<File | null>(null);
	const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSavingDraft, setIsSavingDraft] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [contentDirty, setContentDirty] = useState(false);
	const [initialSnapshot, setInitialSnapshot] = useState<{
		title: string;
		excerpt: string;
		tagIds: number[];
		coverUrl: string | null;
	} | null>(null);

	const coverPreviewUrl = useMemo(() => {
		if (!coverImage) return null;
		return URL.createObjectURL(coverImage);
	}, [coverImage]);

	useEffect(() => {
		return () => {
			if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
		};
	}, [coverPreviewUrl]);

	// Load blog data
	useEffect(() => {
		if (!slug) return;
		blogService
			.getBlog(slug)
			.then((res) => {
				const data = res.data;
				setBlog(data);
				setTitle(data.title ?? "");
				setExcerpt(data.excerpt ?? "");
				setSelectedTagIds(data.tags.map((t) => t.id));
				setExistingCoverUrl(data.featured_image ?? null);
				setInitialSnapshot({
					title: data.title ?? "",
					excerpt: data.excerpt ?? "",
					tagIds: data.tags.map((t) => t.id),
					coverUrl: data.featured_image ?? null,
				});
			})
			.catch(() => setNotFound(true))
			.finally(() => setLoadingBlog(false));
	}, [slug]);

	// Load tags
	useEffect(() => {
		setTagsLoading(true);
		blogService
			.getTags()
			.then((res) => setAllTags(res.data))
			.catch(() => setAllTags([]))
			.finally(() => setTagsLoading(false));
	}, []);

	const openCoverDialog = () => {
		if (!coverInputRef.current) return;
		coverInputRef.current.value = "";
		coverInputRef.current.click();
	};

	const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const nextFile = event.target.files?.[0] ?? null;
		if (!nextFile) { setCoverImage(null); return; }
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
		setExistingCoverUrl(null);
	};

	const toggleTag = (tagId: number) => {
		setSelectedTagIds((current) =>
			current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
		);
	};

	const validateForm = () => {
		if (title.trim().length < 5) {
			setFormError("Tiêu đề blog cần tối thiểu 5 ký tự.");
			return null;
		}
		const content = editorRef.current?.getContent() ?? "";
		if (!content.replace(/<[^>]*>/g, "").trim().length) {
			setFormError("Vui lòng nhập nội dung blog.");
			editorRef.current?.focus();
			return null;
		}
		setFormError(null);
		return content;
	};

	const isDraft = blog?.status === "draft";

	// So sánh form hiện tại với bản nháp đã lưu để biết có thay đổi chưa lưu.
	const fieldsDirty = initialSnapshot
		? title.trim() !== initialSnapshot.title.trim() ||
			excerpt.trim() !== initialSnapshot.excerpt.trim() ||
			JSON.stringify([...selectedTagIds].sort((a, b) => a - b)) !==
				JSON.stringify([...initialSnapshot.tagIds].sort((a, b) => a - b)) ||
			coverImage !== null ||
			existingCoverUrl !== initialSnapshot.coverUrl
		: false;
	const isDirty = fieldsDirty || contentDirty;

	const submitUpdate = async (status?: "draft" | "pending_review") => {
		if (isSubmitting || isSavingDraft || !slug) return;
		if (!user) {
			navigate("/login", { state: { from: location.pathname } });
			return;
		}

		const content = validateForm();
		if (content === null) return;

		const setBusy = status === "draft" ? setIsSavingDraft : setIsSubmitting;
		setBusy(true);
		try {
			const response = await blogService.updateBlog(slug, {
				title: title.trim(),
				excerpt: excerpt.trim() || undefined,
				content,
				tagIds: selectedTagIds,
				featuredImage: coverImage ?? undefined,
				...(status ? { status } : {}),
			});

			const newStatus = response.data.status;
			if (newStatus === "draft") {
				toast.success("Đã lưu nháp!", {
					description: "Bạn có thể xem lại ở mục Nháp trong trang cá nhân.",
				});
				navigate(`${buildProfileUrl(user.username, user.email)}?tab=drafts`);
			} else if (newStatus === "pending_review") {
				toast.success("Blog đã được gửi và đang chờ duyệt.", {
					description: "Ban quản trị sẽ xem xét và duyệt bài viết của bạn sớm nhất.",
					duration: 5000,
				});
				navigate("/blog");
			} else {
				toast.success("Đã lưu bài viết!");
				navigate(`/blog/${response.data.slug ?? slug}`);
			}
		} catch (error) {
			setFormError(getErrorMessage(error));
		} finally {
			setBusy(false);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		// Với bài nháp: nút submit là "Đăng" (gửi duyệt); bài khác giữ hành vi lưu như cũ
		await submitUpdate(isDraft ? "pending_review" : undefined);
	};

	if (loadingBlog) {
		return (
			<div className='w-full min-h-screen pt-16 flex items-center justify-center'>
				<Loader2 className='h-8 w-8 animate-spin text-gray-400' />
			</div>
		);
	}

	if (notFound || !blog) {
		return (
			<div className='w-full min-h-screen pt-16 flex flex-col items-center justify-center gap-4'>
				<p className='font-heading text-xl font-extrabold text-black'>Không tìm thấy blog</p>
				<Link to='/blog' className='neo-btn neo-btn-secondary text-sm px-5 py-2'>
					Quay lại blog
				</Link>
			</div>
		);
	}

	const displayCover = coverPreviewUrl ?? existingCoverUrl;

	return (
		<div className='w-full min-h-screen pb-12 pt-16'>
			<main className='mx-auto w-full max-w-4xl px-4 py-6 md:px-6 md:py-8'>
				<div className='mb-7 flex items-center gap-3'>
					<button
						type='button'
						onClick={() => navigate(-1)}
						className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'
						aria-label='Quay lại'>
						<ChevronLeft className='h-5 w-5' />
					</button>
					<h1 className='font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl'>
						Chỉnh sửa blog
					</h1>
					{blog.status === "pending_review" && (
						<span className='inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700'>
							<span className='h-1.5 w-1.5 rounded-full bg-amber-500' />
							Chờ duyệt
						</span>
					)}
					{isDraft && (
						<span className='inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-[var(--color-pastel-yellow)] px-3 py-1 text-xs font-bold text-black'>
							<span className='h-1.5 w-1.5 rounded-full bg-black' />
							Bản nháp
						</span>
					)}
				</div>

				<form className='space-y-7' onSubmit={(e) => void handleSubmit(e)}>
					{formError && (
						<div className='flex items-start gap-3 rounded-[10px] border-2 border-black bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-[3px_3px_0_#111]'>
							<AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
							<span>{formError}</span>
						</div>
					)}

					{/* Title */}
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
							onChange={(e) => setTitle(e.target.value)}
							placeholder='Tiêu đề blog'
							className='h-[3.25rem] w-full rounded-[10px] border-2 border-black bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					{/* Excerpt */}
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
							onChange={(e) => setExcerpt(e.target.value)}
							placeholder='Một đoạn mô tả ngắn hiển thị ngoài danh sách blog'
							maxLength={1000}
							className='w-full resize-none rounded-[10px] border-2 border-black bg-white px-4 py-3 text-sm font-medium leading-6 outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					{/* Tags */}
					<div>
						<label className='mb-3 block font-heading text-base font-extrabold text-black'>
							Tag
						</label>
						<div className='flex flex-wrap gap-2'>
							{tagsLoading
								? Array.from({ length: 6 }).map((_, i) => (
										<div
											key={i}
											className='h-7 w-20 animate-pulse rounded-full border-2 border-black bg-gray-200'
										/>
									))
								: allTags.map((tag) => {
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
									})}
						</div>
					</div>

					{/* Cover image */}
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
							onKeyDown={(e) => {
								if (e.key !== "Enter" && e.key !== " ") return;
								e.preventDefault();
								openCoverDialog();
							}}
							aria-label='Tải ảnh bìa blog'
							className='flex min-h-52 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border-2 border-dashed border-black bg-white text-center transition hover:bg-gray-100 focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'>
							{displayCover ? (
								<figure className='relative w-full'>
									<button
										type='button'
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setCoverImage(null);
											setExistingCoverUrl(null);
											if (coverInputRef.current) coverInputRef.current.value = "";
										}}
										className='absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_#111] transition hover:bg-red-100 hover:text-red-600'
										aria-label='Xóa ảnh bìa'>
										<X className='h-4 w-4' />
									</button>
									<div className='bg-gray-100'>
										<img
											src={displayCover}
											alt='Ảnh bìa'
											className='max-h-[340px] w-full object-contain'
										/>
									</div>
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

					{/* Content editor */}
					<div>
						<label
							htmlFor='blog-body'
							className='mb-3 block font-heading text-base font-extrabold text-black'>
							Nội dung <span className='text-red-500'>*</span>
						</label>
						<div className='overflow-hidden rounded-[10px] border-2 border-black bg-white'>
							<StacksEditorWrapper
								ref={editorRef}
								placeholder='Viết nội dung blog...'
								initialContent={blog.content ?? ""}
								onDirtyChange={setContentDirty}
							/>
						</div>
					</div>

					{/* Buttons */}
					<div className='flex items-center justify-end gap-3'>
						{isDraft ? (
							<>
								{/* Bài nháp: Hủy, Lưu (giữ nháp) hoặc Đăng (gửi duyệt) */}
								<button
									type='button'
									onClick={() => navigate(-1)}
									disabled={isSubmitting || isSavingDraft}
									className='neo-btn neo-btn-secondary h-11 px-6 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60'>
									<X className='h-4 w-4' />
									Hủy
								</button>
								{/* Chỉ hiện "Lưu" khi có thay đổi so với bản nháp đã lưu */}
								{isDirty && (
									<button
										type='button'
										onClick={() => void submitUpdate("draft")}
										disabled={isSubmitting || isSavingDraft}
										className='neo-btn neo-btn-secondary h-11 px-6 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60'>
										{isSavingDraft ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : (
											<Save className='h-4 w-4' />
										)}
										{isSavingDraft ? "Đang lưu..." : "Lưu"}
									</button>
								)}
								<button
									type='submit'
									disabled={isSubmitting || isSavingDraft}
									className='neo-btn neo-btn-primary h-11 px-6 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60'>
									{isSubmitting ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Send className='h-4 w-4' />
									)}
									{isSubmitting ? "Đang gửi..." : "Đăng"}
								</button>
							</>
						) : (
							<>
								<button
									type='button'
									onClick={() => navigate(-1)}
									disabled={isSubmitting}
									className='neo-btn neo-btn-secondary h-11 px-6 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60'>
									<X className='h-4 w-4' />
									Hủy
								</button>
								<button
									type='submit'
									disabled={isSubmitting}
									className='neo-btn neo-btn-primary h-11 px-6 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-60'>
									{isSubmitting ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Save className='h-4 w-4' />
									)}
									{isSubmitting ? "Đang lưu..." : "Lưu"}
								</button>
							</>
						)}
					</div>
				</form>
			</main>
		</div>
	);
};

export default BlogEditPage;
