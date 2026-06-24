import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ArrowLeft, FileText, Link as LinkIcon, Loader2, Save, Video } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import StacksEditorWrapper, {
	type StacksEditorHandle,
} from "@/components/ui/StacksEditorWrapper";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import courseService, { type LessonPayload } from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { CourseStatus } from "@/pages/learning/course-meta";

// ─── Types & helpers ──────────────────────────────────────────────────────────

type LessonForm = {
	title: string;
	description: string;
	session_start: string;
	session_end: string;
	video_url: string;
	video_duration: string;
	live_url: string;
	live_duration: string;
	resource_url: string;
	assignment_url: string;
	assignment_deadline: string;
	document: string;
};

type FieldErrors = Partial<Record<keyof LessonForm, string>>;

const emptyForm = (): LessonForm => ({
	title: "",
	description: "",
	session_start: "",
	session_end: "",
	video_url: "",
	video_duration: "",
	live_url: "",
	live_duration: "",
	resource_url: "",
	assignment_url: "",
	assignment_deadline: "",
	document: "",
});

/** Số giây → nhãn "X tiếng Y phút" (làm tròn phút lên, bỏ phần 0). */
function formatDurationLabel(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return "—";
	let hours = Math.floor(seconds / 3600);
	let minutes = Math.round((seconds % 3600) / 60);
	if (minutes === 60) {
		hours += 1;
		minutes = 0;
	}
	const parts: string[] = [];
	if (hours > 0) parts.push(`${hours} tiếng`);
	if (minutes > 0 || hours === 0) parts.push(`${minutes} phút`);
	return parts.join(" ");
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

function LessonFormPage() {
	const navigate = useNavigate();
	const { slug = "", lessonId: lessonIdParam } = useParams();
	const isEdit = Boolean(lessonIdParam);
	const lessonId = lessonIdParam ? Number(lessonIdParam) : null;

	const [courseTitle, setCourseTitle] = useState<string | null>(null);
	const [form, setForm] = useState<LessonForm>(emptyForm);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [pendingStatus, setPendingStatus] = useState<CourseStatus | null>(null);
	const [durationLoading, setDurationLoading] = useState(false);
	const editorRef = useRef<StacksEditorHandle>(null);

	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Khóa học", link: "/courses" },
		{ title: courseTitle ?? slug, link: `/courses/${slug}` },
		{ title: isEdit ? "Sửa buổi học" : "Thêm buổi học" },
	]);

	// `loading` đảm bảo chỉ render (mount) StacksEditor sau khi form đã đúng — tránh
	// editor mount với initialContent cũ (nó chỉ đọc initialContent 1 lần).
	useEffect(() => {
		if (!slug) return;
		let cancelled = false;

		courseService
			.getCourse(slug)
			.then((res) => {
				if (!cancelled) setCourseTitle(res.data.title);
			})
			.catch(() => undefined);

		if (!isEdit || lessonId === null) {
			setForm(emptyForm());
			setLoading(false);
			return;
		}

		setLoading(true);
		courseService
			.getLesson(slug, lessonId)
			.then((res) => {
				if (cancelled) return;
				const l = res.data;
				setForm({
					title: l.title,
					description: l.description ?? "",
					session_start: toLocalInput(l.session_start),
					session_end: toLocalInput(l.session_end),
					video_url: l.video_url ?? "",
					video_duration: l.video_duration != null ? String(l.video_duration) : "",
					live_url: l.live_url ?? "",
					live_duration: l.live_duration != null ? String(l.live_duration) : "",
					resource_url: l.resource_url ?? "",
					assignment_url: l.assignment_url ?? "",
					assignment_deadline: toLocalInput(l.assignment_deadline),
					document: l.document ?? "",
				});
			})
			.catch(() => {
				if (cancelled) return;
				toast.error("Không thể tải buổi học.");
				navigate(`/courses/${slug}`);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [slug, isEdit, lessonId, navigate]);

	const setField = <K extends keyof LessonForm>(key: K, val: LessonForm[K]) => {
		setForm((prev) => ({ ...prev, [key]: val }));
		setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	/** Tự lấy thời lượng video từ link YouTube (qua backend) khi rời ô nhập URL. */
	const fetchVideoDuration = async (url: string) => {
		const trimmed = url.trim();
		if (!trimmed) {
			setField("video_duration", "");
			return;
		}
		setDurationLoading(true);
		try {
			const res = await courseService.getYoutubeDuration(trimmed);
			setField("video_duration", String(res.data.seconds));
		} catch (err) {
			const msg = axios.isAxiosError(err)
				? ((err.response?.data as ApiErrorResponse | undefined)?.message ??
					"Không lấy được thời lượng video.")
				: "Không lấy được thời lượng video.";
			toast.error(msg, { position: "top-right" });
		} finally {
			setDurationLoading(false);
		}
	};

	const handleSubmit = async (status: CourseStatus) => {
		if (!form.title.trim()) {
			setFieldErrors({ title: "Vui lòng nhập tên buổi học." });
			return;
		}

		const payload: LessonPayload = {
			title: form.title.trim(),
			status,
			description: form.description,
			session_start: toUtcIso(form.session_start),
			session_end: toUtcIso(form.session_end),
			video_url: form.video_url,
			video_duration: form.video_duration,
			live_url: form.live_url,
			live_duration: form.live_duration,
			resource_url: form.resource_url,
			assignment_url: form.assignment_url,
			assignment_deadline: toUtcIso(form.assignment_deadline),
			document: editorRef.current?.getContent() ?? "",
		};

		setSubmitting(true);
		setPendingStatus(status);
		try {
			if (isEdit && lessonId !== null) {
				await courseService.updateLesson(slug, lessonId, payload);
				toast.success("Cập nhật buổi học thành công.", { position: "top-right" });
			} else {
				await courseService.createLesson(slug, payload);
				toast.success("Tạo buổi học thành công.", { position: "top-right" });
			}
			navigate(`/courses/${slug}?tab=lessons`);
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
				<Link to={`/courses/${slug}?tab=lessons`}>
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
								<CardTitle>Thông tin buổi học</CardTitle>
								<CardDescription>Tên, mô tả và lịch học offline (nếu có).</CardDescription>
							</CardHeader>
							<CardContent className='flex flex-col gap-5'>
								<div className='flex flex-col gap-2'>
									<Label htmlFor='lesson-title'>
										Tên buổi học <span className='text-destructive'>*</span>
									</Label>
									<Input
										id='lesson-title'
										placeholder='VD: Buổi 1 — Giới thiệu & cài đặt'
										value={form.title}
										onChange={(e) => setField("title", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.title && (
										<p className='text-sm text-destructive'>{fieldErrors.title}</p>
									)}
								</div>

								<div className='flex flex-col gap-2'>
									<Label htmlFor='lesson-desc'>Mô tả ngắn</Label>
									<Textarea
										id='lesson-desc'
										rows={2}
										className='resize-none'
										value={form.description}
										onChange={(e) => setField("description", e.target.value)}
										disabled={submitting}
									/>
								</div>

								<div className='grid gap-4 sm:grid-cols-2'>
									<div className='flex flex-col gap-2'>
										<Label htmlFor='lesson-start'>Bắt đầu (buổi offline)</Label>
										<Input
											id='lesson-start'
											type='datetime-local'
											value={form.session_start}
											onChange={(e) => setField("session_start", e.target.value)}
											disabled={submitting}
										/>
									</div>
									<div className='flex flex-col gap-2'>
										<Label htmlFor='lesson-end'>Kết thúc (buổi offline)</Label>
										<Input
											id='lesson-end'
											type='datetime-local'
											value={form.session_end}
											onChange={(e) => setField("session_end", e.target.value)}
											disabled={submitting}
										/>
										{fieldErrors.session_end && (
											<p className='text-sm text-destructive'>{fieldErrors.session_end}</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Video */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Video className='h-5 w-5 text-muted-foreground' />
									Video bài giảng
								</CardTitle>
							</CardHeader>
							<CardContent className='flex flex-col gap-5'>
								<div className='grid gap-4 sm:grid-cols-2'>
									<div className='flex flex-col gap-2'>
										<Label htmlFor='lesson-video'>Video bài giảng (URL)</Label>
										<Input
											id='lesson-video'
											placeholder='https://youtube.com/...'
											value={form.video_url}
											onChange={(e) => setField("video_url", e.target.value)}
											onBlur={(e) => void fetchVideoDuration(e.target.value)}
											disabled={submitting}
										/>
										{fieldErrors.video_url && (
											<p className='text-sm text-destructive'>{fieldErrors.video_url}</p>
										)}
									</div>
									<div className='flex flex-col gap-2'>
										<Label htmlFor='lesson-vid-dur'>Thời lượng video</Label>
										<Input
											id='lesson-vid-dur'
											readOnly
											disabled
											value={
												durationLoading
													? "Đang lấy thời lượng…"
													: form.video_duration
														? formatDurationLabel(Number(form.video_duration))
														: ""
											}
											placeholder='Tự lấy từ link YouTube'
										/>
									</div>
								</div>
								<div className='flex flex-col gap-2'>
									<Label htmlFor='lesson-live'>Video bản ghi livestream (URL)</Label>
									<Input
										id='lesson-live'
										placeholder='https://youtube.com/...'
										value={form.live_url}
										onChange={(e) => setField("live_url", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.live_url && (
										<p className='text-sm text-destructive'>{fieldErrors.live_url}</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Tài nguyên & bài tập */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<LinkIcon className='h-5 w-5 text-muted-foreground' />
									Tài nguyên & bài tập
								</CardTitle>
							</CardHeader>
							<CardContent className='flex flex-col gap-5'>
								<div className='flex flex-col gap-2'>
									<Label htmlFor='lesson-res-url'>Tài nguyên (URL)</Label>
									<Input
										id='lesson-res-url'
										placeholder='Google Drive...'
										value={form.resource_url}
										onChange={(e) => setField("resource_url", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.resource_url && (
										<p className='text-sm text-destructive'>{fieldErrors.resource_url}</p>
									)}
								</div>
								<div className='grid gap-4 sm:grid-cols-2'>
									<div className='flex flex-col gap-2'>
										<Label htmlFor='lesson-assign-url'>Bài tập (URL)</Label>
										<Input
											id='lesson-assign-url'
											placeholder='Google Forms...'
											value={form.assignment_url}
											onChange={(e) => setField("assignment_url", e.target.value)}
											disabled={submitting}
										/>
										{fieldErrors.assignment_url && (
											<p className='text-sm text-destructive'>{fieldErrors.assignment_url}</p>
										)}
									</div>
									<div className='flex flex-col gap-2'>
										<Label htmlFor='lesson-assign-deadline'>Hạn nộp bài</Label>
										<Input
											id='lesson-assign-deadline'
											type='datetime-local'
											value={form.assignment_deadline}
											onChange={(e) => setField("assignment_deadline", e.target.value)}
											disabled={submitting}
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Tài liệu markdown — StacksEditor */}
						<Card className='shadow-sm'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<FileText className='h-5 w-5 text-muted-foreground' />
									Tài liệu (Markdown)
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div
									className='overflow-hidden rounded-md border bg-background'
									onClick={() => editorRef.current?.focus()}
									style={{ cursor: "text" }}>
									<StacksEditorWrapper
										ref={editorRef}
										initialContent={form.document}
										placeholder='Nội dung tài liệu buổi học (hỗ trợ Markdown)...'
									/>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* ── Sidebar ── */}
					<div className='flex flex-col gap-6'>
						{/* Actions */}
						<Card className='shadow-sm'>
							<CardFooter className='flex flex-col gap-3 pt-6'>
								<div className='grid w-full grid-cols-2 gap-3'>
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
										Lưu nháp
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
										Xuất bản
									</Button>
								</div>
								<Button
									type='button'
									variant='outline'
									className='w-full'
									onClick={() => navigate(`/courses/${slug}?tab=lessons`)}
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

export default LessonFormPage;
