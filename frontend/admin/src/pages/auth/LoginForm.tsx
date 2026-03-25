import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
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

						<form className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='email' className='font-medium text-base'>
									Email
								</Label>
								<Input
									id='email'
									type='email'
									placeholder='abc@caothang.edu.vn'
									required
									className='h-10 border border-gray-300 dark:border-gray-800'
								/>
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
								<Input
									id='password'
									type='password'
									required
									className='h-10 border border-gray-300 dark:border-gray-800'
								/>
							</div>
						</form>
					</div>

					<div className='bg-muted/20 p-6 md:p-6 py-5 border-t space-y-3'>
						<Button
							type='submit'
							className='w-full bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm'>
							Login
						</Button>
						<Button
							variant='outline'
							type='button'
							className='w-full shadow-sm hover:bg-[#f5f5f5] dark:hover:bg-zinc-800 hover:text-dark'>
							Login with Google
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
