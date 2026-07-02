import React, { useState } from "react";
import { Flag, X } from "lucide-react";
import { resourceService } from "@/services/resource.service";
import type { ResourceReportReason } from "@/types/resource.types";

interface Props {
	resourceId: number;
	onClose: () => void;
	onSuccess?: () => void;
}

const REASON_OPTIONS: { value: ResourceReportReason; label: string }[] = [
	{ value: "inappropriate", label: "Nội dung không phù hợp" },
	{ value: "broken_link", label: "Link hỏng hoặc không truy cập được" },
	{ value: "copyright", label: "Vi phạm bản quyền" },
	{ value: "other", label: "Khác" },
];

const ReportResourceModal: React.FC<Props> = ({ resourceId, onClose, onSuccess }) => {
	const [step, setStep] = useState<"form" | "done">("form");
	const [reason, setReason] = useState<ResourceReportReason>("inappropriate");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);
		try {
			await resourceService.reportResource(resourceId, reason, description || undefined);
			onSuccess?.();
			setStep("done");
		} catch {
			setStep("done");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
			onClick={(e) => e.target === e.currentTarget && onClose()}>
			<div className='w-full max-w-md rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
				{step === "form" ? (
					<>
						<div className='flex items-center justify-between border-b-2 border-black px-5 py-4'>
							<h2 className='font-heading text-base font-extrabold text-black'>Báo cáo tài nguyên</h2>
							<button
								onClick={onClose}
								className='rounded-lg border-2 border-transparent p-1 transition hover:border-black hover:bg-gray-100'>
								<X className='h-4 w-4' />
							</button>
						</div>

						<form onSubmit={handleSubmit} className='space-y-4 p-5'>
							<p className='text-sm text-gray-500'>Chọn lý do báo cáo:</p>
							<div className='space-y-2'>
								{REASON_OPTIONS.map((opt) => (
									<label
										key={opt.value}
										className='flex cursor-pointer items-center gap-3 rounded-xl border-2 border-black px-4 py-3 transition hover:bg-gray-50 has-[:checked]:bg-primary'>
										<input
											type='radio'
											name='reason'
											value={opt.value}
											checked={reason === opt.value}
											onChange={() => setReason(opt.value)}
											className='accent-black'
										/>
										<span className='text-sm font-bold text-black'>{opt.label}</span>
									</label>
								))}
							</div>

							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder='Mô tả chi tiết (không bắt buộc)...'
								maxLength={1000}
								rows={3}
								className='w-full resize-none rounded-lg border-2 border-black p-3 text-sm font-medium text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary'
							/>

							<div className='flex justify-end gap-3 pt-2'>
								<button
									type='button'
									onClick={onClose}
									className='rounded-lg px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-100'>
									Hủy
								</button>
								<button
									type='submit'
									disabled={submitting}
									className='rounded-lg border-2 border-black bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'>
									{submitting ? "Đang gửi..." : "Gửi báo cáo"}
								</button>
							</div>
						</form>
					</>
				) : (
					<div className='flex flex-col items-center px-8 py-10 text-center'>
						<div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-300'>
							<Flag strokeWidth={3} className='h-7 w-7 text-white' />
						</div>
						<h2 className='font-heading text-lg font-extrabold text-black'>Cảm ơn bạn đã báo cáo!</h2>
						<p className='mt-2 text-sm text-gray-500'>Chúng tôi sẽ xem xét tài nguyên này sớm nhất có thể.</p>
						<button
							onClick={onClose}
							className='mt-6 rounded-lg border-2 border-black bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Đóng
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReportResourceModal;
