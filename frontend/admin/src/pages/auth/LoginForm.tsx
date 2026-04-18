import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listenOAuthAuthMessage } from "@/services/auth.service";
import { toast } from "sonner";

export function LoginForm() {
	const navigate = useNavigate();

	useEffect(() => {
		return listenOAuthAuthMessage({
			onSuccess: (payload) => {
				if (payload.token) {
					localStorage.setItem("access_token", payload.token);
				}

				const redirectPath = sessionStorage.getItem("redirectPath") || "/";
				sessionStorage.removeItem("redirectPath");

				toast.success(payload.message || "Đăng nhập thành công!", {
					position: "top-right",
				});
				navigate(redirectPath, { replace: true });
			},

			onError: (payload) => {
				toast.error(payload.message || "Đăng nhập thất bại!", { position: "top-right" });
			},
		});
	}, [navigate]);

	const handleGoogleLogin = (e: React.FormEvent) => {
		e.preventDefault(); // Prevent form submission
		try {
			const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
			const url = `${baseUrl}/admin/auth/google`;
			const width = 520,
				height = 640;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;
			window.open(
				url,
				"google_oauth_admin",
				`width=${width},height=${height},left=${left},top=${top}`,
			);
		} catch (error) {
			console.error("Error redirecting to Google:", error);
		}
	};

	return (
		<div className='flex min-h-screen w-full items-center justify-center p-4'>
			<Card className='w-full max-w-md max-h-md mx-auto overflow-hidden rounded-2xl shadow-sm py-0'>
				<CardContent className='p-0'>
					<div className='p-6 md:p-6 space-y-6'>
						<div className='space-y-2'>
							<div className='flex items-center justify-between'>
								<h1 className='text-xl font-semibold tracking-tight'>Đăng nhập</h1>
							</div>
							<p className='text-sm text-muted-foreground'>
								Nhập tài khoản hợp lệ để truy cập trang quản trị.
							</p>
						</div>

						<form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
							<div className='space-y-2'>
								<Label htmlFor='email' className='font-medium text-base'>
									Email
								</Label>
								<Input
									id='email'
									type='email'
									placeholder='abc@caothang.edu.vn'
									required
									className='h-10'
								/>
							</div>
							<div className='space-y-2'>
								<div className='flex items-center justify-between'>
									<Label htmlFor='password' className='font-medium text-base'>
										Mật khẩu
									</Label>
									<a href='#' className='text-sm font-medium hover:underline'>
										Quên mật khẩu?
									</a>
								</div>
								<Input
									id='password'
									type='password'
									placeholder='••••••••••'
									required
									className='h-10 border border-gray-300 dark:border-gray-800'
								/>
							</div>
							<Button
								type='submit'
								className='w-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm dark:bg-primary dark:hover:bg-primary/90 dark:text-black'>
								Đăng nhập
							</Button>
						</form>
					</div>

					<div className='relative'>
						<div className='absolute inset-0 flex items-center'>
							<span className='w-full border-t'></span>
						</div>
						<div className='relative flex justify-center text-xs uppercase'>
							<span className='bg-background px-2 text-muted-foreground'>
								Hoặc tiếp tục với
							</span>
						</div>
					</div>

					<div className='bg-muted/20 p-6 md:p-6 py-5'>
						<div className='grid grid-cols-2 gap-3'>
							<Button
								variant='outline'
								type='button'
								onClick={handleGoogleLogin}
								className='w-full shadow-sm hover:bg-[#f5f5f5] dark:hover:bg-zinc-800 hover:text-dark'>
								<svg
									aria-hidden='true'
									className='mr-2 h-4 w-4'
									viewBox='0 0 256 262'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										d='M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027'
										fill='#4285F4'></path>
									<path
										d='M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1'
										fill='#34A853'></path>
									<path
										d='M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z'
										fill='#FBBC05'></path>
									<path
										d='M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251'
										fill='#EB4335'></path>
								</svg>
								Google
							</Button>
							<Button
								variant='outline'
								type='button'
								onClick={handleGoogleLogin}
								className='w-full shadow-sm hover:bg-[#f5f5f5] dark:hover:bg-zinc-800 hover:text-dark'>
								<svg
									aria-label='GitHub'
									className='mr-2 h-4 w-4'
									fill='currentColor'
									role='img'
									viewBox='0 0 24 24'
									xmlns='http://www.w3.org/2000/svg'>
									<path d='M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z'></path>
								</svg>
								Github
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
