import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
	return (
		<div className='h-screen flex flex-col items-center justify-center'>
			<h1 className='text-6xl font-bold'>404</h1>
			<p className='text-lg mt-2'>Trang không tồn tại!</p>
			<Link to='/' className='mt-4 inline-block' style={{ textDecoration: "none" }}>
				<Button variant='outline' size='lg' className='h-10 lg:flex'>
					Về trang chủ
				</Button>
			</Link>
		</div>
	);
}
