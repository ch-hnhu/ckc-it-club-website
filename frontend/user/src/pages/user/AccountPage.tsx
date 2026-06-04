import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import {
	Camera,
	Check,
	Copy,
	Eye,
	EyeOff,
	Github,
	Globe,
	Info,
	Instagram,
	KeyRound,
	Loader2,
	Settings,
	Trash2,
	User,
	X,
	Youtube,
} from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "@/services/auth.service";
import { clearAccessToken } from "@/services/auth.service";
import { api } from "@/services/api.service";
import { buildAvatar } from "@/lib/utils";
import type { ApiResponse } from "@/types/api.types";
import type { UserProfile } from "@/types/user.types";
import NeoSelect, { type NeoSelectOption } from "@/components/ui/NeoSelect";
import NeoDatePicker from "@/components/ui/NeoDatePicker";

// ─── Academic types ───────────────────────────────────────────────────────────

interface AcademicItem {
	id: number;
	label: string;
	value: string;
}

interface MajorItem extends AcademicItem {
	faculty_id: number;
}

interface ClassItem extends AcademicItem {
	major_id: number;
}

interface SkillItem {
	id: number;
	name: string;
	slug: string;
}

// ─── Tab IDs ─────────────────────────────────────────────────────────────────

type TabId = "profile" | "settings";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
	{ id: "profile", label: "Hồ sơ", icon: User },
	{ id: "settings", label: "Cài đặt", icon: Settings },
];

const GENDER_OPTIONS: NeoSelectOption[] = [
	{ value: "Nam", label: "Nam" },
	{ value: "Nữ", label: "Nữ" },
	{ value: "Khác", label: "Khác" },
];

// ─── Input Field ─────────────────────────────────────────────────────────────

interface InputFieldProps {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	prefix?: string;
	type?: string;
	required?: boolean;
	disabled?: boolean;
	hint?: React.ReactNode;
	rightElement?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
	label,
	value,
	onChange,
	placeholder,
	prefix,
	type = "text",
	required,
	disabled,
	hint,
	rightElement,
}) => (
	<div>
		<label className='mb-1.5 block text-sm font-bold text-black'>
			{label}
			{required && <span className='ml-0.5 text-red-500'>*</span>}
		</label>
		<div className='relative flex items-center'>
			{prefix && (
				<span className='absolute left-3 select-none text-sm text-gray-400'>{prefix}</span>
			)}
			<input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				className={`h-[3.25rem] w-full rounded-xl border-2 px-4 text-sm font-medium outline-none transition ${
					disabled
						? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 select-all"
						: "border-black bg-white text-black placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]"
				} ${prefix ? "pl-[calc(0.75rem+var(--prefix-width,3.5rem))]" : ""}`}
				style={prefix ? { paddingLeft: `${prefix.length * 7.5 + 16}px` } : undefined}
			/>
			{rightElement && <div className='absolute right-3'>{rightElement}</div>}
		</div>
		{hint && <div className='mt-1'>{hint}</div>}
	</div>
);

// ─── Social Input ─────────────────────────────────────────────────────────────

interface SocialInputProps {
	label: string;
	value: string;
	onChange: (v: string) => void;
	prefix: string;
	icon: React.ReactNode;
	placeholder?: string;
}

const SocialInput: React.FC<SocialInputProps> = ({
	label,
	value,
	onChange,
	prefix,
	icon,
	placeholder = "username",
}) => (
	<div>
		<label className='mb-1.5 block text-sm font-bold text-black'>{label}</label>
		<div className='flex items-center overflow-hidden rounded-xl border-2 border-black bg-white transition focus-within:shadow-[0_0_0_3px_#A3E635]'>
			<div className='flex h-full items-center gap-2 px-3 pr-0 py-2.5'>
				<span className='text-black [&>svg]:h-4 [&>svg]:w-4'>{icon}</span>
				<span className='text-sm font-medium text-black'>{prefix}</span>
			</div>
			<input
				type='text'
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className='w-full bg-transparent pr-3 py-2.5 text-sm font-medium text-black outline-none placeholder:text-gray-400'
			/>
		</div>
	</div>
);

// ─── Profile Tab ──────────────────────────────────────────────────────────────

