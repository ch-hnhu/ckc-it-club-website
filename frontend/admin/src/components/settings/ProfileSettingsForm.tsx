import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import userService from "@/services/user.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { CurrentUser, UserProfile } from "@/types/user.type";

const DEFAULT_AVATAR_SRC = "/img/default-avatar.png";

const GENDER_OPTIONS: ComboboxOption[] = [
	{ value: "Nam", label: "Nam" },
	{ value: "Nữ", label: "Nữ" },
	{ value: "Khác", label: "Khác" },
];

type ProfileFormState = {
	full_name: string;
	username: string;
	gender: string;
	date_of_birth: string;
	bio: string;
};

const getInitialFormState = (): ProfileFormState => ({
	full_name: "",
	username: "",
	gender: "",
	date_of_birth: "",
	bio: "",
});

function ProfileSettingsForm() {
	const { setCurrentUser } = useAuth();
	const avatarInputRef = useRef<HTMLInputElement | null>(null);
	const avatarObjectUrlRef = useRef<string | null>(null);

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [form, setForm] = useState<ProfileFormState>(getInitialFormState);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

	const [usernameStatus, setUsernameStatus] = useState<
		"idle" | "checking" | "available" | "taken" | "invalid"
	>("idle");
	const usernameTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const fetchProfile = async () => {
			setLoading(true);
			try {
				const response = await userService.getProfile();
				const data = response.data;
				setProfile(data);
				setForm({
					full_name: data.full_name ?? "",
					username: data.username ?? "",
					gender: data.gender ?? "",
					date_of_birth: data.date_of_birth ?? "",
					bio: data.bio ?? "",
				});
			} catch (error) {
				console.error("Không thể tải thông tin hồ sơ:", error);
				toast.error("Không thể tải thông tin hồ sơ.", { position: "top-right" });
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, []);

	useEffect(() => {
		return () => {
			if (avatarObjectUrlRef.current) {
				URL.revokeObjectURL(avatarObjectUrlRef.current);
			}
		};
	}, []);

	const updateField =
		(field: keyof Omit<ProfileFormState, "username">) =>
		(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setFieldErrors((prev) => {
				if (!prev[field]) return prev;
				const next = { ...prev };
				delete next[field];
				return next;
			});
			setForm((prev) => ({ ...prev, [field]: event.target.value }));
		};

	const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
		const val = event.target.value;
		setForm((prev) => ({ ...prev, username: val }));
		setFieldErrors((prev) => {
			if (!prev.username) return prev;
			const next = { ...prev };
			delete next.username;
			return next;
		});

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
				const res = await userService.checkUsername(val);
				setUsernameStatus(res.available ? "available" : "taken");
			} catch {
				setUsernameStatus("idle");
			}
		}, 600);
	};

	const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

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
		setAvatarPreview(null);
		setAvatarFile(null);
		if (avatarInputRef.current) {
			avatarInputRef.current.value = "";
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const clientErrors: Partial<Record<string, string>> = {};
		if (!form.full_name.trim()) clientErrors.full_name = "Vui lòng nhập họ và tên.";
		if (!form.username.trim()) clientErrors.username = "Vui lòng nhập username.";
		if (usernameStatus === "invalid")
			clientErrors.username = "Username chỉ được chứa chữ thường, số và dấu gạch dưới.";
		if (usernameStatus === "taken") clientErrors.username = "Username đã được sử dụng.";

		if (Object.keys(clientErrors).length > 0) {
			setFieldErrors(clientErrors);
			return;
		}

		if (usernameStatus === "checking") {
			toast.error("Đang kiểm tra username, vui lòng chờ.", { position: "top-right" });
			return;
		}

		setFieldErrors({});
		setSubmitting(true);
		try {
			const payload = new FormData();
			payload.append("full_name", form.full_name.trim());
			payload.append("username", form.username.trim());
			payload.append("gender", form.gender);
			payload.append("date_of_birth", form.date_of_birth);
			payload.append("bio", form.bio);
			if (avatarFile) payload.append("avatar", avatarFile);

			const response = await userService.updateProfile(payload);
			setProfile(response.data);
			clearAvatar();
			toast.success("Cập nhật hồ sơ thành công.", { position: "top-right" });

			// Refresh thông tin người dùng hiện tại (avatar/tên hiển thị ở sidebar)
			try {
				const me = await authService.getMe();
				if (me.success) setCurrentUser(me.data as CurrentUser);
			} catch {
				// không chặn luồng nếu refresh thất bại
			}
		} catch (error) {
			const axiosError = error as AxiosError<ApiErrorResponse>;
			const responseData = axiosError.response?.data;

			if (responseData?.errors) {
				const serverFieldErrors: Partial<Record<string, string>> = {};
				Object.entries(responseData.errors).forEach(([key, messages]) => {
					if (messages.length === 0) return;
					serverFieldErrors[key] = messages[0];
				});
				if (Object.keys(serverFieldErrors).length > 0) {
					setFieldErrors(serverFieldErrors);
					return;
				}
			}

			toast.error(responseData?.message ?? "Không thể cập nhật hồ sơ.", {
				position: "top-right",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const avatarSrc = avatarPreview ?? profile?.avatar ?? DEFAULT_AVATAR_SRC;

	if (loading) {
		return (
			<div className='flex h-full items-center justify-center py-10'>
				<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-6'>
			{/* Avatar */}
			<div className='flex items-center gap-4'>
				<Avatar className='h-20 w-20 border border-border shadow-sm'>
					<AvatarImage src={avatarSrc} alt='Avatar preview' />
					<AvatarFallback className='text-xl'>
						{(profile?.full_name ?? "")
							.split(" ")
							.filter(Boolean)
							.slice(-1)[0]
							?.charAt(0)
							?.toUpperCase() ?? "U"}
					</AvatarFallback>
				</Avatar>

				<div className='space-y-2'>
					<div className='flex items-center gap-2'>
						<Input
							id='avatar'
							type='file'
							accept='image/*'
							onChange={handleAvatarChange}
							ref={avatarInputRef}
							className='hidden'
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
							disabled={!avatarFile}>
							<Trash2 className='h-4 w-4' />
							Xóa ảnh
						</Button>
					</div>
					<p className='text-xs text-muted-foreground'>Hỗ trợ PNG, JPG, WEBP. Tối đa 5MB.</p>
				</div>
			</div>

			{/* Fields */}
			<div className='grid gap-4 sm:grid-cols-2'>
				<div className='space-y-2'>
					<Label htmlFor='full_name'>
						Họ và tên <span className='text-destructive'>*</span>
					</Label>
					<Input
						id='full_name'
						value={form.full_name}
						onChange={updateField("full_name")}
						placeholder='Nguyễn Văn A'
					/>
					{fieldErrors.full_name ? (
						<p className='text-sm text-destructive'>{fieldErrors.full_name}</p>
					) : null}
				</div>

				<div className='space-y-2'>
					<Label htmlFor='username'>
						Username <span className='text-destructive'>*</span>
					</Label>
					<Input
						id='username'
						value={form.username}
						onChange={handleUsernameChange}
						placeholder='ten-nguoi-dung'
					/>
					{fieldErrors.username ? (
						<p className='text-sm text-destructive'>{fieldErrors.username}</p>
					) : usernameStatus === "available" ? (
						<p className='flex items-center gap-1 text-sm font-medium text-green-600'>
							<Check className='h-3.5 w-3.5' />
							Username khả dụng
						</p>
					) : usernameStatus === "checking" ? (
						<p className='flex items-center gap-1 text-sm text-muted-foreground'>
							<Loader2 className='h-3 w-3 animate-spin' />
							Đang kiểm tra...
						</p>
					) : null}
				</div>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='email'>Email</Label>
				<Input id='email' type='email' value={profile?.email ?? ""} disabled />
			</div>

			<div className='grid gap-4 sm:grid-cols-2'>
				<div className='space-y-2'>
					<Label htmlFor='gender'>Giới tính</Label>
					<Combobox
						options={GENDER_OPTIONS}
						value={form.gender}
						onValueChange={(val) => setForm((prev) => ({ ...prev, gender: val }))}
						placeholder='Chọn giới tính'
						searchable={false}
						triggerId='gender'
					/>
				</div>

				<div className='space-y-2'>
					<Label htmlFor='date_of_birth'>Ngày sinh</Label>
					<Input
						id='date_of_birth'
						type='date'
						value={form.date_of_birth ?? ""}
						onChange={updateField("date_of_birth")}
					/>
				</div>
			</div>

			<div className='space-y-2'>
				<Label htmlFor='bio'>Giới thiệu</Label>
				<Textarea
					id='bio'
					value={form.bio}
					onChange={updateField("bio")}
					placeholder='Một chút về bản thân bạn..'
					rows={4}
				/>
			</div>

			<div className='flex justify-end'>
				<Button type='submit' disabled={submitting}>
					{submitting ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
					Lưu thay đổi
				</Button>
			</div>
		</form>
	);
}

export default ProfileSettingsForm;
