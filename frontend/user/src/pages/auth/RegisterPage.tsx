import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	registerWithCredentials,
	setAccessToken,
	type AuthCredentialResponse,
} from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";

function getFirstValidationError(response: AuthCredentialResponse) {
	const errors = response.errors;
	if (!errors) return null;

	for (const messages of Object.values(errors)) {
		if (messages?.[0]) return messages[0];
	}

	return null;
}

export default function RegisterPage() {
	const navigate = useNavigate();

	const [fullName, setFullName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCredentialRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (password !== passwordConfirmation) {
			setError("Xác nhận mật khẩu không khớp.");
			return;
		}

		setLoading(true);
		try {
			const res = await registerWithCredentials({
				full_name: fullName,
				username,
				email,
				password,
				password_confirmation: passwordConfirmation,
			});

			if (res.success && res.token) {
				setAccessToken(res.token);
				navigate("/", { replace: true });
				return;
			}

			setError(getFirstValidationError(res) || res.message || "Không thể tạo tài khoản.");
		} catch {
			setError("Đã xảy ra lỗi, vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className='flex min-h-screen items-center justify-center p-4'
			style={{ background: "var(--color-surface)" }}>
			<div className='w-full max-w-md'>
				<div className='mb-8 flex flex-col items-center gap-2 text-center'>
					<Link to='/' className='flex items-center gap-2 no-underline'>
						<div
							className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-full'
							style={{
								border: "2px solid #111",
								background: "var(--color-primary)",
							}}>
							<img
								src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/it_club_ckc.jpg'
								className='h-full w-full rounded-full object-cover'
								alt='CKC IT CLUB'
							/>
						</div>
						<span
							className='text-2xl font-extrabold tracking-tight'
							style={{
								fontFamily: "var(--font-heading)",
								color: "var(--color-text)",
							}}>
							CKC IT CLUB
						</span>
					</Link>
					<p className='text-sm' style={{ color: "var(--color-text-muted)" }}>
						Tạo tài khoản để tham gia cộng đồng CKC IT CLUB và theo dõi các hoạt động
						mới nhất.
					</p>
				</div>

				<div
					className='neo-card neo-card-static overflow-hidden p-0'
					style={{ background: "var(--color-background)" }}>
					<div className='p-6 sm:p-8'>
						<h1
							className='mb-1 text-xl font-bold'
							style={{
								fontFamily: "var(--font-heading)",
								color: "var(--color-text)",
							}}>
							Đăng ký tài khoản
						</h1>
						<p className='mb-6 text-sm' style={{ color: "var(--color-text-muted)" }}>
							Chỉ nhập các thông tin bắt buộc để tạo tài khoản.
						</p>

						{error && (
							<div
								className='mb-4 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
								style={{ borderRadius: "var(--neo-radius-sm)" }}>
								{error}
							</div>
						)}

						<form onSubmit={handleCredentialRegister} className='space-y-4'>
							<div className='space-y-1.5'>
								<label
									htmlFor='full_name'
									className='block text-sm font-semibold'
									style={{ color: "var(--color-text)" }}>
									Họ và tên
								</label>
								<input
									id='full_name'
									type='text'
									autoComplete='name'
									placeholder='Nguyễn Văn A'
									required
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									className='w-full rounded-[10px] border-2 border-black bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
									style={{ fontFamily: "var(--font-body)" }}
								/>
							</div>

							<div className='space-y-1.5'>
								<label
									htmlFor='username'
									className='block text-sm font-semibold'
									style={{ color: "var(--color-text)" }}>
									Username
								</label>
								<input
									id='username'
									type='text'
									autoComplete='username'
									placeholder='nguyenvana'
									required
									maxLength={30}
									pattern='[A-Za-z0-9_.]+'
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className='w-full rounded-[10px] border-2 border-black bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
									style={{ fontFamily: "var(--font-body)" }}
								/>
							</div>

							<div className='space-y-1.5'>
								<label
									htmlFor='email'
									className='block text-sm font-semibold'
									style={{ color: "var(--color-text)" }}>
									Email
								</label>
								<input
									id='email'
									type='email'
									autoComplete='email'
									placeholder='abc@caothang.edu.vn'
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className='w-full rounded-[10px] border-2 border-black bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
									style={{ fontFamily: "var(--font-body)" }}
								/>
							</div>

							<div className='space-y-1.5'>
								<label
									htmlFor='password'
									className='block text-sm font-semibold'
									style={{ color: "var(--color-text)" }}>
									Mật khẩu
								</label>
								<div className='relative'>
									<input
										id='password'
										type={showPassword ? "text" : "password"}
										autoComplete='new-password'
										placeholder='Tối thiểu 8 ký tự'
										required
										minLength={8}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className='w-full rounded-[10px] border-2 border-black bg-white py-2.5 pl-4 pr-12 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
										style={{ fontFamily: "var(--font-body)" }}
									/>
									<button
										type='button'
										aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
										onClick={() => setShowPassword((current) => !current)}
										className='absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-black transition-colors hover:bg-black/5'>
										{showPassword ? (
											<EyeOff className='h-4 w-4' />
										) : (
											<Eye className='h-4 w-4' />
										)}
									</button>
								</div>
							</div>

							<div className='space-y-1.5'>
								<label
									htmlFor='password_confirmation'
									className='block text-sm font-semibold'
									style={{ color: "var(--color-text)" }}>
									Xác nhận mật khẩu
								</label>
								<div className='relative'>
									<input
										id='password_confirmation'
										type={showPasswordConfirmation ? "text" : "password"}
										autoComplete='new-password'
										placeholder='Nhập lại mật khẩu'
										required
										minLength={8}
										value={passwordConfirmation}
										onChange={(e) => setPasswordConfirmation(e.target.value)}
										className='w-full rounded-[10px] border-2 border-black bg-white py-2.5 pl-4 pr-12 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
										style={{ fontFamily: "var(--font-body)" }}
									/>
									<button
										type='button'
										aria-label={
											showPasswordConfirmation
												? "Ẩn xác nhận mật khẩu"
												: "Hiện xác nhận mật khẩu"
										}
										onClick={() =>
											setShowPasswordConfirmation((current) => !current)
										}
										className='absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-black transition-colors hover:bg-black/5'>
										{showPasswordConfirmation ? (
											<EyeOff className='h-4 w-4' />
										) : (
											<Eye className='h-4 w-4' />
										)}
									</button>
								</div>
							</div>

							<button
								type='submit'
								disabled={loading}
								className='neo-btn neo-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60'>
								{loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
							</button>
						</form>
					</div>
				</div>

				<p
					className='mt-5 text-center text-sm'
					style={{ color: "var(--color-text-muted)" }}>
					Đã có tài khoản?{" "}
					<Link
						to='/login'
						className='font-semibold underline-offset-2 hover:underline'
						style={{ color: "var(--color-text)" }}>
						Đăng nhập
					</Link>
				</p>
			</div>
		</div>
	);
}
