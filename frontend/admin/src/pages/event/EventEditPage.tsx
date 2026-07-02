import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
	ArrowLeft,
	CalendarDays,
	ImageIcon,
	Loader2,
	Save,
	UploadCloud,
	X,
} from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import StacksEditorWrapper, {
	type StacksEditorHandle,
} from "@/components/ui/StacksEditorWrapper";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import departmentService from "@/services/department.service";
import eventService from "@/services/event.service";
import userService from "@/services/user.service";
import type { ApiErrorResponse } from "@/types/api.types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DepartmentOption {
	id: number;
	name: string;
}

interface UserOption {
	id: number;
	full_name: string;
	email: string;
}

type FormState = {
	title: string;
	description: string;
	location: string;
	feedback_form_url: string;
	start_at: string;
	end_at: string;
	registration_start_at: string;
	registration_end_at: string;
	max_attendees: string;
	is_members_only: boolean;
	department_id: string;
	organizer_id: string;
};

type FieldErrors = Partial<
	Record<keyof FormState | "content" | "thumbnail", string>
>;

// ISO (UTC) → giá trị cho input datetime-local theo giờ địa phương
function toLocalInputValue(iso: string | null): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

function EventEditPage() {
	useBreadcrumb([
		{ title: "Dashboard", link: "/" },
		{ title: "Quản lý sự kiện", link: "/events" },
		{ title: "Chỉnh sửa sự kiện" },
	]);

	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();

	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState<FormState | null>(null);
	const [initialContent, setInitialContent] = useState("");
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [submitting, setSubmitting] = useState(false);

	// Editor
	const editorRef = useRef<StacksEditorHandle>(null);

	// Departments
	const [departments, setDepartments] = useState<DepartmentOption[]>([]);
	const [departmentsLoading, setDepartmentsLoading] = useState(true);

	// Organizer (người phụ trách)
	const [users, setUsers] = useState<UserOption[]>([]);
	const [usersLoading, setUsersLoading] = useState(true);

	// Thumbnail
	const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	// ── Load event + departments ──
	useEffect(() => {
		if (!id) return;
		let cancelled = false;

		eventService.getEvent(id).then((res) => {
			if (cancelled) return;
			const e = res.data;
			setForm({
				title: e.title,
				description: e.description ?? "",
				location: e.location ?? "",
				feedback_form_url: e.feedback_form_url ?? "",
				start_at: toLocalInputValue(e.start_at),
				end_at: toLocalInputValue(e.end_at),
				registration_start_at: toLocalInputValue(e.registration_start_at),
				registration_end_at: toLocalInputValue(e.registration_end_at),
				max_attendees: e.max_attendees ? String(e.max_attendees) : "",
				is_members_only: e.is_members_only,
				department_id: e.department ? String(e.department.id) : "none",
				organizer_id: e.organizer ? String(e.organizer.id) : "",
			});
			setInitialContent(e.content ?? "");
			setExistingThumbnail(e.thumbnail);
		}).catch(() => {
			if (cancelled) return;
			toast.error("Không thể tải thông tin sự kiện.");
			navigate("/events");
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});

		return () => { cancelled = true; };
	}, [id, navigate]);

	useEffect(() => {
		departmentService
			.getDepartments({ per_page: 100 })
			.then((res) => setDepartments(res.data.map((d) => ({ id: d.id, name: d.name }))))
			.catch(() => toast.error("Không thể tải danh sách ban."))
			.finally(() => setDepartmentsLoading(false));
	}, []);

	// Chỉ hiển thị thành viên câu lạc bộ: có bất kỳ vai trò nào ngoài "user" thường.
	useEffect(() => {
		userService
			.getUsers({ per_page: 100, sort: "full_name", order: "asc" })
			.then((res) =>
				setUsers(
					res.data
						.filter((u) => u.roles.some((r) => r.name !== "user"))
						.map((u) => ({ id: u.id, full_name: u.full_name, email: u.email })),
				),
			)
			.catch(() => toast.error("Không thể tải danh sách người dùng."))
			.finally(() => setUsersLoading(false));
	}, []);

	// ── Image preview ──
	useEffect(() => {
		if (!imageFile) { setImagePreview(null); return; }
		const url = URL.createObjectURL(imageFile);
		setImagePreview(url);
		return () => URL.revokeObjectURL(url);
	}, [imageFile]);

	const userOptions = useMemo(
		() =>
			users.map((u) => ({
				value: String(u.id),
				label: `${u.full_name} (${u.email})`,
				keywords: [u.full_name, u.email],
			})),
		[users],
	);

	// ── Helpers ──
	const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
		setForm((prev) => (prev ? { ...prev, [key]: val } : prev));
		setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
	};

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
		if (!form) return false;
		const errors: FieldErrors = {};
		if (!form.title.trim()) errors.title = "Vui lòng nhập tên sự kiện.";
		if (!form.start_at) errors.start_at = "Vui lòng chọn thời gian bắt đầu.";
		if (!form.end_at) errors.end_at = "Vui lòng chọn thời gian kết thúc.";
		if (form.start_at && form.end_at && new Date(form.end_at) <= new Date(form.start_at)) {
			errors.end_at = "Thời gian kết thúc phải sau thời gian bắt đầu.";
		}
		if (
			form.registration_start_at &&
			form.registration_end_at &&
			new Date(form.registration_end_at) <= new Date(form.registration_start_at)
		) {
			errors.registration_end_at = "Thời gian đóng đăng ký phải sau thời gian mở đăng ký.";
		}
		if (form.max_attendees && Number(form.max_attendees) < 1) {
			errors.max_attendees = "Số lượng tối đa phải lớn hơn 0.";
		}
		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// ── Submit ──
	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!form || !id || !validate()) return;

		const content = editorRef.current?.getContent()?.trim() ?? "";

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("title", form.title.trim());
			// datetime-local không kèm timezone — gửi ISO (UTC) vì backend lưu giờ UTC
			formData.append("start_at", new Date(form.start_at).toISOString());
			formData.append("end_at", new Date(form.end_at).toISOString());
			formData.append("is_members_only", form.is_members_only ? "1" : "0");
			// Chuỗi rỗng được Laravel chuyển thành null — dùng để xóa giá trị cũ
			formData.append("description", form.description.trim());
			formData.append("content", content);
			formData.append("location", form.location.trim());
			// Chuỗi rỗng → null (xóa link form góp ý cũ)
			formData.append("feedback_form_url", form.feedback_form_url.trim());
			formData.append("max_attendees", form.max_attendees);
			// Chuỗi rỗng → null (xóa giới hạn thời gian đăng ký cũ)
			formData.append(
				"registration_start_at",
				form.registration_start_at ? new Date(form.registration_start_at).toISOString() : "",
			);
			formData.append(
				"registration_end_at",
				form.registration_end_at ? new Date(form.registration_end_at).toISOString() : "",
			);
			formData.append("department_id", form.department_id === "none" ? "" : form.department_id);
			// Chuỗi rỗng → null (bỏ người phụ trách)
			formData.append("organizer_id", form.organizer_id);
			if (imageFile) formData.append("thumbnail", imageFile);

			await eventService.updateEvent(id, formData);
			toast.success("Cập nhật sự kiện thành công.", { position: "top-right" });
			navigate("/events");
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

	if (loading || !form) {
		return (
			<div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
				<Skeleton className="h-9 w-28" />
				<div className="grid gap-6 lg:grid-cols-3">
					<div className="flex flex-col gap-6 lg:col-span-2">
						<Skeleton className="h-64 w-full rounded-xl" />
						<Skeleton className="h-64 w-full rounded-xl" />
					</div>
					<div className="flex flex-col gap-6">
						<Skeleton className="h-40 w-full rounded-xl" />
						<Skeleton className="h-32 w-full rounded-xl" />
					</div>
				</div>
			</div>
		);
	}

	const thumbnailPreview = imagePreview ?? existingThumbnail;

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
			{/* Back */}
			<Button asChild variant="outline" className="w-fit">
				<Link to="/events">
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
								<CardTitle>Chỉnh sửa sự kiện</CardTitle>
								<CardDescription>
									Tên, mô tả ngắn và địa điểm tổ chức sự kiện.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-5">

								{/* Title */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="event-title">
										Tên sự kiện <span className="text-destructive">*</span>
									</Label>
									<Input
										id="event-title"
										placeholder="Nhập tên sự kiện..."
										value={form.title}
										onChange={(e) => setField("title", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.title && (
										<p className="text-sm text-destructive">{fieldErrors.title}</p>
									)}
								</div>

								{/* Description */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="event-description">Mô tả ngắn</Label>
									<Textarea
										id="event-description"
										placeholder="Mô tả ngắn về sự kiện (hiển thị ở trang danh sách sự kiện)..."
										value={form.description}
										onChange={(e) => setField("description", e.target.value)}
										disabled={submitting}
										rows={3}
										className="resize-none"
									/>
									{fieldErrors.description && (
										<p className="text-sm text-destructive">{fieldErrors.description}</p>
									)}
								</div>

								{/* Location */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="event-location">Địa điểm</Label>
									<Input
										id="event-location"
										placeholder="VD: Phòng A305, Trường Cao đẳng Kỹ thuật Cao Thắng..."
										value={form.location}
										onChange={(e) => setField("location", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.location && (
										<p className="text-sm text-destructive">{fieldErrors.location}</p>
									)}
								</div>

								{/* Feedback form URL */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="event-feedback-form-url">Link form góp ý</Label>
									<Input
										id="event-feedback-form-url"
										type="url"
										placeholder="VD: https://docs.google.com/forms/..."
										value={form.feedback_form_url}
										onChange={(e) => setField("feedback_form_url", e.target.value)}
										disabled={submitting}
									/>
									<p className="text-xs text-muted-foreground">
										Link Google Form/Docs để người tham gia góp ý. Khi có link, nút góp ý sẽ hiển thị ở trang chi tiết sự kiện.
									</p>
									{fieldErrors.feedback_form_url && (
										<p className="text-sm text-destructive">{fieldErrors.feedback_form_url}</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Thời gian & đăng ký */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CalendarDays className="h-5 w-5 text-muted-foreground" />
									Thời gian & đăng ký
								</CardTitle>
								<CardDescription>
									Thời gian diễn ra và cấu hình đăng ký tham gia sự kiện.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-col gap-5">

								<div className="grid gap-5 sm:grid-cols-2">
									{/* Start */}
									<div className="flex flex-col gap-2">
										<Label htmlFor="event-start">
											Bắt đầu <span className="text-destructive">*</span>
										</Label>
										<Input
											id="event-start"
											type="datetime-local"
											value={form.start_at}
											onChange={(e) => setField("start_at", e.target.value)}
											disabled={submitting}
										/>
										{fieldErrors.start_at && (
											<p className="text-sm text-destructive">{fieldErrors.start_at}</p>
										)}
									</div>

									{/* End */}
									<div className="flex flex-col gap-2">
										<Label htmlFor="event-end">
											Kết thúc <span className="text-destructive">*</span>
										</Label>
										<Input
											id="event-end"
											type="datetime-local"
											value={form.end_at}
											onChange={(e) => setField("end_at", e.target.value)}
											disabled={submitting}
										/>
										{fieldErrors.end_at && (
											<p className="text-sm text-destructive">{fieldErrors.end_at}</p>
										)}
									</div>
								</div>

								{/* Members only */}
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<Label htmlFor="event-members-only">Yêu cầu thành viên CLB</Label>
										<p className="text-xs text-muted-foreground">
											Khi bật, chỉ thành viên câu lạc bộ mới được đăng ký tham gia sự kiện.
										</p>
									</div>
									<Switch
										id="event-members-only"
										checked={form.is_members_only}
										onCheckedChange={(c) => setField("is_members_only", c)}
										disabled={submitting}
									/>
								</div>

								{/* Registration window */}
								<div className="grid gap-5 sm:grid-cols-2">
									<div className="flex flex-col gap-2">
										<Label htmlFor="event-registration-start">Mở đăng ký</Label>
										<Input
											id="event-registration-start"
											type="datetime-local"
											value={form.registration_start_at}
											onChange={(e) => setField("registration_start_at", e.target.value)}
											disabled={submitting}
										/>
										<p className="text-xs text-muted-foreground">
											Để trống nếu mở đăng ký ngay khi đăng sự kiện.
										</p>
										{fieldErrors.registration_start_at && (
											<p className="text-sm text-destructive">{fieldErrors.registration_start_at}</p>
										)}
									</div>

									<div className="flex flex-col gap-2">
										<Label htmlFor="event-registration-end">Đóng đăng ký</Label>
										<Input
											id="event-registration-end"
											type="datetime-local"
											value={form.registration_end_at}
											onChange={(e) => setField("registration_end_at", e.target.value)}
											disabled={submitting}
										/>
										<p className="text-xs text-muted-foreground">
											Để trống nếu nhận đăng ký đến khi sự kiện bắt đầu.
										</p>
										{fieldErrors.registration_end_at && (
											<p className="text-sm text-destructive">{fieldErrors.registration_end_at}</p>
										)}
									</div>
								</div>

								{/* Max attendees */}
								<div className="flex flex-col gap-2">
									<Label htmlFor="event-max-attendees">Số người tham gia tối đa</Label>
									<Input
										id="event-max-attendees"
										type="number"
										min={1}
										placeholder="Để trống nếu không giới hạn"
										value={form.max_attendees}
										onChange={(e) => setField("max_attendees", e.target.value)}
										disabled={submitting}
									/>
									{fieldErrors.max_attendees && (
										<p className="text-sm text-destructive">{fieldErrors.max_attendees}</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Nội dung chi tiết — StacksEditor */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Nội dung chi tiết</CardTitle>
								<CardDescription>
									Nội dung đầy đủ của sự kiện với editor hỗ trợ Markdown và Rich text (tuỳ chọn).
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div
									className="overflow-hidden rounded-md border bg-background"
									onClick={() => editorRef.current?.focus()}
									style={{ cursor: "text" }}>
									<StacksEditorWrapper
										ref={editorRef}
										initialContent={initialContent}
										placeholder="Mô tả chi tiết về chương trình, nội dung sự kiện..."
									/>
								</div>
								{fieldErrors.content && (
									<p className="mt-2 text-sm text-destructive">{fieldErrors.content}</p>
								)}
							</CardContent>
						</Card>

						{/* Ảnh thumbnail */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ImageIcon className="h-5 w-5 text-muted-foreground" />
									Ảnh sự kiện
								</CardTitle>
								<CardDescription>
									Ảnh thumbnail hiển thị ở trang danh sách và trang chi tiết sự kiện (tuỳ chọn).
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
									aria-label="Tải ảnh sự kiện"
									className="group relative flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:border-muted-foreground/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
									{thumbnailPreview ? (
										<div className="w-full space-y-3">
											<div className="mx-auto max-w-sm overflow-hidden rounded-lg border bg-background shadow-sm">
												<div className="relative aspect-video w-full bg-muted">
													<img
														src={thumbnailPreview}
														alt="Preview"
														className="h-full w-full object-cover"
													/>
												</div>
												<div className="flex items-center justify-between border-t px-3 py-2">
													<p className="truncate text-xs text-muted-foreground">
														{imageFile ? imageFile.name : "Ảnh hiện tại"}
													</p>
													{imageFile && (
														<button
															type="button"
															onClick={removeImage}
															aria-label="Bỏ ảnh mới chọn"
															className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
															<X className="h-3.5 w-3.5" />
														</button>
													)}
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
												Hỗ trợ PNG, JPG, WebP, tối đa 5MB (khuyến nghị 1200×630px)
											</p>
										</>
									)}
								</div>
								{fieldErrors.thumbnail && (
									<p className="mt-2 text-sm text-destructive">{fieldErrors.thumbnail}</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* ── Sidebar ── */}
					<div className="flex flex-col gap-6">

						{/* Ban tổ chức */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Ban tổ chức</CardTitle>
								<CardDescription>Ban phụ trách tổ chức sự kiện (tuỳ chọn).</CardDescription>
							</CardHeader>
							<CardContent>
								{departmentsLoading ? (
									<p className="text-sm text-muted-foreground">Đang tải danh sách ban...</p>
								) : (
									<Select
										value={form.department_id}
										onValueChange={(v) => setField("department_id", v)}
										disabled={submitting}>
										<SelectTrigger id="event-department" className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Không thuộc ban nào</SelectItem>
											{departments.map((d) => (
												<SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
								{fieldErrors.department_id && (
									<p className="mt-2 text-sm text-destructive">{fieldErrors.department_id}</p>
								)}
							</CardContent>
						</Card>

						{/* Người phụ trách */}
						<Card className="shadow-sm">
							<CardHeader>
								<CardTitle>Người phụ trách</CardTitle>
								<CardDescription>Người chịu trách nhiệm chính cho sự kiện (tuỳ chọn).</CardDescription>
							</CardHeader>
							<CardContent>
								<Combobox
									triggerId="event-organizer"
									value={form.organizer_id}
									onValueChange={(v) => setField("organizer_id", v)}
									options={userOptions}
									placeholder={usersLoading ? "Đang tải..." : "Chọn người phụ trách"}
									searchPlaceholder="Tìm người dùng..."
									disabled={usersLoading || submitting}
								/>
								{fieldErrors.organizer_id && (
									<p className="mt-2 text-sm text-destructive">{fieldErrors.organizer_id}</p>
								)}
							</CardContent>
						</Card>

						{/* Actions */}
						<Card className="shadow-sm">
							<CardFooter className="flex flex-col gap-3 pt-6">
								<Button type="submit" className="w-full" disabled={submitting}>
									{submitting
										? <Loader2 className="h-4 w-4 animate-spin" />
										: <Save className="h-4 w-4" />}
									{submitting ? "Đang lưu..." : "Lưu thay đổi"}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() => navigate("/events")}
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

export default EventEditPage;
