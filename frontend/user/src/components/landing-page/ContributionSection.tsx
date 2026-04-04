import React, { useEffect, useRef, useState } from "react";
import { Upload, X, FileText, CheckCircle } from "lucide-react";

const ContributionSection: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		const el = sectionRef.current;
		if (!el) return;
		const items = el.querySelectorAll(".fade-in-up");
		const observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
			{ threshold: 0.1 },
		);
		items.forEach((item) => observer.observe(item));
		return () => observer.disconnect();
	}, []);

	// Close modal on Escape
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsModalOpen(false);
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
		setTimeout(() => {
			setSubmitted(false);
			setIsModalOpen(false);
		}, 2000);
	};

	return (
		<>
			<section ref={sectionRef} id='contribute' className='neo-section'>
				<div className='neo-container'>
					<div
						className='fade-in-up rounded-2xl p-12 flex flex-col sm:flex-row items-center justify-between gap-8 border-2 border-black'
						style={{
							background: "var(--color-pastel-green)",
							boxShadow: "var(--neo-shadow)",
						}}>
						{/* Text */}
						<div className='space-y-3 text-center sm:text-left'>
							<h2
								className='text-2xl sm:text-3xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								Góp phần xây dựng kho tài nguyên chung
							</h2>
							<p className='text-gray-700 max-w-lg'>
								Chia sẻ tài liệu, code, slide hay bất kỳ thứ gì hữu ích với hơn{" "}
								<strong>1000+ sinh viên IT</strong> trong cộng đồng CKC IT CLUB.
							</p>
						</div>

						{/* CTA */}
						<button
							className='neo-btn neo-btn-primary text-base px-8 py-4 shrink-0'
							onClick={() => setIsModalOpen(true)}>
							<Upload className='w-5 h-5' />
							Đóng góp tài nguyên
						</button>
					</div>
				</div>
			</section>

			{/* Upload Modal */}
			{isModalOpen && (
				<div
					className='fixed inset-0 z-[100] flex items-center justify-center p-4'
					style={{ background: "rgba(0,0,0,0.5)" }}
					onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
					<div
						className='w-full max-w-md bg-white rounded-2xl border-2 border-black animate-[fadeInUp_0.3s_ease-out_forwards]'
						style={{ boxShadow: "8px 8px 0px #111" }}>
						{/* Modal header */}
						<div className='flex items-center justify-between p-6 border-b-2 border-black'>
							<h3
								className='text-xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								📤 Đóng góp tài nguyên
							</h3>
							<button
								onClick={() => setIsModalOpen(false)}
								className='p-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors'>
								<X className='w-4 h-4' />
							</button>
						</div>

						{/* Modal body */}
						{submitted ? (
							<div className='p-8 flex flex-col items-center gap-4 text-center'>
								<CheckCircle className='w-16 h-16 text-green-500' />
								<h4
									className='text-xl font-bold'
									style={{ fontFamily: "var(--font-heading)" }}>
									Cảm ơn bạn! 🎉
								</h4>
								<p className='text-gray-600'>
									Tài nguyên của bạn đã được gửi đi và đang chờ duyệt.
								</p>
							</div>
						) : (
							<form onSubmit={handleSubmit} className='p-6 space-y-5'>
								<div className='space-y-2'>
									<label
										className='text-sm font-bold text-black block'
										style={{ fontFamily: "var(--font-heading)" }}>
										Tiêu đề tài nguyên *
									</label>
									<input
										type='text'
										required
										placeholder='Ví dụ: Slide React hooks cơ bản...'
										className='w-full px-4 py-3 border-2 border-black rounded-xl text-sm focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_#A3E635]'
									/>
								</div>
								<div className='space-y-2'>
									<label
										className='text-sm font-bold text-black block'
										style={{ fontFamily: "var(--font-heading)" }}>
										Loại tài nguyên *
									</label>
									<select
										required
										className='w-full px-4 py-3 border-2 border-black rounded-xl text-sm focus:outline-none'>
										<option value=''>Chọn loại...</option>
										<option>Slide / Tài liệu</option>
										<option>Mã nguồn</option>
										<option>Video</option>
										<option>Khác</option>
									</select>
								</div>
								<div className='space-y-2'>
									<label
										className='text-sm font-bold text-black block'
										style={{ fontFamily: "var(--font-heading)" }}>
										Link tài nguyên *
									</label>
									<input
										type='url'
										required
										placeholder='https://drive.google.com/...'
										className='w-full px-4 py-3 border-2 border-black rounded-xl text-sm focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'
									/>
								</div>
								<div className='space-y-2'>
									<label
										className='text-sm font-bold text-black block'
										style={{ fontFamily: "var(--font-heading)" }}>
										Mô tả ngắn
									</label>
									<textarea
										rows={3}
										placeholder='Mô tả nội dung tài nguyên này...'
										className='w-full px-4 py-3 border-2 border-black rounded-xl text-sm resize-none focus:outline-none focus:shadow-[0_0_0_3px_#A3E635]'
									/>
								</div>
								<button
									type='submit'
									className='neo-btn neo-btn-primary w-full justify-center py-3'>
									<FileText className='w-4 h-4' />
									Gửi tài nguyên
								</button>
							</form>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default ContributionSection;
