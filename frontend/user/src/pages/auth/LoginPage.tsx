import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
	getGoogleAuthUrl,
	getGithubAuthUrl,
	listenOAuthAuthMessage,
	loginWithCredentials,
	setAccessToken,
} from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";

function openOAuthPopup(url: string, name: string) {
	const width = 520,
		height = 640;
	const left = window.screenX + (window.outerWidth - width) / 2;
	const top = window.screenY + (window.outerHeight - height) / 2;
	window.open(url, name, `width=${width},height=${height},left=${left},top=${top}`);
}

export default function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const locationState = location.state as { successMessage?: string; from?: string } | null;
	const successMessage = locationState?.successMessage;
	const returnTo =
		locationState?.from || new URLSearchParams(location.search).get("returnTo") || "/";

	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		return listenOAuthAuthMessage({
			onSuccess: async (payload) => {
				if (payload.token) {
					setAccessToken(payload.token);
				}
				navigate(returnTo, { replace: true });
			},
			onError: (payload) => {
				setError(payload.message || "Đăng nhập thất bại!");
			},
		});
	}, [navigate, returnTo]);

	const handleCredentialLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			const res = await loginWithCredentials(identifier, password);
			if (res.success && res.token) {
				setAccessToken(res.token);
				navigate(returnTo, { replace: true });
			} else {
				setError(res.message || "Thông tin đăng nhập không chính xác!");
			}
		} catch {
			setError("Đã xảy ra lỗi, vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async (e: React.MouseEvent) => {
		e.preventDefault();
		setError(null);
		const url = await getGoogleAuthUrl();
		openOAuthPopup(url, "google_oauth_user");
	};

	const handleGithubLogin = (e: React.MouseEvent) => {
		e.preventDefault();
		setError(null);
		openOAuthPopup(getGithubAuthUrl(), "github_oauth_user");
	};

	return (
		<div
			className='flex min-h-screen items-center justify-center p-4'
			style={{ background: "var(--color-surface)" }}>
			<div className='w-full max-w-md'>
				{/* Logo / Branding */}
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
					<p className='text-sm' style={{ color: "var(--color-text-muted)" }}>
						Tham gia cùng chúng mình để khám phá, học hỏi và kết nối với cộng đồng IT
						năng động tại trường Cao đẳng Kỹ thuật Cao Thắng!
					</p>
				</div>

				{/* Card */}
				<div
					className='neo-card neo-card-static overflow-hidden p-0'
					style={{ background: "var(--color-background)" }}>
					{/* Form section */}
					<div className='p-6 sm:p-8'>
						<h1
							className='mb-1 text-xl font-bold'
							style={{
								fontFamily: "var(--font-heading)",
								color: "var(--color-text)",
							}}>
							Đăng nhập
						</h1>
						<p className='mb-6 text-sm' style={{ color: "var(--color-text-muted)" }}>
							Nhập email / username và mật khẩu của bạn.
						</p>

						{successMessage && (
							<div
								className='mb-4 rounded-lg border-2 border-green-500 bg-green-50 px-4 py-3 text-sm font-medium text-green-700'
								style={{ borderRadius: "var(--neo-radius-sm)" }}>
								{successMessage}
							</div>
						)}

						{error && (
							<div
								className='mb-4 rounded-lg border-2 border-red-500 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'
								style={{ borderRadius: "var(--neo-radius-sm)" }}>
								{error}
							</div>
						)}

						<form onSubmit={handleCredentialLogin} className='space-y-4'>
							<div className='space-y-1.5'>
								<label
									htmlFor='identifier'
									className='block text-sm font-semibold'
									style={{ color: "var(--color-text)" }}>
									Email hoặc username
								</label>
								<input
									id='identifier'
									type='text'
									autoComplete='username'
									placeholder='abc@caothang.edu.vn'
									required
									value={identifier}
									onChange={(e) => setIdentifier(e.target.value)}
									className='w-full rounded-[10px] border-2 border-black bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-gray-400 focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
									style={{ fontFamily: "var(--font-body)" }}
								/>
							</div>

							<div className='space-y-1.5'>
								<div className='flex items-center justify-between'>
									<label
										htmlFor='password'
										className='block text-sm font-semibold'
										style={{ color: "var(--color-text)" }}>
										Mật khẩu
									</label>
									<Link
										to='/forgot-password'
										className='text-xs font-semibold underline-offset-2 hover:underline'
										style={{ color: "var(--color-primary-dark)" }}>
										Quên mật khẩu?
									</Link>
								</div>
								<div className='relative'>
									<input
										id='password'
										type={showPassword ? "text" : "password"}
										autoComplete='current-password'
										placeholder='••••••••••'
										required
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

							<button
								type='submit'
								disabled={loading}
								className='neo-btn neo-btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60'>
								{loading ? "Đang đăng nhập..." : "Đăng nhập"}
							</button>
						</form>
					</div>

					{/* Divider */}
					<div className='relative px-6 sm:px-8'>
						<div className='absolute inset-0 flex items-center'>
							<span className='w-full border-t-2 border-black/10'></span>
						</div>
						<div className='relative flex justify-center'>
							<span
								className='px-3 text-xs font-semibold uppercase tracking-widest'
								style={{
									background: "var(--color-background)",
									color: "var(--color-text-muted)",
								}}>
								Hoặc tiếp tục với
							</span>
						</div>
					</div>

					{/* OAuth Buttons */}
					<div
						className='grid grid-cols-2 gap-3 p-6 sm:p-8'
						style={{ paddingTop: "1.25rem" }}>
						<button
							type='button'
							onClick={handleGoogleLogin}
							className='neo-btn neo-btn-secondary w-full justify-center text-sm'>
							<svg
								aria-hidden='true'
								className='h-4 w-4 shrink-0'
								viewBox='0 0 256 262'
								xmlns='http://www.w3.org/2000/svg'>
								<path
									d='M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027'
									fill='#4285F4'
								/>
								<path
									d='M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1'
									fill='#34A853'
								/>
								<path
									d='M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z'
									fill='#FBBC05'
								/>
								<path
									d='M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251'
									fill='#EB4335'
								/>
							</svg>
							Google
						</button>

						<button
							type='button'
							onClick={handleGithubLogin}
							className='neo-btn neo-btn-secondary w-full justify-center text-sm'>
							<svg
								aria-label='GitHub'
								className='h-4 w-4 shrink-0'
								fill='currentColor'
								role='img'
								viewBox='0 0 24 24'
								xmlns='http://www.w3.org/2000/svg'>
								<path d='M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z' />
							</svg>
							GitHub
						</button>
					</div>
				</div>

				<p
					className='mt-5 text-center text-sm'
					style={{ color: "var(--color-text-muted)" }}>
					Chưa có tài khoản?{" "}
					<Link
						to='/register'
						className='font-semibold underline-offset-2 hover:underline'
						style={{ color: "var(--color-text)" }}>
						Đăng ký ngay
					</Link>
				</p>
			</div>
		</div>
	);
}
