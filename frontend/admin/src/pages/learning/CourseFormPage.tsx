import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
	ArrowLeft,
	CalendarClock,
	ImageIcon,
	ListChecks,
	Loader2,
	Save,
	UploadCloud,
	X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import certificateTemplateService from "@/services/certificate-template.service";
import courseService, { type CourseCategoryOption } from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { CertificateTemplate } from "@/types/certificate-template.type";
import type { CourseLevel, CourseStatus } from "@/pages/learning/course-meta";

const NO_CERTIFICATE_TEMPLATE = "none";

// ─── Types ───────────────────────────────────────────────────────────────────

type FormState = {
	title: string;
	description: string;
	level: CourseLevel;
	enrollment_start: string;
	enrollment_deadline: string;
	course_end: string;
	max_offline_slots: string;
	max_absent_allowed: string;
	quiz_pass_threshold: string;
	total_lessons: string;
	certificate_template_id: string;
};

type FieldErrors = Partial<Record<keyof FormState | "thumbnail" | "tag_ids", string>>;

const getInitialForm = (): FormState => ({
	title: "",
	description: "",
	level: "beginner",
	enrollment_start: "",
	enrollment_deadline: "",
	course_end: "",
	max_offline_slots: "30",
	max_absent_allowed: "1",
	quiz_pass_threshold: "80",
	total_lessons: "",
	certificate_template_id: NO_CERTIFICATE_TEMPLATE,
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

/** ISO8601 → giá trị input datetime-local (giờ địa phương) */
function toLocalInput(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local (giờ địa phương, không kèm timezone) → ISO UTC để gửi lên backend (lưu giờ UTC) */
function toUtcIso(localValue: string): string {
	if (!localValue) return "";
	const d = new Date(localValue);
	return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

// ─── Component ────────────────────────────────────────────────────────────────

function CourseFormPage() {
	const navigate = useNavigate();
	const { slug: slugParam } = useParams();
	const isEdit = Boolean(slugParam);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Khóa học", link: "/courses" },
		{ title: isEdit ? "Sửa khóa học" : "Thêm khóa học" },
	]);

	const [form, setForm] = useState<FormState>(getInitialForm);
	const [slug, setSlug] = useState("");
	const [hasOffline, setHasOffline] = useState(true);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);
	const [pendingStatus, setPendingStatus] = useState<CourseStatus | null>(null);
	const [loading, setLoading] = useState(isEdit);
	/** Số buổi học hiện có (khi sửa) — chặn đặt số buổi dự kiến nhỏ hơn. */
	const [existingLessonsCount, setExistingLessonsCount] = useState(0);
	/** Trạng thái hiện tại của khóa khi sửa — null khi tạo mới. */
	const [currentStatus, setCurrentStatus] = useState<CourseStatus | null>(null);

	// Categories (tags)
	const [categories, setCategories] = useState<CourseCategoryOption[]>([]);
	const [selectedTags, setSelectedTags] = useState<number[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState(true);

	// Mẫu chứng chỉ
	const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
	const [templatesLoading, setTemplatesLoading] = useState(true);

	// Thumbnail
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
	const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
	const [removeThumbnail, setRemoveThumbnail] = useState(false);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const previewUrl = newImageUrl ?? (removeThumbnail ? null : existingThumbnail);

	// ── Load categories ──
	useEffect(() => {
		courseService
			.getCategories()
			.then((res) => setCategories(res.data))
			.catch(() => toast.error("Không thể tải danh mục khóa học."))
			.finally(() => setCategoriesLoading(false));
	}, []);

	// ── Load mẫu chứng chỉ ──
	useEffect(() => {
		certificateTemplateService
			.getTemplates({ per_page: 50 })
			.then((res) => setCertificateTemplates(res.data))
			.catch(() => toast.error("Không thể tải mẫu chứng chỉ."))
			.finally(() => setTemplatesLoading(false));
	}, []);

	// ── Load khóa học khi sửa ──
	useEffect(() => {
		if (!isEdit || !slugParam) return;
		let cancelled = false;
		setLoading(true);

		courseService
			.getCourse(slugParam)
			.then((res) => {
				if (cancelled) return;
				const c = res.data;
				setForm({
					title: c.title,
					description: c.description ?? "",
					level: c.level,
					enrollment_start: toLocalInput(c.enrollment_start),
					enrollment_deadline: toLocalInput(c.enrollment_deadline),
					course_end: toLocalInput(c.course_end),
					max_offline_slots:
						c.max_offline_slots != null ? String(c.max_offline_slots) : "30",
					max_absent_allowed: String(c.max_absent_allowed),
					quiz_pass_threshold: String(c.quiz_pass_threshold),
					total_lessons: c.total_lessons != null ? String(c.total_lessons) : "",
					certificate_template_id: c.certificate_template
						? String(c.certificate_template.id)
						: NO_CERTIFICATE_TEMPLATE,
				});
				setSlug(c.slug);
				setHasOffline(c.max_offline_slots != null);
				setSelectedTags(c.categories.map((cat) => cat.id));
				setExistingThumbnail(c.thumbnail);
				setExistingLessonsCount(c.lessons_count);
				setCurrentStatus(c.status);
			})
			.catch((err) => {
				if (cancelled) return;
				if (axios.isAxiosError(err) && err.response?.status === 404) {
					toast.error("Không tìm thấy khóa học.");
					navigate("/courses");
				} else {
					toast.error("Không thể tải khóa học.");
				}
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [isEdit, slugParam, navigate]);

	// ── New image preview ──
	useEffect(() => {
		if (!imageFile) {
			setNewImageUrl(null);
			return;
		}
		const url = URL.createObjectURL(imageFile);
		setNewImageUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [imageFile]);

	// ── Helpers ──
	const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
		setForm((prev) => ({ ...prev, [key]: val }));
		setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleTitleChange = (val: string) => {
		setField("title", val);
		if (!isEdit) setSlug(slugify(val));
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
		const file = e.target.files?.[0] ?? null;
		setImageFile(file);
		if (file) setRemoveThumbnail(false);
	};

	const removeImage = (event: React.MouseEvent) => {
		event.stopPropagation();
		if (imageFile) {
			setImageFile(null);
		} else if (existingThumbnail) {
			setRemoveThumbnail(true);
		}
	};

	// ── Validation ──
	const validate = (): boolean => {
		const errors: FieldErrors = {};
		if (!form.title.trim()) errors.title = "Vui lòng nhập tên khóa học.";
		if (hasOffline) {
			const slots = Number(form.max_offline_slots);
			if (!Number.isFinite(slots) || slots < 1)
				errors.max_offline_slots = "Sức chứa lớp offline phải ≥ 1.";
		}
		if (form.total_lessons.trim()) {
			const total = Number(form.total_lessons);
			if (!Number.isInteger(total) || total < 1) {
				errors.total_lessons = "Số buổi dự kiến phải là số nguyên ≥ 1.";
			} else if (isEdit && total < existingLessonsCount) {
				errors.total_lessons = `Khóa đã có ${existingLessonsCount} buổi học, số buổi dự kiến không được nhỏ hơn.`;
			}
		}
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// ── Submit ──
	const handleSubmit = async (status: CourseStatus) => {
		if (!validate()) return;

		setSubmitting(true);
		setPendingStatus(status);
		try {
			const fd = new FormData();
			fd.append("title", form.title.trim());
			fd.append("level", form.level);
			fd.append("status", status);
			fd.append("description", form.description.trim());
			fd.append("enrollment_start", toUtcIso(form.enrollment_start));
			fd.append("enrollment_deadline", toUtcIso(form.enrollment_deadline));
			fd.append("course_end", toUtcIso(form.course_end));
			fd.append("quiz_pass_threshold", form.quiz_pass_threshold);
			fd.append("total_lessons", form.total_lessons.trim());
			fd.append(
				"certificate_template_id",
				form.certificate_template_id === NO_CERTIFICATE_TEMPLATE
					? ""
					: form.certificate_template_id,
			);
			fd.append("has_offline", hasOffline ? "1" : "0");
			if (hasOffline) {
				fd.append("max_offline_slots", form.max_offline_slots);
				fd.append("max_absent_allowed", form.max_absent_allowed);
			}
			selectedTags.forEach((id) => fd.append("tag_ids[]", String(id)));
			if (imageFile) fd.append("thumbnail", imageFile);
			else if (isEdit && removeThumbnail) fd.append("remove_thumbnail", "1");

			const res = isEdit
				? await courseService.updateCourse(slugParam!, fd)
				: await courseService.createCourse(fd);

			toast.success(isEdit ? "Cập nhật khóa học thành công." : "Tạo khóa học thành công.", {
				position: "top-right",
			});
			navigate(`/courses/${res.data.slug}`);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				const data = err.response?.data as ApiErrorResponse | undefined;
				if (data?.errors) {
					const mapped: FieldErrors = {};
					for (const [key, msgs] of Object.entries(data.errors)) {
						const field = key.replace(/\.\d+$/, "") as keyof FieldErrors;
						mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
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
			setPendingStatus(null);
		}
	};

	if (loading) {
		return (
			<div className='flex h-64 items-center justify-center'>
				<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-6 p-4 md:p-6 lg:p-8'>
			<Button asChild variant='outline' className='w-fit'>
				<Link to={isEdit ? `/courses/${slugParam}` : "/courses"}>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Link>
			</Button>

			<form onSubmit={(e) => e.preventDefault()}>
				<div className='grid gap-6 lg:grid-cols-3'>
					{/* ── Main ── */}
					<div className='flex flex-col gap-6 lg:col-span-2'>
						{/* Thông tin */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle>Thông tin khóa học</CardTitle>
								<CardDescription>
									Tên, mô tả và trình độ của khóa học.
								</CardDescription>
							</CardHeader>
							<CardContent className='flex flex-col gap-5'>
								<div className='flex flex-col gap-2'>
									<Label htmlFor='course-title'>
										Tên khóa học <span className='text-destructive'>*</span>
									</Label>
									<Input
										id='course-title'
										placeholder='VD: Lập trình Web cơ bản'
										value={form.title}
										onChange={(e) => handleTitleChange(e.target.value)}
										disabled={submitting}
									/>
									{slug && (
										<p className='text-xs text-muted-foreground'>
											Đường dẫn: <span className='font-mono'>/{slug}</span>
										</p>
									)}
									{fieldErrors.title && (
										<p className='text-sm text-destructive'>
											{fieldErrors.title}
										</p>
									)}
								</div>

								<div className='flex flex-col gap-2'>
									<Label htmlFor='course-level'>Trình độ</Label>
									<Select
										value={form.level}
										onValueChange={(v) => setField("level", v as CourseLevel)}
										disabled={submitting}>
										<SelectTrigger id='course-level' className='w-full sm:w-60'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='beginner'>Cơ bản</SelectItem>
											<SelectItem value='intermediate'>Trung cấp</SelectItem>
											<SelectItem value='advanced'>Nâng cao</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='flex flex-col gap-2'>
									<Label htmlFor='course-desc'>Mô tả</Label>
									<Textarea
										id='course-desc'
										placeholder='Mô tả ngắn về nội dung và mục tiêu khóa học...'
										value={form.description}
										onChange={(e) => setField("description", e.target.value)}
										disabled={submitting}
										rows={4}
										className='resize-none'
									/>
								</div>
							</CardContent>
						</Card>

						{/* Hình thức & lịch */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<CalendarClock className='h-5 w-5 text-muted-foreground' />
									Mở lớp học trực tiếp
								</CardTitle>
								<CardDescription>
									Khoá học mặc định được tạo theo hình thức học online. Bật mở lớp
									offline nếu tổ chức học trực tiếp song song.
								</CardDescription>
							</CardHeader>
							<CardContent className='flex flex-col gap-5'>
								<label className='flex items-start gap-3 rounded-md border p-3'>
									<Checkbox
										checked={hasOffline}
										onCheckedChange={(c) => {
											const next = c === true;
											setHasOffline(next);
											// Khi tắt offline, xoá tất cả field liên quan để tránh gửi giá trị cũ
											if (!next) {
												setForm((prev) => ({
													...prev,
													max_offline_slots: "30",
													max_absent_allowed: "1",
													enrollment_start: "",
													enrollment_deadline: "",
													course_end: "",
												}));
											}
										}}
										disabled={submitting}
										className='mt-0.5'
									/>
									<div className='space-y-0.5'>
										<p className='text-sm font-medium'>Mở lớp học offline</p>
										<p className='text-xs text-muted-foreground'>
											Cho phép học viên đăng ký học trực tiếp (song song với
											khoá online). Tắt = khóa chỉ học online.
										</p>
									</div>
								</label>

								{hasOffline && (
									<div className='flex flex-col gap-2'>
										<div className='grid gap-4 sm:grid-cols-2'>
											<div className='flex flex-col gap-2'>
												<Label htmlFor='course-slots'>
													Sức chứa lớp offline
												</Label>
												<Input
													id='course-slots'
													type='number'
													min={1}
													value={form.max_offline_slots}
													onChange={(e) =>
														setField(
															"max_offline_slots",
															e.target.value,
														)
													}
													disabled={submitting}
												/>
												{fieldErrors.max_offline_slots && (
													<p className='text-sm text-destructive'>
														{fieldErrors.max_offline_slots}
													</p>
												)}
											</div>

											<div className='flex flex-col gap-2'>
												<Label htmlFor='course-absent'>
													Số buổi vắng tối đa
												</Label>
												<Input
													id='course-absent'
													type='number'
													min={0}
													value={form.max_absent_allowed}
													onChange={(e) =>
														setField(
															"max_absent_allowed",
															e.target.value,
														)
													}
													disabled={submitting}
												/>
											</div>
										</div>
										<div className='grid gap-4 sm:grid-cols-3'>
											<div className='flex flex-col gap-2'>
												<Label htmlFor='course-enr-start'>
													Mở ghi danh
												</Label>
												<Input
													id='course-enr-start'
													type='datetime-local'
													value={form.enrollment_start}
													onChange={(e) =>
														setField("enrollment_start", e.target.value)
													}
													disabled={submitting}
												/>
											</div>
											<div className='flex flex-col gap-2'>
												<Label htmlFor='course-enr-deadline'>
													Hạn ghi danh offline
												</Label>
												<Input
													id='course-enr-deadline'
													type='datetime-local'
													value={form.enrollment_deadline}
													onChange={(e) =>
														setField(
															"enrollment_deadline",
															e.target.value,
														)
													}
													disabled={submitting}
												/>
												{fieldErrors.enrollment_deadline && (
													<p className='text-sm text-destructive'>
														{fieldErrors.enrollment_deadline}
													</p>
												)}
											</div>
											<div className='flex flex-col gap-2'>
												<Label htmlFor='course-end'>Kết thúc khóa</Label>
												<Input
													id='course-end'
													type='datetime-local'
													value={form.course_end}
													onChange={(e) =>
														setField("course_end", e.target.value)
													}
													disabled={submitting}
												/>
												{fieldErrors.course_end && (
													<p className='text-sm text-destructive'>
														{fieldErrors.course_end}
													</p>
												)}
											</div>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Ảnh đại diện */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<ImageIcon className='h-5 w-5 text-muted-foreground' />
									Ảnh đại diện
								</CardTitle>
								<CardDescription>
									Thumbnail hiển thị ở danh sách khóa học (tuỳ chọn).
								</CardDescription>
							</CardHeader>
							<CardContent>
								<input
									ref={imageInputRef}
									type='file'
									accept='image/*'
									className='sr-only'
									onChange={handleImageChange}
								/>
								<div
									role='button'
									tabIndex={0}
									onClick={openImageDialog}
									onKeyDown={(e) => {
										if (e.key !== "Enter" && e.key !== " ") return;
										e.preventDefault();
										openImageDialog();
									}}
									aria-label='Tải ảnh đại diện'
									className='group relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:border-muted-foreground/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
									{previewUrl ? (
										<div className='w-full space-y-3'>
											<div className='mx-auto max-w-sm overflow-hidden rounded-lg border bg-background shadow-sm'>
												<div className='relative aspect-video w-full bg-muted'>
													<img
														src={previewUrl}
														alt='Preview'
														className='h-full w-full object-cover'
													/>
												</div>
												<div className='flex items-center justify-between border-t px-3 py-2'>
													<p className='truncate text-xs text-muted-foreground'>
														{imageFile?.name ?? "Ảnh hiện tại"}
													</p>
													<button
														type='button'
														onClick={removeImage}
														aria-label='Xoá ảnh'
														className='ml-2 shrink-0 rounded p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive'>
														<X className='h-3.5 w-3.5' />
													</button>
												</div>
											</div>
											<p className='text-sm text-muted-foreground'>
												Nhấn để thay đổi ảnh
											</p>
										</div>
									) : (
										<>
											<UploadCloud className='h-10 w-10 text-muted-foreground/50 transition group-hover:text-muted-foreground' />
											<p className='mt-3 text-sm font-medium text-muted-foreground'>
												Kéo & thả hoặc nhấn để chọn ảnh
											</p>
											<p className='mt-1 text-xs text-muted-foreground/60'>
												Hỗ trợ PNG, JPG, WebP (khuyến nghị 1200×630px)
											</p>
										</>
									)}
								</div>
								{fieldErrors.thumbnail && (
									<p className='mt-2 text-sm text-destructive'>
										{fieldErrors.thumbnail}
									</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* ── Sidebar ── */}
					<div className='flex flex-col gap-6'>
						{/* Cấu hình quiz */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<ListChecks className='h-5 w-5 text-muted-foreground' />
									Cấu hình khoá học
								</CardTitle>
							</CardHeader>
							<CardContent className='flex flex-col gap-5'>
								<div className='flex flex-col gap-2'>
									<Label htmlFor='course-quiz'>Ngưỡng đạt quiz (%)</Label>
									<Input
										id='course-quiz'
										type='number'
										min={0}
										max={100}
										value={form.quiz_pass_threshold}
										onChange={(e) =>
											setField("quiz_pass_threshold", e.target.value)
										}
										disabled={submitting}
									/>
									<p className='text-xs text-muted-foreground'>
										Điểm tối thiểu để vượt qua bài quiz của buổi học.
									</p>
								</div>

								<div className='flex flex-col gap-2'>
									<Label htmlFor='course-total-lessons'>
										Số buổi học dự kiến
									</Label>
									<Input
										id='course-total-lessons'
										type='number'
										min={1}
										max={200}
										placeholder='Để trống nếu không giới hạn'
										value={form.total_lessons}
										onChange={(e) => setField("total_lessons", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.total_lessons && (
										<p className='text-sm text-destructive'>
											{fieldErrors.total_lessons}
										</p>
									)}
									<p className='text-xs text-muted-foreground'>
										Cố định số buổi của khóa. Khi đã đủ số buổi này sẽ không tạo
										thêm được. Để trống = không giới hạn.
									</p>
								</div>

								<div className='flex flex-col gap-2'>
									<Label htmlFor='course-certificate-template'>
										Mẫu chứng chỉ
									</Label>
									<Select
										value={form.certificate_template_id}
										onValueChange={(v) =>
											setField("certificate_template_id", v)
										}
										disabled={submitting || templatesLoading}>
										<SelectTrigger
											id='course-certificate-template'
											className='w-full'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={NO_CERTIFICATE_TEMPLATE}>
												Không sử dụng
											</SelectItem>
											{certificateTemplates.map((t) => (
												<SelectItem key={t.id} value={String(t.id)}>
													{t.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<p className='text-xs text-muted-foreground'>
										Mẫu chứng chỉ tự sinh khi học viên hoàn thành khóa học.
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Tags */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle>Danh mục</CardTitle>
								<CardDescription>
									Gắn danh mục giúp học viên dễ tìm khóa học.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{categoriesLoading ? (
									<p className='text-sm text-muted-foreground'>
										Đang tải danh mục...
									</p>
								) : categories.length === 0 ? (
									<p className='text-sm text-muted-foreground'>
										Chưa có danh mục nào.
									</p>
								) : (
									<div className='flex flex-wrap gap-2'>
										{categories.map((cat) => {
											const isActive = selectedTags.includes(cat.id);
											return (
												<button
													key={cat.id}
													type='button'
													onClick={() => toggleTag(cat.id)}
													disabled={submitting}
													className='rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
													<Badge
														variant={isActive ? "default" : "outline"}
														className='cursor-pointer rounded-full px-3 py-1 text-xs transition-all'>
														{cat.name}
													</Badge>
												</button>
											);
										})}
									</div>
								)}
								{selectedTags.length > 0 && (
									<p className='mt-3 text-xs text-muted-foreground'>
										Đã chọn {selectedTags.length} danh mục
									</p>
								)}
							</CardContent>
						</Card>

						{/* Actions */}
						<Card className='shadow-sm py-6'>
							<CardFooter className='flex flex-col gap-3'>
								<div className='grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3'>
									<Button
										type='button'
										variant='outline'
										disabled={submitting}
										onClick={() => void handleSubmit("draft")}>
										{submitting && pendingStatus === "draft" ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : (
											<Save className='h-4 w-4' />
										)}
										{currentStatus === "published"
											? "Chuyển về nháp"
											: "Lưu nháp"}
									</Button>
									<Button
										type='button'
										disabled={submitting}
										onClick={() => void handleSubmit("published")}>
										{submitting && pendingStatus === "published" ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : (
											<Save className='h-4 w-4' />
										)}
										{currentStatus === "published"
											? "Lưu thay đổi"
											: "Xuất bản"}
									</Button>
								</div>
								<Button
									type='button'
									variant='outline'
									className='w-full'
									onClick={() =>
										navigate(isEdit ? `/courses/${slugParam}` : "/courses")
									}
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

export default CourseFormPage;
