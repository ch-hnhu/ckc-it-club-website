import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/services/auth.service";

export default function ResetPasswordPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const state = location.state as { email?: string; resetToken?: string } | null;
	const email = state?.email ?? "";
	const resetToken = state?.resetToken ?? "";

	const [password, setPassword] = useState("");
	const [passwordConfirmation, setPasswordConfirmation] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!email || !resetToken) navigate("/forgot-password", { replace: true });
	}, [email, resetToken, navigate]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== passwordConfirmation) {
			setError("Xác nhận mật khẩu không khớp.");
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const res = await resetPassword(email, resetToken, password, passwordConfirmation);
			if (res.success) {
				navigate("/login", {
					state: {
						successMessage: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.",
					},
					replace: true,
				});
			} else {
				setError(res.message || "Đã xảy ra lỗi, vui lòng thực hiện lại từ đầu.");
			}
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
								src='https://fdahxiysjakdipmaiprg.supabase.co/storage/v1/object/public/images/club-info/it_club_ckc.jpg'
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
							Đặt lại mật khẩu
						</h1>
						<p className='mb-6 text-sm' style={{ color: "var(--color-text-muted)" }}>
							Nhập mật khẩu mới cho tài khoản{" "}
							<span className='font-semibold' style={{ color: "var(--color-text)" }}>
								{email}
							</span>
							.
						</p>

						{error && (
							<div
								className='mb-4 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
								style={{ borderRadius: "var(--neo-radius-sm)" }}>
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className='space-y-4'>
							<div className='space-y-1.5'>
								<label
									htmlFor='password'
									className='block text-sm font-semibold'
									style={{ color: "var(--color-text)" }}>
									Mật khẩu mới
								</label>
								<div className='relative'>
									<input
										id='password'
										type={showPassword ? "text" : "password"}
										autoComplete='new-password'
										placeholder='Ít nhất 8 ký tự'
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
										onClick={() => setShowPassword((v) => !v)}
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
										type={showConfirm ? "text" : "password"}
										autoComplete='new-password'
										placeholder='Nhập lại mật khẩu'
										required
										value={passwordConfirmation}
										onChange={(e) => setPasswordConfirmation(e.target.value)}
										className='w-full rounded-[10px] border-2 border-black bg-white py-2.5 pl-4 pr-12 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
										style={{ fontFamily: "var(--font-body)" }}
									/>
									<button
										type='button'
										aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
										onClick={() => setShowConfirm((v) => !v)}
										className='absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-black transition-colors hover:bg-black/5'>
										{showConfirm ? (
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
								{loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
