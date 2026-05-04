import { type ChangeEvent, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
import roleService from "@/services/role.service";
import schoolClassService from "@/services/school-class.service";
import userService from "@/services/user.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { Faculty } from "@/types/faculty.type";
import type { Major } from "@/types/major.type";
import type { Role } from "@/types/role.type";
import type { SchoolClass } from "@/types/school-class.type";

type CreateUserFormState = {
	full_name: string;
	gender: string;
	email: string;
	password: string;
	student_code: string;
	faculty_id: number | null;
	major_id: number | null;
	class_id: number | null;
	roles: string[];
};

type CreateUserFieldErrorKey = keyof CreateUserFormState | "avatar";
type CreateUserFieldErrors = Partial<Record<CreateUserFieldErrorKey, string>>;

const MAX_SELECT_FETCH_SIZE = 200;
const DEFAULT_AVATAR_SRC = "/img/default-avatar.png";
const GENDER_OPTIONS: ComboboxOption[] = [
	{ value: "male", label: "Nam" },
	{ value: "female", label: "Nữ" },
];

const getInitialFormState = (): CreateUserFormState => ({
	full_name: "",
	gender: "",
	email: "",
	password: "",
	student_code: "",
	faculty_id: null,
	major_id: null,
	class_id: null,
	roles: [],
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
	const [roles, setRoles] = useState<Role[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<CreateUserFieldErrors>({});

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
				const [facultyResponse, majorResponse, classResponse, roleResponse] =
					await Promise.all([
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
						roleService.getRoles(),
					]);

				setFaculties(facultyResponse.data);
				setMajors(majorResponse.data);
				setSchoolClasses(classResponse.data);
				setRoles(roleResponse.data);
			} catch (error) {
				console.error("Không thể tải danh sách khoa/ngành/lớp/vai trò:", error);
				toast.error("Không thể tải danh sách khoa, ngành, lớp, vai trò.", {
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

	const roleOptions = useMemo<ComboboxOption[]>(
		() =>
			roles.map((role) => ({
				value: role.value,
				label: role.label,
			})),
		[roles],
	);

	const updateField =
		(field: "full_name" | "email" | "password" | "student_code") =>
		(event: ChangeEvent<HTMLInputElement>) => {
			setFieldErrors((prev) => {
				if (!prev[field]) {
					return prev;
				}

				const next = { ...prev };
				delete next[field];
				return next;
			});
			setForm((prev) => ({ ...prev, [field]: event.target.value }));
		};

	const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		if (!file.type.startsWith("image/")) {
			setFieldErrors((prev) => ({
				...prev,
				avatar: "Vui lòng chọn file ảnh hợp lệ.",
			}));
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
		setFieldErrors((prev) => {
			if (!prev.avatar) {
				return prev;
			}

			const next = { ...prev };
			delete next.avatar;
			return next;
		});
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
		setFieldErrors({});
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const clientValidationErrors: CreateUserFieldErrors = {};
		if (!form.full_name.trim()) clientValidationErrors.full_name = "Vui lòng nhập họ và tên.";
		if (!form.email.trim()) clientValidationErrors.email = "Vui lòng nhập email.";
		if (!form.password.trim()) clientValidationErrors.password = "Vui lòng nhập mật khẩu.";
		if (form.roles.length === 0) clientValidationErrors.roles = "Vui lòng chọn vai trò.";

		if (Object.keys(clientValidationErrors).length > 0) {
			setFieldErrors(clientValidationErrors);
			return;
		}

		setFieldErrors({});

		setSubmitting(true);
		try {
			const payload = new FormData();
			payload.append("full_name", form.full_name.trim());
			payload.append("gender", form.gender);
			payload.append("email", form.email.trim());
			payload.append("password", form.password);
			payload.append("password_confirmation", form.password);
			payload.append("student_code", form.student_code.trim());
			payload.append("faculty_id", String(form.faculty_id));
			payload.append("major_id", String(form.major_id));
			payload.append("class_id", String(form.class_id));
			form.roles.forEach((role) => {
				payload.append("roles[]", role);
			});

			if (avatarFile) {
				payload.append("avatar", avatarFile);
			}

			await userService.createUser(payload);
			toast.success("Tạo người dùng thành công.", {
				position: "top-right",
			});
			navigate("/users");
		} catch (error) {
			const axiosError = error as AxiosError<ApiErrorResponse>;
			const responseData = axiosError.response?.data;

			if (responseData?.errors) {
				const serverFieldErrors: CreateUserFieldErrors = {};

				Object.entries(responseData.errors).forEach(([key, messages]) => {
					if (messages.length === 0) {
						return;
					}

					const normalizedKey = key.startsWith("roles.") ? "roles" : key;
					if (normalizedKey in form || normalizedKey === "avatar") {
						serverFieldErrors[normalizedKey as CreateUserFieldErrorKey] = messages[0];
					}
				});

				if (Object.keys(serverFieldErrors).length > 0) {
					setFieldErrors(serverFieldErrors);
					return;
				}
			}

			toast.error(responseData?.message ?? "Không thể tạo người dùng.", {
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
								{fieldErrors.avatar ? (
									<p className='text-sm text-destructive'>{fieldErrors.avatar}</p>
								) : null}
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
								<div className='space-y-2'>
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
									{fieldErrors.full_name ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.full_name}
										</p>
									) : null}
								</div>

								<div className='space-y-2'>
									<Label>Giới tính</Label>
									<Combobox
										value={form.gender}
										onValueChange={(value) => {
											setForm((prev) => ({
												...prev,
												gender: value,
											}));
											setFieldErrors((prev) => {
												const next = { ...prev };
												delete next.gender;
												return next;
											});
										}}
										options={GENDER_OPTIONS}
										searchable={false}
										placeholder='Chọn giới tính'
										disabled={loadingOptions}
									/>
									{fieldErrors.gender ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.gender}
										</p>
									) : null}
								</div>

								<div className='space-y-2'>
									<Label htmlFor='student_code'>Mã sinh viên</Label>
									<Input
										id='student_code'
										placeholder='0306123456'
										value={form.student_code}
										onChange={updateField("student_code")}
										required
									/>
									{fieldErrors.student_code ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.student_code}
										</p>
									) : null}
								</div>

								<div className='space-y-2'>
									<Label>
										Vai trò <span className='text-red-500'>*</span>
									</Label>
									<Combobox
										value={form.roles}
										onValueChange={(value) => {
											setForm((prev) => ({
												...prev,
												roles: value,
											}));
											setFieldErrors((prev) => {
												const next = { ...prev };
												delete next.roles;
												return next;
											});
										}}
										options={roleOptions}
										placeholder='Chọn vai trò'
										searchPlaceholder='Tìm vai trò...'
										disabled={loadingOptions || roleOptions.length === 0}
										multiple={true}
									/>
									{fieldErrors.roles ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.roles}
										</p>
									) : null}
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
									{fieldErrors.email ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.email}
										</p>
									) : null}
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
									{fieldErrors.password ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.password}
										</p>
									) : null}
								</div>
							</div>

							<Separator />

							<div className='grid gap-4 md:grid-cols-3'>
								<div className='space-y-2'>
									<Label>Khoa</Label>
									<Combobox
										value={form.faculty_id ? String(form.faculty_id) : ""}
										onValueChange={(value) => {
											setForm((prev) => ({
												...prev,
												faculty_id: value ? Number(value) : null,
												major_id: null,
												class_id: null,
											}));
											setFieldErrors((prev) => {
												const next = { ...prev };
												delete next.faculty_id;
												delete next.major_id;
												delete next.class_id;
												return next;
											});
										}}
										options={facultyOptions}
										placeholder='Chọn khoa'
										searchPlaceholder='Tìm khoa...'
										disabled={loadingOptions}
									/>
									{fieldErrors.faculty_id ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.faculty_id}
										</p>
									) : null}
								</div>

								<div className='space-y-2'>
									<Label>Ngành</Label>
									<Combobox
										value={form.major_id ? String(form.major_id) : ""}
										onValueChange={(value) => {
											setForm((prev) => ({
												...prev,
												major_id: value ? Number(value) : null,
												class_id: null,
											}));
											setFieldErrors((prev) => {
												const next = { ...prev };
												delete next.major_id;
												delete next.class_id;
												return next;
											});
										}}
										options={majorOptions}
										placeholder='Chọn ngành'
										searchPlaceholder='Tìm ngành...'
										disabled={
											loadingOptions ||
											!form.faculty_id ||
											majorOptions.length === 0
										}
									/>
									{fieldErrors.major_id ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.major_id}
										</p>
									) : null}
								</div>

								<div className='space-y-2'>
									<Label>Lớp</Label>
									<Combobox
										value={form.class_id ? String(form.class_id) : ""}
										onValueChange={(value) => {
											setForm((prev) => ({
												...prev,
												class_id: value ? Number(value) : null,
											}));
											setFieldErrors((prev) => {
												if (!prev.class_id) {
													return prev;
												}

												const next = { ...prev };
												delete next.class_id;
												return next;
											});
										}}
										options={classOptions}
										placeholder='Chọn lớp'
										searchPlaceholder='Tìm lớp...'
										disabled={
											loadingOptions ||
											!form.major_id ||
											classOptions.length === 0
										}
									/>
									{fieldErrors.class_id ? (
										<p className='text-sm text-destructive'>
											{fieldErrors.class_id}
										</p>
									) : null}
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
