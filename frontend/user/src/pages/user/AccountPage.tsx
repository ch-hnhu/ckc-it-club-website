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

// ─── Constants ───────────────────────────────────────────────────────────────

// ─── Academic types ───────────────────────────────────────────────────────────

interface FacultyItem {
	id: number;
	label: string;
	value: string;
}

interface MajorItem {
	id: number;
	label: string;
	value: string;
	faculty_id: number;
}

interface ClassItem {
	id: number;
	label: string;
	value: string;
	major_id: number;
}

const labelToOpt = (label: string): NeoSelectOption => ({ value: label, label });

const GENDER_OPTIONS: NeoSelectOption[] = [
	{ value: "Nam", label: "Nam" },
	{ value: "Nữ", label: "Nữ" },
	{ value: "Khác", label: "Khác" },
];

const SKILL_OPTIONS = [
	"HTML",
	"CSS",
	"JavaScript",
	"Python",
	"Java",
	"C++",
	"SQL",
	"Command Line",
	"React",
	"Laravel",
	"Node.js",
	"TypeScript",
	"Git & GitHub",
	"Docker",
	"Linux",
	"PHP",
];

// ─── Tab IDs ─────────────────────────────────────────────────────────────────

type TabId = "profile" | "billing" | "notifications" | "settings";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
	{ id: "profile", label: "Hồ sơ", icon: User },
	{ id: "billing", label: "Thanh toán", icon: CreditCard },
	{ id: "notifications", label: "Thông báo email", icon: Bell },
	{ id: "settings", label: "Cài đặt", icon: Settings },
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
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [form, setForm] = useState({
		full_name: "",
		username: "",
		bio: "",
		student_code: "",
		faculty: "",
		major: "",
		class_name: "",
		gender: "",
		github: "",
		twitter: "",
		linkedin: "",
		instagram: "",
		youtube: "",
		twitch: "",
		tiktok: "",
	});
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [saving, setSaving] = useState(false);

	// ── Academic data (fetched once, filtered client-side) ──
	const [allFaculties, setAllFaculties] = useState<FacultyItem[]>([]);
	const [allMajors, setAllMajors] = useState<MajorItem[]>([]);
	const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
	const [loadingAcademic, setLoadingAcademic] = useState(true);

	useEffect(() => {
		const fetchAcademic = async () => {
			try {
				const [facRes, majRes, clsRes] = await Promise.all([
					api.get<{ data: FacultyItem[] }>("/faculties"),
					api.get<{ data: MajorItem[] }>("/majors"),
					api.get<{ data: ClassItem[] }>("/school-classes"),
				]);
				setAllFaculties(facRes.data ?? []);
				setAllMajors(majRes.data ?? []);
				setAllClasses(clsRes.data ?? []);
			} catch {
				// dropdowns trống nếu lỗi — user vẫn có thể save
			} finally {
				setLoadingAcademic(false);
			}
		};
		fetchAcademic();
	}, []);
	const [usernameStatus, setUsernameStatus] = useState<
		"idle" | "checking" | "available" | "taken"
	>("idle");
	const usernameTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!profile) return;
		setForm({
			full_name: profile.full_name ?? "",
			username: profile.username ?? "",
			bio: profile.bio ?? "",
			student_code: profile.student_code ?? "",
			faculty: profile.faculty ?? "",
			major: profile.major ?? "",
			class_name: profile.class_name ?? "",
			gender: profile.gender ?? "",
			github: "",
			twitter: "",
			linkedin: "",
			instagram: "",
			youtube: "",
			twitch: "",
			tiktok: "",
		});
		setSelectedSkills(profile.skills ?? []);
	}, [profile]);

	const avatar =
		avatarPreview ??
		(profile
			? buildAvatar(profile.full_name, profile.avatar)
			: buildAvatar(user.name ?? "", null));

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setAvatarFile(file);
		const reader = new FileReader();
		reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
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
				setUsernameStatus(
					(res as { available: boolean }).available ? "available" : "taken",
				);
			} catch {
				setUsernameStatus("idle");
			}
		}, 600);
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const formData = new FormData();
			Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
			selectedSkills.forEach((s) => formData.append("skills[]", s));
			if (avatarFile) formData.append("avatar", avatarFile);

			await api.postForm<ApiResponse<UserProfile>>("/users/profile", formData);
			toast.success("Đã lưu hồ sơ thành công!");
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
		setForm((f) => ({ ...f, faculty: val, major: "", class_name: "" }));

	const handleMajorChange = (val: string) =>
		setForm((f) => ({ ...f, major: val, class_name: "" }));

	// ── Derived options từ data đã fetch ──
	const selectedFaculty = allFaculties.find((f) => f.label === form.faculty);
	const selectedMajor = allMajors.find((m) => m.label === form.major);

	const facultyOptions = allFaculties.map((f) => labelToOpt(f.label));
	const majorOptions = selectedFaculty
		? allMajors.filter((m) => m.faculty_id === selectedFaculty.id).map((m) => labelToOpt(m.label))
		: [];
	const classOptions = selectedMajor
		? allClasses.filter((c) => c.major_id === selectedMajor.id).map((c) => labelToOpt(c.label))
		: [];

	return (
		<div className='space-y-6'>
			{/* ── ONE Profile panel: avatar + all fields ── */}
			<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
				<h1 className='font-heading text-xl font-extrabold text-black'>Hồ sơ</h1>
				<p className='mb-6 mt-1 text-sm text-gray-500'>Quản lý thông tin hồ sơ của bạn.</p>

				{/* Top row — avatar LEFT, Name + Username + Email RIGHT */}
				<div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
					{/* Avatar column — larger */}
					<div className='flex flex-col items-center gap-3 sm:w-52 sm:shrink-0'>
						<div
							className='group relative cursor-pointer'
							onClick={() => fileInputRef.current?.click()}>
							<img
								src={avatar}
								alt='Avatar'
								className='h-40 w-40 rounded-full border-2 border-black object-cover transition'
							/>
							<div className='absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100'>
								<Camera className='h-5 w-5 text-white' />
								<span className='text-[11px] font-bold leading-tight text-white'>
									Chỉnh sửa ảnh
								</span>
							</div>
							<input
								ref={fileInputRef}
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

					{/* Name + Username + Email column */}
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
										Đang kiểm tra...
									</p>
								) : null
							}
						/>

						{/* Email — read-only */}
						<div>
							<label className='mb-1.5 flex items-center gap-2 text-sm font-bold text-black'>
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

				{/* Remaining full-width fields */}
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
							value={form.faculty}
							onChange={handleFacultyChange}
							placeholder={loadingAcademic ? "Đang tải..." : "Chọn khoa..."}
						/>
					</div>

					<div>
						<label className='mb-1.5 block text-sm font-bold text-black'>Ngành</label>
						<NeoSelect
							options={majorOptions}
							value={form.major}
							onChange={handleMajorChange}
							placeholder={form.faculty ? "Chọn ngành..." : "Chọn khoa trước"}
						/>
					</div>

					<div>
						<label className='mb-1.5 block text-sm font-bold text-black'>Lớp</label>
						<NeoSelect
							options={classOptions}
							value={form.class_name}
							onChange={setField("class_name")}
							placeholder={form.major ? "Chọn lớp..." : "Chọn ngành trước"}
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
							placeholder='Chọn giới tính...'
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

				{/* Skills — within the same profile panel */}
				<div className='mt-6'>
					<h3 className='mb-4 font-heading text-base font-extrabold text-black'>
						Kỹ năng
					</h3>
					<div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4'>
						{SKILL_OPTIONS.map((skill) => {
							const checked = selectedSkills.includes(skill);
							return (
								<label
									key={skill}
									className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-black px-3 py-2.5 bg-white text-sm font-bold transition select-none"
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
										onChange={() => toggleSkill(skill)}
									/>
									{skill}
								</label>
							);
						})}
					</div>
				</div>
			</div>

			{/* ── Social media — separate panel ── */}
			<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
				<h1 className='mb-5 font-heading text-lg font-extrabold text-black'>Mạng xã hội</h1>
				<div className='space-y-4'>
					<SocialInput
						label='GitHub'
						value={form.github}
						onChange={setField("github")}
						prefix='github.com/'
						icon={<Github />}
					/>
					<SocialInput
						label='LinkedIn'
						value={form.linkedin}
						onChange={setField("linkedin")}
						prefix='linkedin.com/u/'
						icon={<Globe />}
					/>
					<SocialInput
						label='Instagram'
						value={form.instagram}
						onChange={setField("instagram")}
						prefix='instagram.com/'
						icon={<Instagram />}
					/>
					<SocialInput
						label='YouTube'
						value={form.youtube}
						onChange={setField("youtube")}
						prefix='youtube.com/@'
						icon={<Youtube />}
					/>
					<SocialInput
						label='TikTok'
						value={form.tiktok}
						onChange={setField("tiktok")}
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
					className='inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[3px_3px_0_#111]'>
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
		{/* ── Profile card ── */}
		<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
			{/* Heading */}
			<Bone className='h-6 w-14' />
			<Bone className='mt-1.5 mb-6 h-4 w-52 bg-gray-100' />

			{/* Top row: avatar + name/username/email */}
			<div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
				{/* Avatar column */}
				<div className='flex flex-col items-center gap-3 sm:w-52 sm:shrink-0'>
					<Bone className='h-40 w-40 rounded-full' />
					<Bone className='h-3 w-28 bg-gray-100' />
					<Bone className='h-3 w-20 bg-gray-100' />
				</div>

				{/* Name + Username + Email */}
				<div className='min-w-0 flex-1 space-y-4'>
					<FieldSkeleton labelW='w-20' />
					<FieldSkeleton labelW='w-24' />
					<FieldSkeleton labelW='w-12' />
				</div>
			</div>

			{/* Divider */}
			<div className='my-6 border-t-2 border-dashed border-gray-200' />

			{/* MSSV / Khoa / Ngành / Lớp / Giới tính */}
			<div className='space-y-4'>
				<FieldSkeleton labelW='w-10' />
				<FieldSkeleton labelW='w-8' />
				<FieldSkeleton labelW='w-12' />
				<FieldSkeleton labelW='w-6' />
				<FieldSkeleton labelW='w-16' />
			</div>

			{/* Bio */}
			<div className='mt-4'>
				<Bone className='mb-1.5 h-4 w-16' />
				<Bone className='h-[6.5rem] w-full rounded-xl' />
			</div>

			{/* Skills */}
			<div className='mt-6'>
				<Bone className='mb-4 h-5 w-14' />
				<div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4'>
					{Array.from({ length: 16 }).map((_, i) => (
						<Bone key={i} className='h-10 rounded-xl border-2 border-gray-300 bg-gray-100' />
					))}
				</div>
			</div>
		</div>

		{/* ── Social card ── */}
		<div className='rounded-2xl border-2 border-black bg-white p-6 shadow-[4px_4px_0_#111]'>
			<Bone className='mb-5 h-5 w-28' />
			<div className='space-y-4'>
				{(['w-14', 'w-16', 'w-20', 'w-16', 'w-12'] as const).map((w, i) => (
					<FieldSkeleton key={i} labelW={w} />
				))}
			</div>
		</div>

		{/* ── Save button ── */}
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
	const { user, loadingUser } = useOutletContext<{ user: AuthUser | null; loadingUser: boolean }>();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const tabParam = searchParams.get("tabIndex");
	const activeTabId: TabId =
		(["profile", "billing", "notifications", "settings"] as TabId[])[Number(tabParam ?? 0)] ??
		"profile";

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loadingProfile, setLoadingProfile] = useState(true);

	useEffect(() => {
		// Chờ MainLayout xác minh auth xong mới quyết định redirect
		if (loadingUser) return;

		if (!user) {
			navigate("/login", { replace: true });
			return;
		}

		api.get<{ data: UserProfile }>("/auth/me")
			.then((res) => setProfile((res as { data: UserProfile }).data))
			.catch(() => setProfile(null))
			.finally(() => setLoadingProfile(false));
	}, [user, loadingUser, navigate]);

	const setActiveTab = (tab: TabId) => {
		const idx = TABS.findIndex((t) => t.id === tab);
		setSearchParams({ tabIndex: String(idx) }, { replace: true });
	};

	// Đang xác minh auth — render trống để tránh flash redirect
	if (loadingUser) return null;
	if (!user) return null;

	return (
		<div className='min-h-screen w-full bg-[var(--color-surface)] pt-16'>
			<div className='neo-container px-4 py-8 md:px-6'>
				<div className='flex flex-col gap-6 lg:flex-row'>
					{/* ── Sidebar ── */}
					<aside className='w-full shrink-0 lg:w-56'>
						<nav className='rounded-2xl border-2 border-black bg-white p-2 shadow-[4px_4px_0_#111] space-y-2'>
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

					{/* ── Content ── */}
					<main className='min-w-0 flex-1'>
						{activeTabId === "profile" ? (
							loadingProfile ? (
								<ProfileTabSkeleton />
							) : (
								<ProfileTab
									user={user}
									profile={profile}
									onSaved={async () => {
										const res = await api.get<{ data: UserProfile }>(
											"/auth/me",
										);
										setProfile((res as { data: UserProfile }).data);
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
