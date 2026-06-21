import { type FormEvent, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import courseService, { type LessonPayload } from "@/services/course.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { CourseStatus } from "@/pages/learning/course-meta";

// ─── Types & helpers ──────────────────────────────────────────────────────────

type LessonForm = {
	title: string;
	status: CourseStatus;
	description: string;
	session_start: string;
	session_end: string;
	video_url: string;
	video_duration: string;
	live_url: string;
	resource_url: string;
	resource_label: string;
	assignment_url: string;
	assignment_deadline: string;
	document: string;
};

type FieldErrors = Partial<Record<keyof LessonForm, string>>;

const emptyForm = (): LessonForm => ({
	title: "",
	status: "draft",
	description: "",
	session_start: "",
	session_end: "",
	video_url: "",
	video_duration: "",
	live_url: "",
	resource_url: "",
	resource_label: "",
	assignment_url: "",
	assignment_deadline: "",
	document: "",
});

function toLocalInput(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface LessonFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	courseSlug: string;
	/** null = tạo mới, số = sửa buổi học */
	lessonId: number | null;
	onSaved: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

function LessonFormDialog({ open, onOpenChange, courseSlug, lessonId, onSaved }: LessonFormDialogProps) {
	const isEdit = lessonId !== null;
	const [form, setForm] = useState<LessonForm>(emptyForm);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [ready, setReady] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const editorRef = useRef<StacksEditorHandle>(null);

	// `ready` đảm bảo chỉ render (mount) editor sau khi form đã đúng — tránh
	// StacksEditor mount với initialContent cũ (nó chỉ đọc initialContent 1 lần).
	useEffect(() => {
		if (!open) {
			setReady(false);
			return;
		}
		setFieldErrors({});

		if (!isEdit) {
			setForm(emptyForm());
			setReady(true);
			return;
		}

		let cancelled = false;
		courseService
			.getLesson(courseSlug, lessonId)
			.then((res) => {
				if (cancelled) return;
				const l = res.data;
				setForm({
					title: l.title,
					status: l.status,
					description: l.description ?? "",
					session_start: toLocalInput(l.session_start),
					session_end: toLocalInput(l.session_end),
					video_url: l.video_url ?? "",
					video_duration: l.video_duration != null ? String(l.video_duration) : "",
					live_url: l.live_url ?? "",
					resource_url: l.resource_url ?? "",
					resource_label: l.resource_label ?? "",
					assignment_url: l.assignment_url ?? "",
					assignment_deadline: toLocalInput(l.assignment_deadline),
					document: l.document ?? "",
				});
				setReady(true);
			})
			.catch(() => {
				if (cancelled) return;
				toast.error("Không thể tải buổi học.");
				onOpenChange(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, isEdit, courseSlug, lessonId, onOpenChange]);

	const setField = <K extends keyof LessonForm>(key: K, val: LessonForm[K]) => {
		setForm((prev) => ({ ...prev, [key]: val }));
		setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!form.title.trim()) {
			setFieldErrors({ title: "Vui lòng nhập tên buổi học." });
			return;
		}

		const payload: LessonPayload = {
			title: form.title.trim(),
			status: form.status,
			description: form.description,
			session_start: form.session_start,
			session_end: form.session_end,
			video_url: form.video_url,
			video_duration: form.video_duration,
			live_url: form.live_url,
			resource_url: form.resource_url,
			resource_label: form.resource_label,
			assignment_url: form.assignment_url,
			assignment_deadline: form.assignment_deadline,
			document: editorRef.current?.getContent() ?? "",
		};

		setSubmitting(true);
		try {
			if (isEdit) {
				await courseService.updateLesson(courseSlug, lessonId, payload);
				toast.success("Cập nhật buổi học thành công.", { position: "top-right" });
			} else {
				await courseService.createLesson(courseSlug, payload);
				toast.success("Tạo buổi học thành công.", { position: "top-right" });
			}
			onSaved();
			onOpenChange(false);
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[640px]'>
				<DialogHeader>
					<DialogTitle>{isEdit ? "Sửa buổi học" : "Thêm buổi học"}</DialogTitle>
					<DialogDescription>
						Nội dung buổi học: video bài giảng, tài liệu, bài tập và lịch học offline.
					</DialogDescription>
				</DialogHeader>

				{!ready ? (
					<div className='flex h-40 items-center justify-center'>
						<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
					</div>
				) : (
					<form onSubmit={(e) => void handleSubmit(e)} className='flex flex-col gap-4'>
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

						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='flex flex-col gap-2'>
								<Label htmlFor='lesson-status'>Trạng thái</Label>
								<Select
									value={form.status}
									onValueChange={(v) => setField("status", v as CourseStatus)}
									disabled={submitting}>
									<SelectTrigger id='lesson-status'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='draft'>Bản nháp</SelectItem>
										<SelectItem value='published'>Đã xuất bản</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className='flex flex-col gap-2'>
								<Label htmlFor='lesson-vid-dur'>Thời lượng video (giây)</Label>
								<Input
									id='lesson-vid-dur'
									type='number'
									min={0}
									placeholder='VD: 1800'
									value={form.video_duration}
									onChange={(e) => setField("video_duration", e.target.value)}
									disabled={submitting}
								/>
							</div>
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

						{/* Lịch offline */}
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

						{/* Video */}
						<div className='flex flex-col gap-2'>
							<Label htmlFor='lesson-video'>Video bài giảng (URL)</Label>
							<Input
								id='lesson-video'
								placeholder='https://youtube.com/...'
								value={form.video_url}
								onChange={(e) => setField("video_url", e.target.value)}
								disabled={submitting}
							/>
							{fieldErrors.video_url && (
								<p className='text-sm text-destructive'>{fieldErrors.video_url}</p>
							)}
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

						{/* Tài nguyên */}
						<div className='grid gap-4 sm:grid-cols-2'>
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
							<div className='flex flex-col gap-2'>
								<Label htmlFor='lesson-res-label'>Nhãn tài nguyên</Label>
								<Input
									id='lesson-res-label'
									placeholder='VD: Slide buổi 1'
									value={form.resource_label}
									onChange={(e) => setField("resource_label", e.target.value)}
									disabled={submitting}
								/>
							</div>
						</div>

						{/* Bài tập */}
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

						{/* Tài liệu markdown — StacksEditor */}
						<div className='flex flex-col gap-2'>
							<Label>Tài liệu (Markdown)</Label>
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
						</div>

						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => onOpenChange(false)}
								disabled={submitting}>
								Hủy
							</Button>
							<Button type='submit' disabled={submitting}>
								{submitting && <Loader2 className='h-4 w-4 animate-spin' />}
								{isEdit ? "Lưu thay đổi" : "Thêm buổi học"}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

export default LessonFormDialog;
