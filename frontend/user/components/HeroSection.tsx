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
		<section
			ref={heroRef}
			className='relative min-h-screen flex items-center overflow-hidden bg-white pt-16'>
			{/* Pastel blob decorations */}
			<div
				className='absolute top-16 left-[-80px] w-72 h-72 rounded-full opacity-70 animate-float'
				style={{ background: "var(--color-pastel-blue)", filter: "blur(0px)", zIndex: 0 }}
			/>
			<div
				className='absolute top-40 right-[-60px] w-64 h-64 rounded-full opacity-60 animate-float'
				style={{ background: "var(--color-pastel-pink)", animationDelay: "2s", zIndex: 0 }}
			/>
			<div
				className='absolute bottom-24 left-1/4 w-48 h-48 rounded-full opacity-50 animate-float'
				style={{
					background: "var(--color-pastel-yellow)",
					animationDelay: "4s",
					zIndex: 0,
				}}
			/>
			<div
				className='absolute bottom-12 right-1/4 w-40 h-40 rounded-full opacity-50 animate-float'
				style={{ background: "var(--color-pastel-green)", animationDelay: "1s", zIndex: 0 }}
			/>
			<div
				className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full opacity-40 animate-float'
				style={{
					background: "var(--color-pastel-purple)",
					animationDelay: "3s",
					zIndex: 0,
				}}
			/>

			<div className='neo-container px-6 relative z-10'>
				<div className='grid lg:grid-cols-2 gap-12 items-center'>
					{/* Left: Text content */}
					<div className='space-y-8'>
						{/* Badge */}
						<div
							className='fade-in-up inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black text-xs font-semibold'
							style={{
								background: "var(--color-pastel-green)",
								boxShadow: "2px 2px 0px #111",
							}}>
							Trường Cao đẳng Kỹ thuật Cao Thắng
						</div>

						{/* Main headline */}
						<div className='fade-in-up' style={{ transitionDelay: "0.1s" }}>
							<h1
								className='text-[2.75rem] sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								CKC IT CLUB
								<br />
								<span
									className='relative inline-block'
									style={{
										background: "var(--color-primary)",
										padding: "0 0.2em",
										border: "2px solid #111",
										borderRadius: "8px",
										boxShadow: "3px 3px 0px #111",
									}}>
									Học IT
								</span>{" "}
								dễ hơn khi bạn không học một mình
							</h1>
						</div>

						{/* Subheadline */}
						<p
							className='fade-in-up text-lg text-gray-600 max-w-lg leading-relaxed'
							style={{ fontFamily: "var(--font-body)", transitionDelay: "0.2s" }}>
							Khám phá tài nguyên, tham gia sự kiện và phát triển kỹ năng cùng hơn{" "}
							<strong className='text-black'>1000+ sinh viên IT</strong> tại Cao
							Thắng.
						</p>

						{/* Stats row */}
						<div className='fade-in-up flex gap-6' style={{ transitionDelay: "0.25s" }}>
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

					{/* Right: SVG Illustration */}
					<div
						className='fade-in-up hidden lg:flex items-center justify-center'
						style={{ transitionDelay: "0.4s" }}>
						<div className='relative'>
							{/* Decorative card behind illustration */}
							<div
								className='absolute inset-0 rounded-2xl rotate-3'
								style={{
									background: "var(--color-pastel-blue)",
									border: "var(--neo-border)",
									transform: "rotate(4deg) translate(8px, 8px)",
								}}
							/>
							<div
								className='relative rounded-2xl p-8 bg-white'
								style={{
									border: "var(--neo-border)",
									boxShadow: "var(--neo-shadow)",
								}}>
								{/* Student at laptop SVG illustration */}
								<svg
									viewBox='0 0 400 300'
									className='w-full max-w-sm'
									xmlns='http://www.w3.org/2000/svg'>
									{/* Desk */}
									<rect
										x='40'
										y='240'
										width='320'
										height='12'
										rx='4'
										fill='#111'
									/>
									{/* Laptop base */}
									<rect
										x='100'
										y='200'
										width='200'
										height='40'
										rx='6'
										fill='#333'
									/>
									<rect
										x='90'
										y='195'
										width='220'
										height='8'
										rx='3'
										fill='#555'
									/>
									{/* Laptop screen */}
									<rect
										x='100'
										y='80'
										width='200'
										height='120'
										rx='8'
										fill='#1a1a1a'
										stroke='#111'
										strokeWidth='2'
									/>
									{/* Screen content */}
									<rect
										x='116'
										y='96'
										width='168'
										height='88'
										rx='4'
										fill='#0d1117'
									/>
									{/* Code lines */}
									<rect
										x='122'
										y='106'
										width='60'
										height='4'
										rx='2'
										fill='#A3E635'
									/>
									<rect
										x='122'
										y='116'
										width='100'
										height='4'
										rx='2'
										fill='#BFD9FE'
									/>
									<rect
										x='130'
										y='126'
										width='80'
										height='4'
										rx='2'
										fill='#FFDEDE'
									/>
									<rect
										x='130'
										y='136'
										width='60'
										height='4'
										rx='2'
										fill='#FAE9FF'
									/>
									<rect
										x='122'
										y='146'
										width='90'
										height='4'
										rx='2'
										fill='#A3E635'
									/>
									<rect
										x='122'
										y='156'
										width='70'
										height='4'
										rx='2'
										fill='#BFD9FE'
									/>
									{/* Cursor blink */}
									<rect
										x='196'
										y='156'
										width='2'
										height='12'
										rx='1'
										fill='#A3E635'
										opacity='0.8'
									/>
									{/* Student character (simple) */}
									{/* Head */}
									<circle
										cx='200'
										cy='48'
										r='22'
										fill='#FBBF24'
										stroke='#111'
										strokeWidth='2'
									/>
									{/* Eyes */}
									<circle cx='192' cy='44' r='3' fill='#111' />
									<circle cx='208' cy='44' r='3' fill='#111' />
									{/* Smile */}
									<path
										d='M192 54 Q200 60 208 54'
										stroke='#111'
										strokeWidth='2'
										fill='none'
										strokeLinecap='round'
									/>
									{/* Hair */}
									<path
										d='M178 42 Q190 20 212 26 Q224 30 222 44'
										fill='#333'
										stroke='#111'
										strokeWidth='1.5'
									/>
									{/* Body */}
									<rect
										x='180'
										y='70'
										width='40'
										height='30'
										rx='8'
										fill='#BFD9FE'
										stroke='#111'
										strokeWidth='2'
									/>
									{/* Floating badges around */}
									<g transform='translate(330, 90)'>
										<rect
											x='0'
											y='0'
											width='50'
											height='28'
											rx='8'
											fill='#D2FAE5'
											stroke='#111'
											strokeWidth='2'
										/>
										<text
											x='8'
											y='18'
											fontSize='10'
											fontWeight='bold'
											fill='#111'>
											React
										</text>
									</g>
									<g transform='translate(20, 100)'>
										<rect
											x='0'
											y='0'
											width='55'
											height='28'
											rx='8'
											fill='#FFDEDE'
											stroke='#111'
											strokeWidth='2'
										/>
										<text
											x='6'
											y='18'
											fontSize='10'
											fontWeight='bold'
											fill='#111'>
											Python
										</text>
									</g>
									<g transform='translate(330, 150)'>
										<rect
											x='0'
											y='0'
											width='50'
											height='28'
											rx='8'
											fill='#FEF3C8'
											stroke='#111'
											strokeWidth='2'
										/>
										<text
											x='10'
											y='18'
											fontSize='10'
											fontWeight='bold'
											fill='#111'>
											Git
										</text>
									</g>
									<g transform='translate(20, 155)'>
										<rect
											x='0'
											y='0'
											width='50'
											height='28'
											rx='8'
											fill='#FAE9FF'
											stroke='#111'
											strokeWidth='2'
										/>
										<text
											x='8'
											y='18'
											fontSize='10'
											fontWeight='bold'
											fill='#111'>
											Node
										</text>
									</g>
								</svg>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom wave border */}
			<div className='absolute bottom-0 left-0 right-0 h-1 bg-black' />
		</section>
	);
};

export default HeroSection;
