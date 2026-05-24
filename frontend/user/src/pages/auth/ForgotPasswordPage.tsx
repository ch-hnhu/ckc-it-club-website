import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendForgotPasswordOtp } from "@/services/auth.service";

export default function ForgotPasswordPage() {
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const res = await sendForgotPasswordOtp(email);
			if (res.success) {
				navigate("/verify-otp", { state: { email } });
			} else {
				setError(res.message || "Đã xảy ra lỗi, vui lòng thử lại.");
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
							Quên mật khẩu
						</h1>
						<p className='mb-6 text-sm' style={{ color: "var(--color-text-muted)" }}>
							Nhập email tài khoản của bạn. Chúng tôi sẽ gửi mã OTP để xác nhận.
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

							<button
								type='submit'
								disabled={loading}
								className='neo-btn neo-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60'>
								{loading ? "Đang gửi..." : "Gửi mã OTP"}
							</button>
						</form>
					</div>
				</div>

				<p
					className='mt-5 text-center text-sm'
					style={{ color: "var(--color-text-muted)" }}>
					<Link
						to='/login'
						className='font-semibold underline-offset-2 hover:underline'
						style={{ color: "var(--color-text)" }}>
						← Quay lại đăng nhập
					</Link>
				</p>
			</div>
		</div>
	);
}
