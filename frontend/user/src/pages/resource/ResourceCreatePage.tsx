import React, { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NeoSelect from "@/components/ui/NeoSelect";
import { resourceService } from "@/services/resource.service";
import type { ApiErrorResponse } from "@/types/api.types";
import type { ResourceLinkType } from "@/types/resource.types";

const LINK_TYPE_OPTIONS: { value: ResourceLinkType; label: string }[] = [
	{ value: "google_drive", label: "Google Drive" },
	{ value: "youtube", label: "YouTube" },
	{ value: "github", label: "GitHub" },
	{ value: "document", label: "Website" },
	{ value: "other", label: "Khác" },
];

const getErrorMessage = (error: unknown) => {
	const response = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;
	const firstFieldError = response?.errors ? Object.values(response.errors)[0]?.[0] : null;
	return firstFieldError || response?.message || "Không thể gửi tài nguyên. Vui lòng thử lại.";
};

const ResourceCreatePage: React.FC = () => {
	const navigate = useNavigate();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [linkType, setLinkType] = useState<ResourceLinkType>("google_drive");
	const [url, setUrl] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		if (title.trim().length < 3) {
			setFormError("Tiêu đề cần ít nhất 3 ký tự.");
			return;
		}
		if (!/^https?:\/\/.+/.test(url.trim())) {
			setFormError("Link không hợp lệ, cần bắt đầu bằng http:// hoặc https://");
			return;
		}

		setIsSubmitting(true);
		try {
			await resourceService.createResource({
				title: title.trim(),
				description: description.trim() || undefined,
				link_type: linkType,
				url: url.trim(),
			});
			toast.success("Tài nguyên đã được gửi và đang chờ duyệt.");
			navigate("/tai-nguyen");
		} catch (error) {
			const message = getErrorMessage(error);
			setFormError(message);
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='w-full min-h-screen pb-16 pt-20'>
			<div className='neo-container max-w-xl px-6'>
				<Link
					to='/tai-nguyen'
					className='mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-black'>
					<ChevronLeft className='h-4 w-4' />
					Quay lại kho tài nguyên
				</Link>

				<h1 className='font-heading text-3xl font-extrabold leading-tight text-black md:text-4xl'>Đóng góp tài nguyên</h1>
				<p className='mt-2 text-sm text-gray-600'>
					Tài nguyên của bạn sẽ ở trạng thái chờ duyệt cho đến khi quản trị viên xem xét.
				</p>

				<form onSubmit={handleSubmit} className='mt-6 space-y-5'>
					<div>
						<label className='mb-1.5 block text-sm font-bold text-black'>Tiêu đề</label>
						<input
							type='text'
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder='VD: Tài liệu ôn tập cấu trúc dữ liệu'
							maxLength={500}
							className='w-full rounded-lg border-2 border-black p-3 text-sm font-medium text-black placeholder-gray-400 outline-none focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					<div>
						<label className='mb-1.5 block text-sm font-bold text-black'>Mô tả</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder='Mô tả ngắn về nội dung tài nguyên'
							maxLength={2000}
							rows={4}
							className='w-full resize-none rounded-lg border-2 border-black p-3 text-sm font-medium text-black placeholder-gray-400 outline-none focus:shadow-[0_0_0_3px_#A3E635]'
						/>
					</div>

					<div className='grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]'>
						<div>
							<label htmlFor='resource-link-type' className='mb-1.5 block text-sm font-bold text-black'>Loại link</label>
							<NeoSelect
								id='resource-link-type'
								options={LINK_TYPE_OPTIONS}
								value={linkType}
								onChange={(value) => setLinkType(value as ResourceLinkType)}
							/>
						</div>
						<div>
							<label className='mb-1.5 block text-sm font-bold text-black'>Link</label>
							<input
								type='text'
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder='https://...'
								className='w-full rounded-lg border-2 border-black p-3 text-sm font-medium text-black placeholder-gray-400 outline-none focus:shadow-[0_0_0_3px_#A3E635]'
							/>
						</div>
					</div>

					{formError && (
						<p className='rounded-lg border-2 border-red-600 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600'>
							{formError}
						</p>
					)}

					<div className='flex justify-end pt-2'>
						<button
							type='submit'
							disabled={isSubmitting}
							className='inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'>
							{isSubmitting ? "Đang gửi..." : "Đóng góp tài nguyên"}
							<Send className='h-4 w-4' />
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ResourceCreatePage;
