import { type FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import {
	ArrowLeft,
	ImageIcon,
	Loader2,
	Send,
	UploadCloud,
	X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StacksEditorWrapper, {
	type StacksEditorHandle,
} from "@/components/ui/StacksEditorWrapper";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import blogService from "@/services/blog.service";
import tagService from "@/services/tag.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { BlogStatus } from "./BlogListPage";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TagOption {
	id: number;
	name: string;
	color: string | null;
}

type FormState = {
	title: string;
	excerpt: string;
	status: BlogStatus;
};

type FieldErrors = Partial<
	Record<keyof FormState | "content" | "featured_image" | "tags", string>
>;

const getInitialForm = (): FormState => ({
	title: "",
	excerpt: "",
	status: "draft",
});

function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/đ/g, "d")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

// ─── Component ────────────────────────────────────────────────────────────────

function BlogCreatePage() {
	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Quản lý blog", link: "/community/blogs" },
		{ title: "Thêm blog" },
	]);

	const navigate = useNavigate();

	const [form, setForm] = useState<FormState>(getInitialForm);
	const [slug, setSlug] = useState("");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);

	// Editor
	const editorRef = useRef<StacksEditorHandle>(null);

	// Tags
	const [tags, setTags] = useState<TagOption[]>([]);
	const [selectedTags, setSelectedTags] = useState<number[]>([]);
	const [tagsLoading, setTagsLoading] = useState(true);

	// Featured image
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	// ── Load tags ──
	useEffect(() => {
		tagService
			.getTags({ per_page: 100 })
			.then((res) => setTags(res.data as unknown as TagOption[]))
			.catch(() => toast.error("Không thể tải danh sách tag."))
			.finally(() => setTagsLoading(false));
	}, []);

	// ── Image preview ──
	useEffect(() => {
		if (!imageFile) { setImagePreview(null); return; }
		const url = URL.createObjectURL(imageFile);
		setImagePreview(url);
		return () => URL.revokeObjectURL(url);
	}, [imageFile]);

	// ── Helpers ──
	const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
		setForm((prev) => ({ ...prev, [key]: val }));
		setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleTitleChange = (val: string) => {
		setField("title", val);
		setSlug(slugify(val));
	};

	const toggleTag = (id: number) =>
		setSelectedTags((prev) =>
			prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
		);

	const openImageDialog = () => {
		if (!imageInputRef.current) return;
		imageInputRef.current.value = "";
		imageInputRef.current.click();
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setImageFile(e.target.files?.[0] ?? null);
	};

	const removeImage = (event: React.MouseEvent) => {
		event.stopPropagation();
		setImageFile(null);
	};

	// ── Validation ──
	const validate = (): boolean => {
		const errors: FieldErrors = {};
		const content = editorRef.current?.getContent()?.trim() ?? "";
		if (!form.title.trim()) errors.title = "Vui lòng nhập tiêu đề bài viết.";
		if (!content) errors.content = "Vui lòng nhập nội dung bài viết.";
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// ── Submit ──
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		const content = editorRef.current?.getContent()?.trim() ?? "";

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("title", form.title.trim());
			formData.append("slug", slug || slugify(form.title.trim()));
			formData.append("content", content);
			formData.append("status", form.status);
			if (form.excerpt.trim()) formData.append("excerpt", form.excerpt.trim());
			selectedTags.forEach((id) => formData.append("tag_ids[]", String(id)));
			if (imageFile) formData.append("featured_image", imageFile);

			await blogService.createBlog(formData);
			toast.success("Tạo blog thành công.", { position: "top-right" });
			navigate("/community/blogs");
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const data = err.response?.data as ApiErrorResponse | undefined;
				if (data?.errors) {
					const mapped: FieldErrors = {};
					for (const [key, msgs] of Object.entries(data.errors)) {
						mapped[key as keyof FieldErrors] = Array.isArray(msgs) ? msgs[0] : String(msgs);
					}
					setFieldErrors(mapped);
					return;
				}
				toast.error(data?.message ?? "Có lỗi xảy ra.", { position: "top-right" });
			} else {
				toast.error("Có lỗi xảy ra.", { position: "top-right" });
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
			{/* Back */}
			<Button asChild variant="outline" className="w-fit">
				<Link to="/community/blogs">
					<ArrowLeft className="h-4 w-4" />
					Quay lại
				</Link>
			</Button>

			<form onSubmit={(e) => void handleSubmit(e)}>
				<div className="grid gap-6 lg:grid-cols-3">

					{/* ── Main ── */}
					<div className="flex flex-col gap-6 lg:col-span-2">

						{/* Thông tin cơ bản */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Thông tin bài viết</CardTitle>
								<CardDescription>
									Tiêu đề, slug và tóm tắt ngắn cho bài blog.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-5">

								{/* Title */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="blog-title">
										Tiêu đề <span className="text-destructive">*</span>
									</Label>
									<Input
										id="blog-title"
										placeholder="Nhập tiêu đề bài viết..."
										value={form.title}
										onChange={(e) => handleTitleChange(e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.title && (
										<p className="text-sm text-destructive">{fieldErrors.title}</p>
									)}
								</div>

								{/* Excerpt */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="blog-excerpt">Tóm tắt</Label>
									<Textarea
										id="blog-excerpt"
										placeholder="Mô tả ngắn về bài viết (hiển thị ở trang danh sách blog)..."
										value={form.excerpt}
										onChange={(e) => setField("excerpt", e.target.value)}
										disabled={submitting}
										rows={3}
										className="resize-none"
									/>
								</div>
							</CardContent>
						</Card>

						{/* Nội dung — StacksEditor */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Nội dung <span className="text-destructive">*</span></CardTitle>
								<CardDescription>
									Soạn thảo nội dung bài viết với editor hỗ trợ Markdown và Rich text.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div
									className="overflow-hidden rounded-md border bg-background"
									onClick={() => editorRef.current?.focus()}
									style={{ cursor: "text" }}>
									<StacksEditorWrapper
										ref={editorRef}
										placeholder="Bắt đầu viết nội dung bài blog của bạn..."
									/>
								</div>
								{fieldErrors.content && (
									<p className="mt-2 text-sm text-destructive">{fieldErrors.content}</p>
								)}
							</CardContent>
						</Card>

						{/* Ảnh đại diện */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ImageIcon className="h-5 w-5 text-muted-foreground" />
									Ảnh đại diện
								</CardTitle>
								<CardDescription>
									Ảnh thumbnail hiển thị ở trang danh sách và đầu bài viết (tuỳ chọn).
								</CardDescription>
							</CardHeader>
							<CardContent>
								<input
									ref={imageInputRef}
									type="file"
									accept="image/*"
									className="sr-only"
									onChange={handleImageChange}
								/>
								<div
									role="button"
									tabIndex={0}
									onClick={openImageDialog}
									onKeyDown={(e) => {
										if (e.key !== "Enter" && e.key !== " ") return;
										e.preventDefault();
										openImageDialog();
									}}
									aria-label="Tải ảnh đại diện"
									className="group relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:border-muted-foreground/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
									{imagePreview ? (
										<div className="w-full space-y-3">
											<div className="mx-auto max-w-sm overflow-hidden rounded-lg border bg-background shadow-sm">
												<div className="relative aspect-video w-full bg-muted">
													<img
														src={imagePreview}
														alt="Preview"
														className="h-full w-full object-cover"
													/>
												</div>
												<div className="flex items-center justify-between border-t px-3 py-2">
													<p className="truncate text-xs text-muted-foreground">
														{imageFile?.name}
													</p>
													<button
														type="button"
														onClick={removeImage}
														aria-label="Xoá ảnh"
														className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
														<X className="h-3.5 w-3.5" />
													</button>
												</div>
											</div>
											<p className="text-sm text-muted-foreground">Nhấn để thay đổi ảnh</p>
										</div>
									) : (
										<>
											<UploadCloud className="h-10 w-10 text-muted-foreground/50 transition group-hover:text-muted-foreground" />
											<p className="mt-3 text-sm font-medium text-muted-foreground">
												Kéo & thả hoặc nhấn để chọn ảnh
											</p>
											<p className="mt-1 text-xs text-muted-foreground/60">
												Hỗ trợ PNG, JPG, WebP (khuyến nghị 1200×630px)
											</p>
										</>
									)}
								</div>
								{fieldErrors.featured_image && (
									<p className="mt-2 text-sm text-destructive">{fieldErrors.featured_image}</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* ── Sidebar ── */}
					<div className="flex flex-col gap-6">

						{/* Trạng thái */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Xuất bản</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-2">
									<Label htmlFor="blog-status">Trạng thái</Label>
									<Select
										value={form.status}
										onValueChange={(v) => setField("status", v as BlogStatus)}
										disabled={submitting}>
										<SelectTrigger id="blog-status" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">Bản nháp</SelectItem>
											<SelectItem value="pending_review">Gửi duyệt</SelectItem>
											<SelectItem value="published">Xuất bản ngay</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										{form.status === "draft" && "Lưu nháp, chưa hiển thị công khai."}
										{form.status === "pending_review" && "Gửi cho admin duyệt trước khi xuất bản."}
										{form.status === "published" && "Xuất bản ngay và hiển thị công khai."}
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Tags */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Tags</CardTitle>
								<CardDescription>Gắn tag giúp bài viết dễ được tìm thấy hơn.</CardDescription>
							</CardHeader>
							<CardContent>
								{tagsLoading ? (
									<p className="text-sm text-muted-foreground">Đang tải tags...</p>
								) : tags.length === 0 ? (
									<p className="text-sm text-muted-foreground">Chưa có tag nào.</p>
								) : (
									<div className="flex flex-wrap gap-2">
										{tags.map((tag) => {
											const isActive = selectedTags.includes(tag.id);
											return (
												<button
													key={tag.id}
													type="button"
													onClick={() => toggleTag(tag.id)}
													disabled={submitting}
													className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
													<Badge
														variant={isActive ? "default" : "outline"}
														className="cursor-pointer rounded-full px-3 py-1 text-xs transition-all"
														style={
															tag.color && !isActive
																? { borderColor: `${tag.color}50`, color: tag.color }
																: tag.color && isActive
																	? { backgroundColor: tag.color, borderColor: tag.color, color: "#fff" }
																	: undefined
														}>
														{tag.name}
													</Badge>
												</button>
											);
										})}
									</div>
								)}
								{selectedTags.length > 0 && (
									<p className="mt-3 text-xs text-muted-foreground">
										Đã chọn {selectedTags.length} tag
									</p>
								)}
							</CardContent>
						</Card>

						{/* Actions */}
						<Card className="shadow-sm">
							<CardFooter className="flex flex-col gap-3 pt-6">
								<Button type="submit" className="w-full" disabled={submitting}>
									{submitting
										? <Loader2 className="h-4 w-4 animate-spin" />
										: <Send className="h-4 w-4" />}
									{submitting ? "Đang lưu..." : "Lưu bài viết"}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => navigate("/community/blogs")}
									disabled={submitting}>
									Hủy
								</Button>
							</CardFooter>
						</Card>
					</div>
				</div>
			</form>
		</div>
	);
}

export default BlogCreatePage;
