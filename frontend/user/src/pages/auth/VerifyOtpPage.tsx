import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { sendForgotPasswordOtp, verifyForgotPasswordOtp } from "@/services/auth.service";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const email: string = (location.state as { email?: string })?.email ?? "";

	const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
	const [resending, setResending] = useState(false);

	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Redirect if no email was passed (user navigated directly)
	useEffect(() => {
		if (!email) navigate("/forgot-password", { replace: true });
	}, [email, navigate]);

	// Countdown timer
	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	const otp = digits.join("");

	const handleChange = (index: number, value: string) => {
		// Only allow digits
		const digit = value.replace(/\D/g, "").slice(-1);
		const next = [...digits];
		next[index] = digit;
		setDigits(next);
		setError(null);
		if (digit && index < OTP_LENGTH - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace" && !digits[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePaste = (e: React.ClipboardEvent) => {
		const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
		if (!pasted) return;
		e.preventDefault();
		const next = [...digits];
		for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
		setDigits(next);
		inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
	};

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		if (otp.length < OTP_LENGTH) {
			setError("Vui lòng nhập đủ 6 chữ số.");
			return;
		}
		setError(null);
		setLoading(true);
		try {
			const res = await verifyForgotPasswordOtp(email, otp);
			if (res.success && res.reset_token) {
				navigate("/reset-password", { state: { email, resetToken: res.reset_token } });
			} else {
				setError(res.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
				setDigits(Array(OTP_LENGTH).fill(""));
				inputRefs.current[0]?.focus();
			}
		} catch {
			setError("Đã xảy ra lỗi, vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		if (cooldown > 0 || resending) return;
		setResending(true);
		setError(null);
		try {
			await sendForgotPasswordOtp(email);
			setDigits(Array(OTP_LENGTH).fill(""));
			setCooldown(RESEND_COOLDOWN);
			inputRefs.current[0]?.focus();
		} catch {
			setError("Không thể gửi lại mã, vui lòng thử lại.");
		} finally {
			setResending(false);
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
							Nhập mã xác nhận
						</h1>
						<p className='mb-6 text-sm' style={{ color: "var(--color-text-muted)" }}>
							Mã OTP 6 chữ số đã được gửi đến{" "}
							<span className='font-semibold' style={{ color: "var(--color-text)" }}>
								{email}
							</span>
							. Mã có hiệu lực trong 10 phút.
						</p>

						{error && (
							<div
								className='mb-4 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
								style={{ borderRadius: "var(--neo-radius-sm)" }}>
								{error}
							</div>
						)}

						<form onSubmit={handleVerify} className='space-y-6'>
							<div className='flex justify-center gap-2' onPaste={handlePaste}>
								{digits.map((digit, i) => (
									<input
										key={i}
										ref={(el) => {
											inputRefs.current[i] = el;
										}}
										type='text'
										inputMode='numeric'
										maxLength={1}
										value={digit}
										onChange={(e) => handleChange(i, e.target.value)}
										onKeyDown={(e) => handleKeyDown(i, e)}
										className='h-14 w-12 rounded-[10px] border-2 border-black bg-white text-center text-xl font-bold outline-none transition-all focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
										style={{ fontFamily: "var(--font-body)" }}
										autoFocus={i === 0}
									/>
								))}
							</div>

							<button
								type='submit'
								disabled={loading || otp.length < OTP_LENGTH}
								className='neo-btn neo-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60'>
								{loading ? "Đang xác nhận..." : "Xác nhận"}
							</button>
						</form>

						<div
							className='mt-4 text-center text-sm'
							style={{ color: "var(--color-text-muted)" }}>
							Không nhận được mã?{" "}
							{cooldown > 0 ? (
								<span className='font-semibold'>Gửi lại sau {cooldown}s</span>
							) : (
								<button
									type='button'
									onClick={handleResend}
									disabled={resending}
									className='font-semibold underline-offset-2 hover:underline disabled:opacity-60'
									style={{ color: "var(--color-text)" }}>
									{resending ? "Đang gửi..." : "Gửi lại"}
								</button>
							)}
						</div>
					</div>
				</div>

				<p
					className='mt-5 text-center text-sm'
					style={{ color: "var(--color-text-muted)" }}>
					<Link
						to='/forgot-password'
						className='font-semibold underline-offset-2 hover:underline'
						style={{ color: "var(--color-text)" }}>
						← Nhập lại email
					</Link>
				</p>
			</div>
		</div>
	);
}
