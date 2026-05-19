import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
	const navigate = useNavigate();

	return (
		<div className='h-screen flex flex-col items-center justify-center'>
			<h1 className='text-6xl font-bold'>404</h1>
			<p className='text-lg mt-2'>Trang không tồn tại!</p>
			<Button variant='outline' size='lg' className='mt-4 h-10 lg:flex' onClick={() => navigate(-1)}>
				Quay lại
			</Button>
		</div>
	);
}
