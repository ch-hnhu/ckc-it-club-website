import React from "react";
import { Trash2, X } from "lucide-react";

interface Props {
	postTitle: string;
	deleting: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

const DeletePostConfirm: React.FC<Props> = ({ postTitle, deleting, onClose, onConfirm }) => (
	<div
		className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
		onClick={(e) => e.target === e.currentTarget && onClose()}>
		<div className='w-full max-w-sm rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
			<div className='flex items-center justify-between border-b-2 border-black px-5 py-4'>
				<div className='flex items-center gap-2'>
					<Trash2 className='h-5 w-5 text-red-600' />
					<h2 className='font-heading text-base font-extrabold text-black'>Xóa bài viết</h2>
				</div>
				<button
					onClick={onClose}
					className='rounded-lg border-2 border-transparent p-1 transition hover:border-black hover:bg-gray-100'>
					<X className='h-4 w-4' />
				</button>
			</div>

			<div className='px-5 py-5'>
				<p className='text-sm text-gray-700'>
					Bạn có chắc muốn xóa bài viết{" "}
					<span className='font-bold text-black'>"{postTitle}"</span>?
				</p>
				<p className='mt-1.5 text-sm text-red-600 font-medium'>Hành động này không thể hoàn tác.</p>
			</div>

			<div className='flex justify-end gap-3 border-t-2 border-black px-5 py-4'>
				<button
					type='button'
					onClick={onClose}
					disabled={deleting}
					className='rounded-xl border-2 border-black px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-100 disabled:opacity-60'>
					Hủy
				</button>
				<button
					type='button'
					onClick={onConfirm}
					disabled={deleting}
					className='rounded-xl border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_#991b1b] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'>
					{deleting ? "Đang xóa..." : "Xóa"}
				</button>
			</div>
		</div>
	</div>
);

export default DeletePostConfirm;