interface ProfileTabProps {
	user: AuthUser;
	profile: UserProfile | null;
	onSaved: () => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ user, profile, onSaved }) => {
	const avatarInputRef = useRef<HTMLInputElement>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);

	const [form, setForm] = useState({
		full_name: "",
		username: "",
		bio: "",
		student_code: "",
		faculty_id: "",
		major_id: "",
		class_id: "",
		gender: "",
		date_of_birth: "",
		social_github: "",
		social_linkedin: "",
		social_instagram: "",
		social_youtube: "",
		social_tiktok: "",
	});
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [coverPreview, setCoverPreview] = useState<string | null>(null);
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [saving, setSaving] = useState(false);

	// ── Skills from API ──
	const [availableSkills, setAvailableSkills] = useState<SkillItem[]>([]);

	// ── Academic data ──
	const [allFaculties, setAllFaculties] = useState<AcademicItem[]>([]);
	const [allMajors, setAllMajors] = useState<MajorItem[]>([]);
	const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
	const [loadingAcademic, setLoadingAcademic] = useState(true);

	useEffect(() => {
		const fetchStatic = async () => {
			try {
				const [facRes, majRes, clsRes, skillsRes] = await Promise.all([
					api.get<{ data: AcademicItem[] }>("/academic/faculties"),
					api.get<{ data: MajorItem[] }>("/academic/majors"),
					api.get<{ data: ClassItem[] }>("/academic/school-classes"),
					api.get<{ data: SkillItem[] }>("/users/skills"),
				]);
				setAllFaculties(facRes.data ?? []);
				setAllMajors(majRes.data ?? []);
				setAllClasses(clsRes.data ?? []);
				setAvailableSkills(skillsRes.data ?? []);
			} catch {
				// dropdowns empty on error — user can still save
			} finally {
				setLoadingAcademic(false);
			}
		};
		fetchStatic();
	}, []);

	const [usernameStatus, setUsernameStatus] = useState<
		"idle" | "checking" | "available" | "taken" | "invalid"
	>("idle");
	const usernameTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Populate form when profile loads
	useEffect(() => {
		if (!profile) return;
		setForm({
			full_name: profile.full_name ?? "",
			username: profile.username ?? "",
			bio: profile.bio ?? "",
			student_code: profile.student_code ?? "",
			faculty_id: profile.faculty_id ? String(profile.faculty_id) : "",
			major_id: profile.major_id ? String(profile.major_id) : "",
			class_id: profile.class_id ? String(profile.class_id) : "",
			gender: profile.gender ?? "",
			date_of_birth: profile.date_of_birth ?? "",
			social_github: profile.social_github ?? "",
			social_linkedin: profile.social_linkedin ?? "",
			social_instagram: profile.social_instagram ?? "",
			social_youtube: profile.social_youtube ?? "",
			social_tiktok: profile.social_tiktok ?? "",
		});
		setSelectedSkills(profile.skills ?? []);
	}, [profile]);

	const avatarSrc =
		avatarPreview ??
		(profile
			? buildAvatar(profile.full_name, profile.avatar)
			: buildAvatar(user.name ?? "", null));

	const coverSrc = coverPreview ?? profile?.cover_image ?? null;

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setCoverFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
		reader.readAsDataURL(file);
	};

	const toggleSkill = (skill: string) => {
		setSelectedSkills((prev) =>
			prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
		);
	};

	const handleUsernameChange = (val: string) => {
		setForm((f) => ({ ...f, username: val }));
		setUsernameStatus("idle");
		if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
		if (!val || val === profile?.username) return;

		if (!/^[a-z0-9_]+$/.test(val)) {
			setUsernameStatus("invalid");
			return;
		}

		setUsernameStatus("checking");
		usernameTimeout.current = setTimeout(async () => {
			try {
				const res = await api.get<{ available: boolean }>("/users/check-username", {
					username: val,
				});
				setUsernameStatus(res.available ? "available" : "taken");
			} catch {
				setUsernameStatus("idle");
			}
		}, 600);
	};

	const isSchoolStudent = profile?.is_school_student ?? false;

	const handleSave = async () => {
		if (usernameStatus === "invalid" || usernameStatus === "taken") {
			toast.error("Vui lòng kiểm tra lại username trước khi lưu.");
			return;
		}
		if (usernameStatus === "checking") {
			toast.error("Đang kiểm tra username, vui lòng chờ.");
			return;
		}

		setSaving(true);
		try {
			const formData = new FormData();
			const academicFields = new Set(["student_code", "faculty_id", "major_id", "class_id"]);
			Object.entries(form).forEach(([k, v]) => {
				// Chỉ gửi academic fields nếu là sinh viên trường
				if (!isSchoolStudent && academicFields.has(k)) return;
				formData.append(k, v);
			});
			// Always sync skills (marker lets backend know to overwrite)
			formData.append("skills_sync", "1");
			selectedSkills.forEach((s) => formData.append("skills[]", s));
			if (avatarFile) formData.append("avatar", avatarFile);
			if (coverFile) formData.append("cover_image", coverFile);

			await api.postForm<ApiResponse<UserProfile>>("/users/profile", formData);
			toast.success("Đã lưu hồ sơ thành công!");
			setAvatarFile(null);
			setCoverFile(null);
			onSaved();
		} catch (err: unknown) {
			const data = (
				err as {
					response?: { data?: { message?: string; errors?: Record<string, string[]> } };
				}
			)?.response?.data;
			const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
			toast.error(
				firstFieldError ?? data?.message ?? "Không thể lưu hồ sơ. Vui lòng thử lại.",
			);
		} finally {
			setSaving(false);
		}
	};

	const setField = (key: keyof typeof form) => (v: string) =>
		setForm((f) => ({ ...f, [key]: v }));

	const handleFacultyChange = (val: string) =>
		setForm((f) => ({ ...f, faculty_id: val, major_id: "", class_id: "" }));

	const handleMajorChange = (val: string) =>
		setForm((f) => ({ ...f, major_id: val, class_id: "" }));

	// ── Derived options ──
	const selectedFaculty = allFaculties.find((f) => String(f.id) === form.faculty_id);
	const selectedMajor = allMajors.find((m) => String(m.id) === form.major_id);

	const facultyOptions: NeoSelectOption[] = allFaculties.map((f) => ({
		value: String(f.id),
		label: f.label,
	}));
	const majorOptions: NeoSelectOption[] = selectedFaculty
		? allMajors
				.filter((m) => m.faculty_id === selectedFaculty.id)
				.map((m) => ({ value: String(m.id), label: m.label }))
		: [];
	const classOptions: NeoSelectOption[] = selectedMajor
		? allClasses
				.filter((c) => c.major_id === selectedMajor.id)
				.map((c) => ({ value: String(c.id), label: c.label }))
		: [];

	return (
		<div className='space-y-6'>
			{/* ── Profile panel ── */}
			<div className='rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111] overflow-hidden'>
				{/* Cover image */}
				<div
					className='group relative h-36 cursor-pointer bg-gray-100 sm:h-44'
					onClick={() => coverInputRef.current?.click()}>
					{coverSrc ? (
						<img src={coverSrc} alt='Cover' className='h-full w-full object-cover' />
					) : (
						<div className='flex h-full items-center justify-center'>
							<span className='text-sm font-medium text-gray-400'>
								Click để thêm ảnh bìa
							</span>
						</div>
					)}
					<div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
						<Camera className='h-5 w-5 text-white' />
						<span className='text-sm font-bold text-white'>Đổi ảnh bìa</span>
					</div>
					<input
						ref={coverInputRef}
						type='file'
						accept='image/*'
						className='hidden'
						onChange={handleCoverChange}
					/>
				</div>

				<div className='p-6'>
					<h1 className='font-heading text-xl font-extrabold text-black'>Hồ sơ</h1>
					<p className='mb-6 mt-1 text-sm text-gray-500'>
						Quản lý thông tin hồ sơ của bạn.
					</p>

					{/* Top row — avatar LEFT, Name + Username + Email RIGHT */}
					<div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
						{/* Avatar */}
						<div className='flex flex-col items-center gap-3 sm:w-52 sm:shrink-0'>
							<div
								className='group relative cursor-pointer'
								onClick={() => avatarInputRef.current?.click()}>
								<img
									src={avatarSrc}
									alt='Avatar'
									className='h-40 w-40 rounded-full border-2 border-black object-cover'
								/>
								<div className='absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100'>
									<Camera className='h-5 w-5 text-white' />
									<span className='text-[11px] font-bold leading-tight text-white'>
										Chỉnh sửa ảnh
									</span>
								</div>
								<input
									ref={avatarInputRef}
									type='file'
									accept='image/*'
									className='hidden'
									onChange={handleAvatarChange}
								/>
							</div>
							<p className='text-center text-xs leading-snug text-gray-500'>
								Tỉ lệ khuyến nghị 1:1
								<br />
								và kích thước tệp &lt; 5 MB.
							</p>
						</div>

						{/* Name + Username + Email */}
						<div className='min-w-0 flex-1 space-y-4'>
							<InputField
								label='Họ và tên'
								value={form.full_name}
								onChange={setField("full_name")}
								placeholder='Nguyễn Văn A'
							/>

							<InputField
								label='Username'
								value={form.username}
								onChange={handleUsernameChange}
								placeholder='ten-nguoi-dung'
								required
								hint={
									usernameStatus === "available" ? (
										<p className='flex items-center gap-1 text-xs font-bold text-green-600'>
											<Check className='h-3.5 w-3.5' />
											Username khả dụng
										</p>
									) : usernameStatus === "taken" ? (
										<p className='text-xs font-bold text-red-500'>
											Username đã được sử dụng
										</p>
									) : usernameStatus === "invalid" ? (
										<p className='text-xs font-bold text-red-500'>
											Username chỉ được chứa chữ thường, số và dấu gạch dưới
										</p>
									) : usernameStatus === "checking" ? (
										<p className='flex items-center gap-1 text-xs text-gray-400'>
											<Loader2 className='h-3 w-3 animate-spin' />
											Đang kiểm tra..
										</p>
									) : null
								}
							/>

							{/* Email — read-only */}
							<div>
								<label className='mb-1.5 block text-sm font-bold text-black'>
									Email
								</label>
								<input
									type='email'
									value={profile?.email ?? user.email ?? ""}
									disabled
									className='h-[3.25rem] w-full cursor-not-allowed rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-400 outline-none select-all'
								/>
							</div>
						</div>
					</div>

					{/* Divider */}
					<div className='my-6 border-t-2 border-dashed border-gray-200' />

					{/* Remaining fields */}
					<div className='space-y-4'>
						{/* Thông tin học vụ — chỉ hiện với sinh viên trường */}
						{isSchoolStudent ? (
							<>
								<InputField
									label='MSSV'
									value={form.student_code}
									onChange={setField("student_code")}
									placeholder='0306231234'
									disabled
								/>

								<div>
									<label className='mb-1.5 block text-sm font-bold text-black'>
										Khoa
									</label>
									<NeoSelect
										options={facultyOptions}
										value={form.faculty_id}
										onChange={handleFacultyChange}
										placeholder={
											loadingAcademic ? "Đang tải..." : "Chọn khoa.."
										}
										emptyMessage='Không tìm thấy khoa nào'
									/>
								</div>

								<div>
									<label className='mb-1.5 block text-sm font-bold text-black'>
										Ngành
									</label>
									<NeoSelect
										options={majorOptions}
										value={form.major_id}
										onChange={handleMajorChange}
										placeholder='Chọn ngành..'
										emptyMessage={
											form.faculty_id
												? "Khoa này chưa có ngành"
												: "Vui lòng chọn khoa trước."
										}
									/>
								</div>

								<div>
									<label className='mb-1.5 block text-sm font-bold text-black'>
										Lớp
									</label>
									<NeoSelect
										options={classOptions}
										value={form.class_id}
										onChange={setField("class_id")}
										placeholder='Chọn lớp..'
										emptyMessage={
											form.major_id
												? "Ngành này chưa có lớp"
												: "Vui lòng chọn ngành trước."
										}
									/>
								</div>
							</>
						) : (
							<div className='rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3'>
								<p className='text-sm font-bold text-gray-500'>
									Thông tin học vụ (MSSV, Khoa, Ngành, Lớp)
								</p>
								<p className='mt-0.5 text-xs text-gray-400'>
									Chỉ dành cho sinh viên đăng nhập bằng email trường{" "}
									<span className='font-semibold text-gray-500'>
										@caothang.edu.vn
									</span>
									.
								</p>
							</div>
						)}

						<div>
							<label className='mb-1.5 block text-sm font-bold text-black'>
								Giới tính
							</label>
							<NeoSelect
								options={GENDER_OPTIONS}
								value={form.gender}
								onChange={setField("gender")}
								placeholder='Chọn giới tính..'
							/>
						</div>

						<div>
							<label className='mb-1.5 block text-sm font-bold text-black'>
								Ngày sinh
							</label>
							<NeoDatePicker
								value={form.date_of_birth}
								onChange={setField("date_of_birth")}
								placeholder='Chọn ngày sinh..'
							/>
						</div>
					</div>

					<div className='mt-4'>
						<label className='mb-1.5 block text-sm font-bold text-black'>
							Giới thiệu
						</label>
						<textarea
							value={form.bio}
							onChange={(e) => setField("bio")(e.target.value)}
							placeholder='Một chút về bản thân bạn..'
							rows={4}
							className='w-full resize-none rounded-xl border-2 border-black bg-white px-3 py-2.5 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					{/* Skills */}
					<div className='mt-6'>
						<h3 className='mb-4 font-heading text-base font-extrabold text-black'>
							Kỹ năng
						</h3>
						{availableSkills.length === 0 ? (
							<div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4'>
								{Array.from({ length: 8 }).map((_, i) => (
									<div
										key={i}
										className='h-10 animate-pulse rounded-xl border-2 border-gray-200 bg-gray-100'
									/>
								))}
							</div>
						) : (
							<div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4'>
								{availableSkills.map((skill) => {
									const checked = selectedSkills.includes(skill.name);
									return (
										<label
											key={skill.id}
											className={`flex cursor-pointer select-none items-center gap-2.5 rounded-xl border-2 border-black px-3 py-2.5 text-sm font-bold transition ${
												checked
													? "bg-[var(--color-primary)]"
													: "bg-white hover:bg-gray-50"
											}`}>
											<div
												className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-black transition ${
													checked ? "bg-black" : "bg-white"
												}`}>
												{checked && (
													<Check className='h-3 w-3 text-white' />
												)}
											</div>
											<input
												type='checkbox'
												className='sr-only'
												checked={checked}
												onChange={() => toggleSkill(skill.name)}
											/>
											{skill.name}
										</label>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ── Social media panel ── */}
			<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
				<h1 className='mb-5 font-heading text-lg font-extrabold text-black'>Mạng xã hội</h1>
				<div className='space-y-4'>
					<SocialInput
						label='GitHub'
						value={form.social_github}
						onChange={setField("social_github")}
						prefix='github.com/'
						icon={<Github />}
					/>
					<SocialInput
						label='LinkedIn'
						value={form.social_linkedin}
						onChange={setField("social_linkedin")}
						prefix='linkedin.com/in/'
						icon={<Globe />}
					/>
					<SocialInput
						label='Instagram'
						value={form.social_instagram}
						onChange={setField("social_instagram")}
						prefix='instagram.com/'
						icon={<Instagram />}
					/>
					<SocialInput
						label='YouTube'
						value={form.social_youtube}
						onChange={setField("social_youtube")}
						prefix='youtube.com/@'
						icon={<Youtube />}
					/>
					<SocialInput
						label='TikTok'
						value={form.social_tiktok}
						onChange={setField("social_tiktok")}
						prefix='tiktok.com/@'
						icon={<Globe />}
					/>
				</div>
			</div>

			{/* ── Save button ── */}
			<div className='flex justify-end pb-4'>
				<button
					onClick={handleSave}
					disabled={saving}
					className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-[3px_3px_0_#111]'>
					{saving && <Loader2 className='h-4 w-4 animate-spin' />}
					Lưu thay đổi
				</button>
			</div>
		</div>
	);
};

// ─── Profile Tab Skeleton ─────────────────────────────────────────────────────

const Bone: React.FC<{ className?: string }> = ({ className = "" }) => (
	<div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
);

const FieldSkeleton: React.FC<{ labelW?: string }> = ({ labelW = "w-16" }) => (
	<div>
		<Bone className={`mb-1.5 h-4 ${labelW}`} />
		<Bone className='h-[3.25rem] w-full rounded-xl' />
	</div>
);

const ProfileTabSkeleton: React.FC = () => (
	<div className='space-y-6'>
		{/* Profile card */}
		<div className='overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
			{/* Cover */}
			<Bone className='h-36 w-full rounded-none sm:h-44' />

			<div className='p-6'>
				<Bone className='h-6 w-14' />
				<Bone className='mb-6 mt-1.5 h-4 w-52 bg-gray-100' />

				<div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
					<div className='flex flex-col items-center gap-3 sm:w-52 sm:shrink-0'>
						<Bone className='h-40 w-40 rounded-full' />
						<Bone className='h-3 w-28 bg-gray-100' />
					</div>
					<div className='min-w-0 flex-1 space-y-4'>
						<FieldSkeleton labelW='w-20' />
						<FieldSkeleton labelW='w-24' />
						<FieldSkeleton labelW='w-12' />
					</div>
				</div>

				<div className='my-6 border-t-2 border-dashed border-gray-200' />

				<div className='space-y-4'>
					{["w-10", "w-8", "w-12", "w-6", "w-16", "w-16"].map((w, i) => (
						<FieldSkeleton key={i} labelW={w} />
					))}
				</div>

				<div className='mt-4'>
					<Bone className='mb-1.5 h-4 w-16' />
					<Bone className='h-[6.5rem] w-full rounded-xl' />
				</div>

				<div className='mt-6'>
					<Bone className='mb-4 h-5 w-14' />
					<div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4'>
						{Array.from({ length: 16 }).map((_, i) => (
							<Bone
								key={i}
								className='h-10 rounded-xl border-2 border-gray-300 bg-gray-100'
							/>
						))}
					</div>
				</div>
			</div>
		</div>

		{/* Social card */}
		<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
			<Bone className='mb-5 h-5 w-28' />
			<div className='space-y-4'>
				{(["w-14", "w-16", "w-20", "w-16", "w-12"] as const).map((w, i) => (
					<FieldSkeleton key={i} labelW={w} />
				))}
			</div>
		</div>

		{/* Save button */}
		<div className='flex justify-end pb-4'>
			<Bone className='h-10 w-36 rounded-xl' />
		</div>
	</div>
);

// ─── Password Input ───────────────────────────────────────────────────────────

const PasswordInput: React.FC<{
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
}> = ({ label, value, onChange, placeholder }) => {
	const [show, setShow] = useState(false);
	return (
		<div>
			<label className='mb-1.5 block text-sm font-bold text-black'>{label}</label>
			<div className='relative'>
				<input
					type={show ? "text" : "password"}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					style={{ fontFamily: "var(--font-body)" }}
					className='w-full rounded-xl border-2 border-black bg-white h-[3.25rem] pl-4 pr-12 text-sm font-medium outline-none transition placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
				/>
				<button
					type='button'
					onClick={() => setShow((s) => !s)}
					tabIndex={-1}
					className='absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-black transition-colors hover:bg-black/5'>
					{show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
				</button>
			</div>
		</div>
	);
};

// ─── Delete Account Modal ─────────────────────────────────────────────────────

const DeleteAccountModal: React.FC<{
	username: string;
	onClose: () => void;
	onConfirm: () => Promise<void>;
}> = ({ username, onClose, onConfirm }) => {
	const [inputVal, setInputVal] = useState("");
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	const matches = inputVal === username;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(username);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const handleConfirm = async () => {
		if (!matches) return;
		setLoading(true);
		try {
			await onConfirm();
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4'>
			<div className='w-full max-w-md rounded-2xl border-2 border-black bg-white p-6 shadow-[6px_6px_0_#111]'>
				<div className='mb-4 flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Trash2 className='h-5 w-5 text-red-600' />
						<h2 className='font-heading text-lg font-extrabold text-black'>
							Xoá tài khoản
						</h2>
					</div>
					<button onClick={onClose} className='text-gray-400 hover:text-black'>
						<X className='h-5 w-5' />
					</button>
				</div>

				<div className='mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3'>
					<p className='text-sm font-bold text-red-700'>
						Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xoá vĩnh
						viễn.
					</p>
				</div>

				<p className='mb-2 text-sm text-gray-600'>
					Xác nhận bằng cách nhập username của bạn bên dưới:
				</p>
				<div className='mb-4 flex items-center overflow-hidden rounded-xl border-2 border-black bg-gray-50'>
					<span className='flex-1 select-all px-4 py-3 font-mono text-sm font-bold text-black'>
						{username}
					</span>
					<button
						type='button'
						onClick={handleCopy}
						className='flex items-center gap-1.5 border-l-2 border-gray-300 px-3 py-3 text-gray-600 transition hover:bg-gray-100 hover:text-black'>
						{copied ? (
							<Check className='h-4 w-4 text-green-600' />
						) : (
							<Copy className='h-4 w-4' />
						)}
					</button>
				</div>

				<input
					type='text'
					value={inputVal}
					onChange={(e) => setInputVal(e.target.value)}
					placeholder='Nhập username'
					className='mb-5 h-[3.25rem] w-full rounded-xl border-2 border-black bg-white px-4 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:shadow-[0_0_0_3px_#fca5a5]'
				/>

				<div className='flex gap-3'>
					<button
						onClick={onClose}
						className='flex-1 rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						Huỷ
					</button>
					<button
						onClick={handleConfirm}
						disabled={!matches || loading}
						className='flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-black bg-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-50 disabled:shadow-[3px_3px_0_#111]'>
						{loading && <Loader2 className='h-4 w-4 animate-spin' />}
						Xoá tài khoản
					</button>
				</div>
			</div>
		</div>
	);
};

// ─── Settings Tab ─────────────────────────────────────────────────────────────

const SettingsTab: React.FC<{
	profile: UserProfile | null;
	user: AuthUser;
	onDeleted: () => Promise<void>;
}> = ({ profile, user, onDeleted }) => {
	const [oldPass, setOldPass] = useState("");
	const [newPass, setNewPass] = useState("");
	const [rePass, setRePass] = useState("");
	const [savingPass, setSavingPass] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);

	const username = profile?.username ?? user.username ?? "";

	const handleChangePassword = async () => {
		if (!oldPass || !newPass || !rePass) {
			toast.error("Vui lòng điền đầy đủ các trường.");
			return;
		}
		if (newPass !== rePass) {
			toast.error("Mật khẩu mới không khớp.");
			return;
		}
		if (newPass.length < 8) {
			toast.error("Mật khẩu mới phải có ít nhất 8 ký tự.");
			return;
		}
		setSavingPass(true);
		try {
			await api.post("/auth/change-password", {
				current_password: oldPass,
				new_password: newPass,
				new_password_confirmation: rePass,
			});
			toast.success("Đổi mật khẩu thành công!");
			setOldPass("");
			setNewPass("");
			setRePass("");
		} catch (err: unknown) {
			const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
			toast.error(data?.message ?? "Không thể đổi mật khẩu. Vui lòng thử lại.");
		} finally {
			setSavingPass(false);
		}
	};

	const handleDeleteAccount = async () => {
		try {
			await api.delete("/users/account");
			toast.success("Tài khoản đã được xoá.");
			await onDeleted();
		} catch (err: unknown) {
			const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
			toast.error(data?.message ?? "Không thể xoá tài khoản. Vui lòng thử lại.");
			throw err;
		}
	};

	const isOAuth = !!user.provider;
	const providerLabel =
		user.provider === "google" ? "Google"
		: user.provider === "github" ? "GitHub"
		: user.provider ?? "";

	return (
		<div className='space-y-6'>
			{/* Change password */}
			<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
				<div className='mb-1 flex items-center gap-2'>
					<KeyRound className='h-5 w-5 text-black' />
					<h1 className='font-heading text-xl font-extrabold text-black'>Đổi mật khẩu</h1>
				</div>
				<p className='mb-6 mt-1 text-sm text-gray-500'>
					Cập nhật mật khẩu để bảo vệ tài khoản.
				</p>

				{isOAuth ? (
					<div className='flex items-start gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4'>
						<Info className='mt-0.5 h-4 w-4 shrink-0 text-gray-400' />
						<p className='text-sm text-gray-500'>
							Tài khoản của bạn đăng nhập qua{" "}
							<span className='font-bold text-gray-700'>{providerLabel}</span>, không thể
							đổi mật khẩu tại đây.
						</p>
					</div>
				) : (
					<>
						<div className='max-w-md space-y-4'>
							<PasswordInput
								label='Mật khẩu hiện tại'
								value={oldPass}
								onChange={setOldPass}
								placeholder='••••••••'
							/>
							<PasswordInput
								label='Mật khẩu mới'
								value={newPass}
								onChange={setNewPass}
								placeholder='••••••••'
							/>
							<PasswordInput
								label='Xác nhận mật khẩu mới'
								value={rePass}
								onChange={setRePass}
								placeholder='••••••••'
							/>
						</div>

						<div className='mt-6 flex max-w-md justify-end'>
							<button
								onClick={handleChangePassword}
								disabled={savingPass}
								className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-[3px_3px_0_#111]'>
								{savingPass && <Loader2 className='h-4 w-4 animate-spin' />}
								Đổi mật khẩu
							</button>
						</div>
					</>
				)}
			</div>

			{/* Danger zone */}
			<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
				<h2 className='mb-1 font-heading text-lg font-extrabold text-black'>
					Vùng nguy hiểm
				</h2>
				<p className='mb-5 text-sm text-gray-500'>
					Sau khi xoá, tài khoản và toàn bộ dữ liệu của bạn sẽ không thể khôi phục.
				</p>
				<button
					onClick={() => setShowDeleteModal(true)}
					className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					<Trash2 className='h-4 w-4' />
					Xoá tài khoản
				</button>
			</div>

			{showDeleteModal && (
				<DeleteAccountModal
					username={username}
					onClose={() => setShowDeleteModal(false)}
					onConfirm={handleDeleteAccount}
				/>
			)}
		</div>
	);
};

// ─── AccountPage ──────────────────────────────────────────────────────────────

const AccountPage: React.FC = () => {
	const { user, loadingUser, refreshUser } = useOutletContext<{
		user: AuthUser | null;
		loadingUser: boolean;
		refreshUser: () => Promise<void>;
	}>();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const tabParam = searchParams.get("tabIndex");
	const activeTabId: TabId =
		(["profile", "settings"] as TabId[])[Number(tabParam ?? 0)] ?? "profile";

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(true);

	const fetchProfile = async () => {
		const res = await api.get<{ data: UserProfile }>("/users/profile");
		setProfile((res as { data: UserProfile }).data);
	};

	useEffect(() => {
		if (loadingUser) return;

		if (!user) {
			navigate("/login", { replace: true });
			return;
		}

		fetchProfile()
			.catch(() => setProfile(null))
			.finally(() => setLoadingProfile(false));
	}, [user, loadingUser, navigate]);

	const setActiveTab = (tab: TabId) => {
		const idx = TABS.findIndex((t) => t.id === tab);
		setSearchParams({ tabIndex: String(idx) }, { replace: true });
	};

	if (loadingUser) return null;
	if (!user) return null;

	return (
		<div className='min-h-screen w-full bg-[var(--color-surface)] pt-16'>
			<div className='neo-container px-4 py-8 md:px-6'>
				<div className='flex flex-col gap-6 lg:flex-row'>
					{/* Sidebar */}
					<aside className='w-full shrink-0 lg:w-56'>
						<nav className='space-y-2 rounded-2xl border-2 border-black bg-white p-2 shadow-[4px_4px_0_#111]'>
							{TABS.map((tab) => {
								const Icon = tab.icon;
								const isActive = activeTabId === tab.id;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
											isActive
												? "border-black bg-[var(--color-primary)] text-black"
												: "border-transparent text-gray-600 hover:bg-gray-100 hover:text-black"
										}`}>
										<Icon className='h-4 w-4 shrink-0' />
										{tab.label}
									</button>
								);
							})}
						</nav>
					</aside>

					{/* Content */}
					<main className='min-w-0 flex-1'>
						{activeTabId === "profile" ? (
							loadingProfile ? (
								<ProfileTabSkeleton />
							) : (
								<ProfileTab
									user={user}
									profile={profile}
									onSaved={async () => {
										await Promise.allSettled([fetchProfile(), refreshUser()]);
									}}
								/>
							)
						) : (
							<SettingsTab
								profile={profile}
								user={user}
								onDeleted={async () => {
									clearAccessToken();
									await refreshUser();
									navigate("/");
								}}
							/>
						)}
					</main>
				</div>
			</div>
		</div>
	);
};

export default AccountPage;
