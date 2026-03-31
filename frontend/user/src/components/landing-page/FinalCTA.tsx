import React, { useEffect, useRef } from "react";
import { ArrowRight, Zap } from "lucide-react";

const FinalCTA: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);

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

	return (
		<section ref={sectionRef} id='join' className='neo-section bg-white'>
			<div className='neo-container'>
				<div
					className='fade-in-up relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-black py-10 px-6 sm:p-16 text-center'
					style={{
						background: "var(--color-primary)",
						boxShadow: "6px 6px 0px #111",
					}}>
					{/* Background decorative shapes */}
					<div className='absolute top-[-40px] left-[-40px] w-48 h-48 rounded-full border-2 border-black/20 opacity-30' />
					<div className='absolute bottom-[-60px] right-[-40px] w-64 h-64 rounded-full border-2 border-black/20 opacity-20' />
					<div className='absolute top-8 right-12 w-24 h-24 rounded-xl rotate-12 border-2 border-black/20 opacity-30' />

					<div className='relative z-10 space-y-4 sm:space-y-6'>
						{/* Badge */}
						<div
							className='inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full border-2 border-black bg-white text-[10px] sm:text-sm font-bold'
							style={{ boxShadow: "2px 2px 0px #111" }}>
							<Zap className='w-3 h-3 sm:w-4 sm:h-4 text-yellow-500' />
							Miễn phí — Không cần kinh nghiệm
						</div>

						{/* Main headline */}
						<h2
							className='text-2xl sm:text-5xl lg:text-6xl font-extrabold text-black leading-tight px-2'
							style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.02em" }}>
							Tham gia cộng đồng{" "}
							<span
								className='inline-block px-2 py-0.5 sm:py-1 bg-white rounded-lg sm:rounded-xl border-2 border-black mt-1 sm:mt-0'
								style={{ boxShadow: "2px 2px 0px #111" }}>
								1000+ sinh viên IT
							</span>{" "}
							ngay hôm nay
						</h2>

						{/* Sub text */}
						<p
							className='text-gray-800 text-sm sm:text-xl max-w-2xl mx-auto px-4'
							style={{ fontFamily: "var(--font-body)" }}>
							Chỉ cần đam mê. Mọi thứ khác — tài nguyên, mentor, cộng đồng — chúng tôi
							đã có sẵn cho bạn.
						</p>

						{/* CTA Button */}
						<div className='flex justify-center pt-2'>
							<a
								href='#'
								className='inline-flex items-center justify-center gap-3 w-full max-w-[280px] sm:w-auto px-5 sm:px-10 py-3 sm:py-4 bg-black text-white rounded-xl neo-btn text-sm sm:text-lg'
								style={{
									fontFamily: "var(--font-heading)",
									boxShadow: "4px 4px 0px rgba(0,0,0,0.3)",
								}}>
								Tham gia ngay miễn phí
								<ArrowRight className='w-4 h-4 sm:w-5 sm:h-5' />
							</a>
						</div>

						{/* Trust micro-text */}
						<p className='text-[10px] sm:text-sm text-black/60 font-medium'>
							✓ Không spam &nbsp;·&nbsp; ✓ Không mất tiền &nbsp;·&nbsp; ✓ Hủy bất cứ
							lúc nào
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default FinalCTA;
