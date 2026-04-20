import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import facultyService from "@/services/faculty.service";
import majorService from "@/services/major.service";
import schoolClassService from "@/services/school-class.service";
import type { Faculty } from "@/types/faculty.type";
import type { Major } from "@/types/major.type";
import type { SchoolClass } from "@/types/school-class.type";

type CreateUserFormState = {
	full_name: string;
	email: string;
	password: string;
	student_code: string;
	faculty_id: number | null;
	major_id: number | null;
	class_id: number | null;
};

const MAX_SELECT_FETCH_SIZE = 200;
const DEFAULT_AVATAR_SRC = "/img/default-avatar.png";

const getInitialFormState = (): CreateUserFormState => ({
	full_name: "",
	email: "",
	password: "",
	student_code: "",
	faculty_id: null,
	major_id: null,
	class_id: null,
});

function CreateUser() {
	const navigate = useNavigate();
	const avatarInputRef = useRef<HTMLInputElement | null>(null);
	const avatarObjectUrlRef = useRef<string | null>(null);

	const [form, setForm] = useState<CreateUserFormState>(getInitialFormState);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR_SRC);
	const [faculties, setFaculties] = useState<Faculty[]>([]);
	const [majors, setMajors] = useState<Major[]>([]);
	const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const breadcrumb = useMemo(
		() => [
			{ title: "Dashboard", link: "/" },
			{ title: "Quản lý người dùng", link: "/users" },
			{ title: "Tạo người dùng" },
		],
		[],
	);

	useBreadcrumb(breadcrumb);

	useEffect(() => {
		const fetchSelectOptions = async () => {
			setLoadingOptions(true);
			try {
				const [facultyResponse, majorResponse, classResponse] = await Promise.all([
					facultyService.getFaculties({
						per_page: MAX_SELECT_FETCH_SIZE,
						sort: "label",
						order: "asc",
					}),
					majorService.getMajors({
						per_page: MAX_SELECT_FETCH_SIZE,
						sort: "label",
						order: "asc",
					}),
					schoolClassService.getSchoolClasses({
						per_page: MAX_SELECT_FETCH_SIZE,
						sort: "label",
						order: "asc",
					}),
				]);

				setFaculties(facultyResponse.data);
				setMajors(majorResponse.data);
				setSchoolClasses(classResponse.data);
			} catch (error) {
				console.error("Không thể tải danh sách khoa/ngành/lớp:", error);
				toast.error("Không thể tải danh sách khoa, ngành, lớp.", {
					position: "top-right",
				});
			} finally {
				setLoadingOptions(false);
			}
		};

		fetchSelectOptions();
	}, []);

	useEffect(() => {
		return () => {
			if (avatarObjectUrlRef.current) {
				URL.revokeObjectURL(avatarObjectUrlRef.current);
			}
		};
	}, []);

	const filteredMajors = useMemo(() => {
		if (!form.faculty_id) {
			return majors;
		}
		return majors.filter((major) => major.faculty_id === form.faculty_id);
	}, [majors, form.faculty_id]);

	const filteredClasses = useMemo(() => {
		if (!form.major_id) {
			return schoolClasses;
		}
		return schoolClasses.filter((schoolClass) => schoolClass.major_id === form.major_id);
	}, [schoolClasses, form.major_id]);

	const facultyOptions = useMemo<ComboboxOption[]>(
		() =>
			faculties.map((faculty) => ({
				value: String(faculty.id),
				label: faculty.label,
				keywords: [faculty.value],
			})),
		[faculties],
	);

	const majorOptions = useMemo<ComboboxOption[]>(
		() =>
			filteredMajors.map((major) => ({
				value: String(major.id),
				label: major.label,
				keywords: [major.value],
			})),
		[filteredMajors],
	);

	const classOptions = useMemo<ComboboxOption[]>(
		() =>
			filteredClasses.map((schoolClass) => ({
				value: String(schoolClass.id),
				label: schoolClass.label,
				keywords: [schoolClass.value],
			})),
		[filteredClasses],
	);

	const avatarFallback = useMemo(() => {
		const source = form.full_name.trim() || form.email.trim();
		if (!source) {
			return "U";
		}
		const words = source.split(/\s+/).filter(Boolean);
		if (words.length === 1) {
			return words[0].slice(0, 2).toUpperCase();
		}
		return `${words[0][0] ?? ""}${words[words.length - 1][0] ?? ""}`.toUpperCase();
	}, [form.full_name, form.email]);

	const updateField =
		(field: "full_name" | "email" | "password" | "student_code") =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setForm((prev) => ({ ...prev, [field]: event.target.value }));
		};

	const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			toast.error("Vui lòng chọn file ảnh hợp lệ.", { position: "top-right" });
			event.target.value = "";
			return;
		}

		if (avatarObjectUrlRef.current) {
			URL.revokeObjectURL(avatarObjectUrlRef.current);
		}

		const objectUrl = URL.createObjectURL(file);
		avatarObjectUrlRef.current = objectUrl;

		setAvatarPreview(objectUrl);
		setAvatarFile(file);
	};

	const clearAvatar = () => {
		if (avatarObjectUrlRef.current) {
			URL.revokeObjectURL(avatarObjectUrlRef.current);
			avatarObjectUrlRef.current = null;
		}

		setAvatarPreview(DEFAULT_AVATAR_SRC);
		setAvatarFile(null);

		if (avatarInputRef.current) {
			avatarInputRef.current.value = "";
		}
	};

	const resetForm = () => {
		clearAvatar();
		setForm(getInitialFormState());
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const missingFields: string[] = [];
		if (!form.full_name.trim()) missingFields.push("full_name");
		if (!form.email.trim()) missingFields.push("email");
		if (!form.password.trim()) missingFields.push("password");
		if (!form.student_code.trim()) missingFields.push("student_code");
		if (!form.faculty_id) missingFields.push("faculty");
		if (!form.major_id) missingFields.push("major");
		if (!form.class_id) missingFields.push("class");

		if (missingFields.length > 0) {
			toast.error(`Vui lòng nhập đầy đủ: ${missingFields.join(", ")}.`, {
				position: "top-right",
			});
			return;
		}

		setSubmitting(true);
		try {
			const payload = {
				avatar: avatarFile?.name ?? null,
				full_name: form.full_name.trim(),
				email: form.email.trim(),
				password: form.password,
				student_code: form.student_code.trim(),
				faculty_id: form.faculty_id,
				major_id: form.major_id,
				class_id: form.class_id,
			};

			console.log("Create user payload (UI only):", payload);
			toast.success("Đã thu thập dữ liệu tạo user. Form hiện ở chế độ UI-only.", {
				position: "top-right",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className='h-full flex-1 flex-col'>
			<div className='flex flex-wrap items-center justify-between gap-3 p-4 md:p-6 lg:p-8'>
				<div className='space-y-1'>
					<h2 className='text-2xl font-semibold tracking-tight'>Tạo người dùng</h2>
					<p className='text-muted-foreground'>Thêm người dùng mới vào hệ thống.</p>
				</div>
				<Button type='button' variant='outline' onClick={() => navigate("/users")}>
					<ArrowLeft className='h-4 w-4' />
					Quay lại
				</Button>
			</div>

			<form
				onSubmit={handleSubmit}
				className='flex flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0 lg:p-8 lg:pt-0'>
				<div className='grid gap-6 xl:grid-cols-[320px_1fr]'>
					<Card>
						<CardHeader>
							<CardTitle>Ảnh đại diện</CardTitle>
							<CardDescription>Chọn ảnh hiển thị.</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex justify-center'>
								<Avatar className='h-32 w-32 border border-border shadow-sm'>
									{avatarPreview ? (
										<AvatarImage src={avatarPreview} alt='Avatar preview' />
									) : null}
									<AvatarFallback className='text-3xl font-semibold'>
										{avatarFallback}
									</AvatarFallback>
								</Avatar>
							</div>

							<div className='flex flex-col space-y-2 items-center'>
								<div className='flex items-center gap-2'>
									<Input
										id='avatar'
										type='file'
										accept='image/*'
										onChange={handleAvatarChange}
										ref={avatarInputRef}
										className='flex-1 cursor-pointer hidden'
									/>
									<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={() => avatarInputRef.current?.click()}>
										<ImagePlus className='h-4 w-4' />
										Chọn ảnh
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={clearAvatar}
										disabled={!avatarFile}
										className='shrink-0'>
										<Trash2 className='h-4 w-4' />
										Xóa ảnh
									</Button>
								</div>
								<p className='text-xs text-muted-foreground'>
									Hỗ trợ PNG, JPG, WEBP.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Thông tin người dùng</CardTitle>
							<CardDescription>
								Điền đầy đủ thông tin để tạo người dùng mới. Các trường có dấu * là
								bắt buộc.
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='full_name'>
										Họ tên <span className='text-red-500'>*</span>
									</Label>
									<Input
										id='full_name'
										placeholder='Nguyễn Văn A'
										value={form.full_name}
										onChange={updateField("full_name")}
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='email'>
										Email <span className='text-red-500'>*</span>
									</Label>
									<Input
										id='email'
										type='email'
										placeholder='user@caothang.edu.vn'
										value={form.email}
										onChange={updateField("email")}
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='password'>
										Mật khẩu <span className='text-red-500'>*</span>
									</Label>
									<Input
										id='password'
										type='password'
										placeholder='••••••••'
										value={form.password}
										onChange={updateField("password")}
										required
									/>
								</div>

								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='student_code'>Mã sinh viên</Label>
									<Input
										id='student_code'
										placeholder='0306123456'
										value={form.student_code}
										onChange={updateField("student_code")}
										required
									/>
								</div>
							</div>

							<Separator />

							<div className='grid gap-4 md:grid-cols-3'>
								<div className='space-y-2'>
									<Label>Khoa</Label>
									<Combobox
										value={form.faculty_id ? String(form.faculty_id) : ""}
										onValueChange={(value) =>
											setForm((prev) => ({
												...prev,
												faculty_id: value ? Number(value) : null,
												major_id: null,
												class_id: null,
											}))
										}
										options={facultyOptions}
										placeholder='Chọn khoa'
										searchPlaceholder='Tìm khoa...'
										disabled={loadingOptions}
									/>
								</div>

								<div className='space-y-2'>
									<Label>Ngành</Label>
									<Combobox
										value={form.major_id ? String(form.major_id) : ""}
										onValueChange={(value) =>
											setForm((prev) => ({
												...prev,
												major_id: value ? Number(value) : null,
												class_id: null,
											}))
										}
										options={majorOptions}
										placeholder='Chọn ngành'
										searchPlaceholder='Tìm ngành...'
										disabled={
											loadingOptions ||
											!form.faculty_id ||
											majorOptions.length === 0
										}
									/>
								</div>

								<div className='space-y-2'>
									<Label>Lớp</Label>
									<Combobox
										value={form.class_id ? String(form.class_id) : ""}
										onValueChange={(value) =>
											setForm((prev) => ({
												...prev,
												class_id: value ? Number(value) : null,
											}))
										}
										options={classOptions}
										placeholder='Chọn lớp'
										searchPlaceholder='Tìm lớp...'
										disabled={
											loadingOptions ||
											!form.major_id ||
											classOptions.length === 0
										}
									/>
								</div>
							</div>
						</CardContent>
						<CardFooter className='flex flex-wrap items-center justify-between gap-2 border-t'>
							<Button
								type='button'
								variant='ghost'
								onClick={resetForm}
								disabled={submitting}>
								Reset
							</Button>
							<div className='flex items-center gap-2'>
								<Button
									type='button'
									variant='outline'
									onClick={() => navigate("/users")}
									disabled={submitting}>
									Hủy
								</Button>
								<Button type='submit' disabled={loadingOptions || submitting}>
									{submitting ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : null}
									Lưu
								</Button>
							</div>
						</CardFooter>
					</Card>
				</div>
			</form>
		</div>
	);
}

export default CreateUser;
