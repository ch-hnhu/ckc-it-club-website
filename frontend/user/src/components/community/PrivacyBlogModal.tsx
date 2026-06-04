import React, { useState } from "react";
import { Globe, Lock, Users, X } from "lucide-react";
import { toast } from "sonner";
import { blogService } from "@/services/blog.service";

type Visibility = "public" | "members" | "private";

interface Props {
	blogId: number;
	currentVisibility: Visibility;
	onClose: () => void;
	onSaved: (visibility: Visibility) => void;
}

const OPTIONS: { value: Visibility; label: string; icon: React.ElementType }[] = [
	{ value: "public",  label: "Công khai",              icon: Globe  },
	{ value: "members", label: "Thành viên Câu lạc bộ", icon: Users  },
	{ value: "private", label: "Chỉ mình tôi",           icon: Lock   },
];

const PrivacyBlogModal: React.FC<Props> = ({ blogId, currentVisibility, onClose, onSaved }) => {
	const [selected, setSelected] = useState<Visibility>(currentVisibility);
	const [saving, setSaving]     = useState(false);

	const handleSave = async () => {
		if (saving || selected === currentVisibility) {
			onClose();
			return;
		}
		setSaving(true);
		try {
			await blogService.updateBlogVisibility(blogId, selected);
			onSaved(selected);
			toast.success("Đã cập nhật quyền riêng tư.");
			onClose();
		} catch {
			toast.error("Không thể cập nhật. Vui lòng thử lại.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
			onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div className='w-full max-w-md rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
				<div className='flex items-center justify-between border-b-2 border-black px-5 py-4'>
					<h2 className='font-heading text-base font-extrabold text-black'>
						Quyền riêng tư
					</h2>
					<button
						onClick={onClose}
						className='rounded-lg border-2 border-transparent p-1 transition hover:border-black hover:bg-gray-100'>
						<X className='h-4 w-4' />
					</button>
				</div>

				<div className='p-5 space-y-2'>
					{OPTIONS.map((opt) => {
						const Icon = opt.icon;
						return (
							<label
								key={opt.value}
								className='flex cursor-pointer items-center gap-4 rounded-xl border-2 border-black px-4 py-3.5 transition hover:bg-gray-50 has-[:checked]:bg-primary'>
								<input
									type='radio'
									name='blog-visibility'
									value={opt.value}
									checked={selected === opt.value}
									onChange={() => setSelected(opt.value)}
									className='accent-black'
								/>
								<Icon strokeWidth={2} className='h-5 w-5 shrink-0 text-black' />
								<p className='text-sm font-bold text-black'>{opt.label}</p>
							</label>
						);
					})}
				</div>

				<div className='flex justify-end gap-3 border-t-2 border-black px-5 py-4'>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-100'>
						Hủy
					</button>
					<button
						type='button'
						onClick={() => void handleSave()}
						disabled={saving}
						className='rounded-lg border-2 border-black bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'>
						{saving ? "Đang lưu..." : "Lưu"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default PrivacyBlogModal;
