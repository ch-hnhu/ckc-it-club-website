import React, { useState } from "react";
import { Flag, X } from "lucide-react";
import { postService } from "@/services/post.service";
import type { PostReportReason } from "@/types/post.types";

interface Props {
	postId: number;
	onClose: () => void;
}

const REASON_OPTIONS: { value: PostReportReason; label: string }[] = [
	{ value: "spam", label: "Spam" },
	{ value: "offensive", label: "Nội dung phản cảm" },
	{ value: "misinformation", label: "Thông tin sai lệch" },
	{ value: "inappropriate", label: "Không phù hợp" },
	{ value: "other", label: "Khác" },
];

const ReportPostModal: React.FC<Props> = ({ postId, onClose }) => {
	const [step, setStep] = useState<"form" | "done">("form");
	const [reason, setReason] = useState<PostReportReason>("spam");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);
		try {
			await postService.reportPost(postId, reason, reason === "other" ? description : undefined);
			setStep("done");
		} catch {
			// already reported or other error — still show thank-you
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
							<div className='flex items-center gap-2'>
								<Flag className='h-5 w-5 text-red-500' />
								<h2 className='font-heading text-base font-extrabold text-black'>
									Báo cáo bài viết
								</h2>
							</div>
							<button
								onClick={onClose}
								className='rounded-lg border-2 border-transparent p-1 transition hover:border-black hover:bg-gray-100'>
								<X className='h-4 w-4' />
							</button>
						</div>

						<form onSubmit={handleSubmit} className='p-5 space-y-4'>
							<p className='text-sm text-gray-500'>Chọn lý do báo cáo:</p>
							<div className='space-y-2'>
								{REASON_OPTIONS.map((opt) => (
									<label
										key={opt.value}
										className='flex cursor-pointer items-center gap-3 rounded-xl border-2 border-black px-4 py-3 transition hover:bg-gray-50 has-[:checked]:bg-[var(--color-pastel-yellow)]'>
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

							{reason === "other" && (
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder='Mô tả chi tiết lý do báo cáo...'
									maxLength={1000}
									rows={3}
									className='w-full resize-none rounded-xl border-2 border-black p-3 text-sm font-medium text-black placeholder-gray-400 outline-none focus:ring-2 focus:ring-black'
								/>
							)}

							<div className='flex justify-end gap-3 pt-2'>
								<button
									type='button'
									onClick={onClose}
									className='rounded-xl border-2 border-black px-4 py-2 text-sm font-bold text-black transition hover:bg-gray-100'>
									Hủy
								</button>
								<button
									type='submit'
									disabled={submitting}
									className='rounded-xl border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[2px_2px_0_#991b1b] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60'>
									{submitting ? "Đang gửi..." : "Gửi báo cáo"}
								</button>
							</div>
						</form>
					</>
				) : (
					<div className='flex flex-col items-center px-8 py-10 text-center'>
						<div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-black bg-[var(--color-primary)]'>
							<Flag className='h-7 w-7 text-black' />
						</div>
						<h2 className='font-heading text-lg font-extrabold text-black'>
							Cảm ơn bạn đã báo cáo!
						</h2>
						<p className='mt-2 text-sm text-gray-500'>
							Chúng tôi sẽ xem xét bài viết này sớm nhất có thể.
						</p>
						<button
							onClick={onClose}
							className='mt-6 rounded-xl border-2 border-black bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-black shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							Đóng
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReportPostModal;
