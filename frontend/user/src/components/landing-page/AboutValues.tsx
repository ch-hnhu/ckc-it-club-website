import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { homeService, DEFAULT_HOME_CONTENT } from "@/services/home.service";

const AboutValues: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const [about, setAbout] = useState(DEFAULT_HOME_CONTENT.about);

	useEffect(() => {
		let cancelled = false;
		homeService.getHomeContent().then((c) => {
			if (!cancelled) setAbout(c.about);
		});
		return () => {
			cancelled = true;
		};
	}, []);

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
		<section
			ref={sectionRef}
			id='about'
			className='neo-section relative overflow-visible mt-24'
			style={{
				background: "linear-gradient(#B4EDD8, #99e2c7ff 35%, #93d8bfff 55%)",
				paddingTop: 0,
			}}>
			<div className='wrapper home_wave'>
				<div className='light_curve-image'></div>
			</div>

			{/* Sea Bubbles at the bottom (Placed before container to be behind content) */}
			<div
				className='absolute bottom-0 left-0 right-0 h-[600px] pointer-events-none overflow-hidden'
				style={{ zIndex: 0 }}>
				{/* Left Side Bubbles */}
				<img
					src='/assets/svg/27.svg'
					className='absolute -bottom-[0%] -left-[20%] w-[700px] opacity-100 animate-bubble-rise'
					style={{ animationDelay: "0s" }}
				/>
				<img
					src='/assets/svg/28.svg'
					className='absolute bottom-[0%] -left-[20%] w-[520px] opacity-100 animate-bubble-rise'
					style={{ animationDelay: "2s" }}
				/>
				<img
					src='/assets/svg/29.svg'
					className='absolute bottom-[0%] left-[20%] w-[480px] opacity-100 animate-bubble-rise'
					style={{ animationDelay: "1s" }}
				/>

				{/* Right Side Bubbles */}
				<img
					src='/assets/svg/32.svg'
					className='absolute -bottom-[15%] -right-[10%] w-[450px] opacity-100 animate-bubble-rise'
					style={{ animationDelay: "4s" }}
				/>
				<img
					src='/assets/svg/33.svg'
					className='absolute bottom-[0%] -right-[5%] w-[480px] opacity-100 animate-bubble-rise'
					style={{ animationDelay: "2.5s" }}
				/>
				<img
					src='/assets/svg/35.svg'
					className='absolute bottom-[8%] right-[2%] w-[400px] opacity-100 animate-bubble-rise'
					style={{ animationDelay: "3.5s" }}
				/>

				{/* Center-Bottom Accents */}
				<img
					src='/assets/svg/30.svg'
					className='absolute -bottom-[20%] left-[40%] w-[450px] opacity-100 animate-bubble-rise'
					style={{ animationDelay: "3s" }}
				/>
			</div>

			<div className='neo-container'>
				<div className='grid lg:grid-cols-2 gap-16 items-center'>
					{/* Left: About text */}
					<div className='fade-in-up space-y-6'>
						<div>
							<div className='section-divider' style={{ margin: "0 0 1rem" }} />
							<h2
								className='text-3xl sm:text-4xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								{about.heading}
							</h2>
						</div>
						{about.paragraphs_html.map((para, i) => (
							<p
								key={i}
								className={`about-prose text-gray-600 leading-relaxed${
									i === 0 ? " text-lg" : ""
								}`}
								dangerouslySetInnerHTML={{ __html: para }}
							/>
						))}

						{/* Milestones */}
						<div className='grid grid-cols-3 gap-4'>
							{about.milestones.map((m) => (
								<div
									key={m.label}
									className='neo-card p-4 text-center'
									style={{ background: "white" }}>
									<div
										className='text-xl font-extrabold'
										style={{
											fontFamily: "var(--font-heading)",
											color: "var(--color-primary)",
											WebkitTextStroke: "0.5px #111",
										}}>
										{m.value}
									</div>
									<div className='text-xs text-gray-500 font-medium mt-1'>
										{m.label}
									</div>
								</div>
							))}
						</div>

						<a href={about.button_link} className='neo-btn neo-btn-secondary inline-flex'>
							{about.button_label}
							<ArrowRight className='w-4 h-4' />
						</a>
					</div>

					{/* Right: Value cards 2x2 grid */}
					<div className='fade-in-up grid grid-cols-2 gap-5'>
						{about.values.map((val) => (
							<div
								key={val.title}
								className='neo-card p-5 flex flex-col gap-3'
								style={{ background: val.bg }}>
								<div className='text-3xl'>{val.emoji}</div>
								<div>
									<h3
										className='font-extrabold text-lg text-black'
										style={{ fontFamily: "var(--font-heading)" }}>
										{val.title}
									</h3>
									<p className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
										{val.subtitle}
									</p>
								</div>
								<p className='text-sm text-gray-700 leading-relaxed'>{val.desc}</p>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className='absolute bottom-0 left-0 right-0 h-1 bg-black' />
		</section>
	);
};

export default AboutValues;
