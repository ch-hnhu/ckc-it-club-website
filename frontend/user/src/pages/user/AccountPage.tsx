import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import {
	Bell,
	Camera,
	Check,
	CreditCard,
	Github,
	Globe,
	Instagram,
	Loader2,
	Settings,
	User,
	Youtube,
} from "lucide-react";
import { toast } from "sonner";
import type { AuthUser } from "@/services/auth.service";
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

type TabId = "profile" | "billing" | "notifications" | "settings";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
	{ id: "profile", label: "Hồ sơ", icon: User },
	{ id: "billing", label: "Thanh toán", icon: CreditCard },
	{ id: "notifications", label: "Thông báo email", icon: Bell },
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
				className={`h-[3.25rem] w-full rounded-xl border-2 border-black bg-white px-4 text-sm font-medium text-black outline-none transition placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635] ${
					prefix ? "pl-[calc(0.75rem+var(--prefix-width,3.5rem))]" : ""
				}`}
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
		"idle" | "checking" | "available" | "taken"
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
		(profile ? buildAvatar(profile.full_name, profile.avatar) : buildAvatar(user.name ?? "", null));

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

	const handleSave = async () => {
		setSaving(true);
		try {
			const formData = new FormData();
			Object.entries(form).forEach(([k, v]) => formData.append(k, v));
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
		} catch {
			toast.error("Không thể lưu hồ sơ. Vui lòng thử lại.");
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
						<img
							src={coverSrc}
							alt='Cover'
							className='h-full w-full object-cover'
						/>
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
					<p className='mb-6 mt-1 text-sm text-gray-500'>Quản lý thông tin hồ sơ của bạn.</p>

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
						<InputField
							label='MSSV'
							value={form.student_code}
							onChange={setField("student_code")}
							placeholder='0306231234'
						/>

						<div>
							<label className='mb-1.5 block text-sm font-bold text-black'>Khoa</label>
							<NeoSelect
								options={facultyOptions}
								value={form.faculty_id}
								onChange={handleFacultyChange}
								placeholder={loadingAcademic ? "Đang tải..." : "Chọn khoa.."}
								emptyMessage='Không tìm thấy khoa nào'
							/>
						</div>

						<div>
							<label className='mb-1.5 block text-sm font-bold text-black'>Ngành</label>
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
							<label className='mb-1.5 block text-sm font-bold text-black'>Lớp</label>
							<NeoSelect
								options={classOptions}
								value={form.class_id}
								onChange={setField("class_id")}
								placeholder='Chọn lớp..'
								emptyMessage={
									form.major_id ? "Ngành này chưa có lớp" : "Vui lòng chọn ngành trước."
								}
							/>
						</div>

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
						<label className='mb-1.5 block text-sm font-bold text-black'>Giới thiệu</label>
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
												checked ? "bg-[var(--color-primary)]" : "bg-white hover:bg-gray-50"
											}`}>
											<div
												className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-black transition ${
													checked ? "bg-black" : "bg-white"
												}`}>
												{checked && <Check className='h-3 w-3 text-white' />}
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
							<Bone key={i} className='h-10 rounded-xl border-2 border-gray-300 bg-gray-100' />
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

// ─── Placeholder tabs ─────────────────────────────────────────────────────────

const TAB_DESCRIPTIONS: Record<string, string> = {
	"Thanh toán": "Quản lý gói thành viên và thanh toán.",
	"Thông báo email": "Tùy chỉnh thông báo qua email.",
	"Cài đặt": "Cài đặt tài khoản và bảo mật.",
};

const ComingSoonTab: React.FC<{ title: string }> = ({ title }) => (
	<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
		<h1 className='font-heading text-xl font-extrabold text-black'>{title}</h1>
		{TAB_DESCRIPTIONS[title] && (
			<p className='mb-6 mt-1 text-sm text-gray-500'>{TAB_DESCRIPTIONS[title]}</p>
		)}
		<div className='rounded-xl border-2 border-dashed border-gray-200 px-6 py-16 text-center'>
			<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-black bg-[var(--color-pastel-yellow)] text-2xl shadow-[4px_4px_0_#111]'>
				🚧
			</div>
			<p className='font-heading text-base font-extrabold text-black'>
				Tính năng này đang được phát triển.
			</p>
		</div>
	</div>
);

// ─── AccountPage ──────────────────────────────────────────────────────────────

const AccountPage: React.FC = () => {
	const { user, loadingUser } = useOutletContext<{
		user: AuthUser | null;
		loadingUser: boolean;
	}>();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const tabParam = searchParams.get("tabIndex");
	const activeTabId: TabId =
		(["profile", "billing", "notifications", "settings"] as TabId[])[Number(tabParam ?? 0)] ??
		"profile";

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
										await fetchProfile().catch(() => {});
									}}
								/>
							)
						) : activeTabId === "billing" ? (
							<ComingSoonTab title='Thanh toán' />
						) : activeTabId === "notifications" ? (
							<ComingSoonTab title='Thông báo email' />
						) : (
							<ComingSoonTab title='Cài đặt' />
						)}
					</main>
				</div>
			</div>
		</div>
	);
};

export default AccountPage;
