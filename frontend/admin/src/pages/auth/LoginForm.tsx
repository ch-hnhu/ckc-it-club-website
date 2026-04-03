
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
								<h1 className='text-xl font-semibold tracking-tight'>
									Login to your account
								</h1>
								<a href='#' className='text-sm font-medium hover:underline'>
									Sign Up
								</a>
							</div>
							<p className='text-sm text-muted-foreground'>
								Enter your email below to login to your account
							</p>
						</div>

						<form className='space-y-4' onSubmit={(e) => e.preventDefault()}>
							<div className='space-y-2'>
								<Label htmlFor='email' className='font-medium text-base'>
									Email
								</Label>
								<Input id='email' type='email' placeholder='abc@caothang.edu.vn' required className='h-10' />
							</div>
							<div className='space-y-2'>
								<div className='flex items-center justify-between'>
									<Label htmlFor='password' className='font-medium text-base'>
										Password
									</Label>
									<a href='#' className='text-sm font-medium hover:underline'>
										Forgot your password?
									</a>
								</div>
								<Input id='password' type='password' placeholder='Pass@123' required className='h-10' />
							</div>
						</form>
					</div>

					<div className='space-y-3 border-t bg-muted/20 p-6 py-5 md:p-6'>
						<Button type='submit' className='w-full shadow-sm'>
							Login
						</Button>
						<Button
							variant='outline'
							type='button'
							onClick={handleGoogleLogin}
							className='w-full shadow-sm'>
							Login with Google
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
