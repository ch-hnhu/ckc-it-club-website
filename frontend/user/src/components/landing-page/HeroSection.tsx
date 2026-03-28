import React, { useEffect, useRef } from "react";
import { ArrowRight, Users } from "lucide-react";

const HeroSection: React.FC = () => {
	const heroRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = heroRef.current;
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
		<>
			<section
				ref={heroRef}
				className='relative min-h-screen flex items-center overflow-hidden bg-white pt-16'>
				{/* Pastel blob decorations */}

				<div className='neo-container px-6 relative z-10'>
					<div className='flex flex-col items-center justify-center'>
						<div className='flex flex-col items-center justify-center space-y-5'>
							{/* Badge */}
							<div
								className='fade-in-up inline-flex items-center px-3 py-1 rounded-full border-2 border-black text-xs font-semibold'
								style={{
									background: "white",
									boxShadow: "2px 2px 0px #111",
								}}>
								Trường Cao đẳng Kỹ thuật Cao Thắng
							</div>

							{/* Main headline */}
							<div
								className='fade-in-up text-center'
								style={{ transitionDelay: "0.1s" }}>
								<h1
									className='text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.3] tracking-tight text-black'
									style={{ fontFamily: "var(--font-heading)" }}>
									CKC IT CLUB
									<br />
									<span
										className='text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-extrabold'
										style={{
											background: "var(--color-primary)",
											padding: "0 0.2em",
											border: "2px solid #111",
											borderRadius: "8px",
											boxShadow: "3px 3px 0px #111",
										}}>
										Học IT
									</span>{" "}
									dễ hơn khi bạn
									<br />
									không học một mình
								</h1>
							</div>

							{/* Subheadline */}
							<p
								className='fade-in-up text-lg text-gray-600 max-w-lg leading-relaxed text-center'
								style={{ fontFamily: "var(--font-body)", transitionDelay: "0.2s" }}>
								Khám phá tài nguyên, tham gia sự kiện và phát triển kỹ năng cùng hơn{" "}
								<strong className='text-black'>1000+ sinh viên IT</strong> tại Cao
								Thắng.
							</p>

							{/* Stats row */}
							<div
								className='fade-in-up flex gap-6'
								style={{ transitionDelay: "0.25s" }}>
								{[
									{ value: "1000+", label: "Thành viên" },
									{ value: "50+", label: "Tài nguyên" },
									{ value: "20+", label: "Sự kiện/năm" },
								].map((stat) => (
									<div key={stat.label} className='text-center'>
										<div
											className='text-2xl font-extrabold'
											style={{
												fontFamily: "var(--font-heading)",
												color: "var(--color-primary)",
												WebkitTextStroke: "1px #111",
											}}>
											{stat.value}
										</div>
										<div className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
											{stat.label}
										</div>
									</div>
								))}
							</div>

							{/* CTA Buttons */}
							<div
								className='fade-in-up flex flex-wrap gap-4'
								style={{ transitionDelay: "0.3s" }}>
								<a
									href='#resources'
									className='neo-btn neo-btn-primary text-base px-6 py-3'>
									Khám phá ngay
									<ArrowRight className='w-5 h-5' />
								</a>
								<a
									href='#about'
									className='neo-btn neo-btn-secondary text-base px-6 py-3'>
									<Users className='w-5 h-5' />
									Tham gia CLB
								</a>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom wave border */}
				<div className='hero_bg'></div>

				{/* Decorative Floating SVGs */}
				<div
					className='absolute inset-0 pointer-events-none overflow-hidden'
					style={{ zIndex: 1 }}>
					{/* Left cluster */}
					<img
						src='/assets/svg/20.svg'
						className='absolute top-[18%] left-[5%] w-32 md:w-40 opacity-80 animate-float'
						style={{ animationDelay: "0s" }}
					/>
					<img
						src='/assets/svg/21.svg'
						className='absolute top-[42%] left-[-3%] w-44 md:w-56 opacity-70 animate-float'
						style={{ animationDelay: "2s" }}
					/>
					<img
						src='/assets/svg/22.svg'
						className='absolute top-[68%] left-[10%] w-24 md:w-32 opacity-90 animate-float'
						style={{ animationDelay: "4s" }}
					/>

					{/* Right cluster */}
					<img
						src='/assets/svg/23.svg'
						className='absolute top-[15%] right-[4%] w-36 md:w-48 opacity-80 animate-float'
						style={{ animationDelay: "1.5s" }}
					/>
					<img
						src='/assets/svg/24.svg'
						className='absolute top-[50%] right-[-4%] w-52 md:w-64 opacity-60 animate-float'
						style={{ animationDelay: "3s" }}
					/>
					<img
						src='/assets/svg/25.svg'
						className='absolute top-[75%] right-[8%] w-32 md:w-40 opacity-90 animate-float'
						style={{ animationDelay: "0.5s" }}
					/>
					<img
						src='/assets/svg/26.svg'
						className='absolute top-[35%] right-[15%] w-24 md:w-32 opacity-50 animate-float'
						style={{ animationDelay: "5s" }}
					/>
				</div>
				<div className='wrapper home_wave'>
					<div className='light_curve-image'></div>
				</div>
				<div className='absolute bottom-0 left-0 right-0 h-1 bg-black' />
			</section>
		</>
	);
};

export default HeroSection;
