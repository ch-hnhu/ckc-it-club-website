import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
	ArrowRight,
	Target,
	Telescope,
	Users,
	ChevronDown,
	GraduationCap,
} from "lucide-react";
import BoardSection from "@/components/landing-page/BoardSection";
import { resolveAboutIcon } from "@/lib/aboutIcons";
import { aboutService, DEFAULT_ABOUT_CONTENT } from "@/services/about.service";
import type { AboutContent } from "@/types/about.types";

/* ============================================================
   Trang Về chúng tôi — nội dung lấy từ API (dạng config).
   Khởi tạo bằng nội dung mặc định để lần render đầu vẫn đầy đủ,
   sau đó cập nhật khi API trả về. Giao diện giữ nguyên như bản gốc.
   ============================================================ */

const AboutPage: React.FC = () => {
	const pageRef = useRef<HTMLDivElement>(null);
	const [openFaq, setOpenFaq] = useState<number | null>(0);
	const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);

	// Tải nội dung từ backend
	useEffect(() => {
		let mounted = true;
		aboutService.getAboutContent().then((data) => {
			if (mounted) setContent(data);
		});
		return () => {
			mounted = false;
		};
	}, []);

	// Observer chung cấp trang cho mọi phần tử .fade-in-up (chạy lại khi nội dung đổi)
	useEffect(() => {
		const el = pageRef.current;
		if (!el) return;
		const items = el.querySelectorAll(".fade-in-up");
		const observer = new IntersectionObserver(
			(entries) =>
				entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
			{ threshold: 0.1 },
		);
		items.forEach((item) => observer.observe(item));
		return () => observer.disconnect();
	}, [content]);

	const { hero, story, mission, vision, stats, values, timeline, departments, faqs, cta } =
		content;

	return (
		<div ref={pageRef}>
			{/* ============ 1. HERO ============ */}
			<section className='relative flex items-center overflow-x-hidden bg-white pt-28 pb-20'>
				<div className='neo-container px-6 relative z-10'>
					<div className='flex flex-col items-center justify-center space-y-6 text-center'>
						<div
							className='fade-in-up inline-flex items-center px-3 py-1 rounded-full border-2 border-black text-xs font-semibold'
							style={{ background: "white", boxShadow: "2px 2px 0px #111" }}>
							{hero.badge}
						</div>

						<h1
							className='fade-in-up text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.3] tracking-tight text-black max-w-3xl'
							style={{ fontFamily: "var(--font-heading)", transitionDelay: "0.1s" }}>
							{hero.title_prefix}{" "}
							<span
								className='inline-block'
								style={{
									background: "var(--color-primary)",
									padding: "0 0.2em",
									border: "2px solid #111",
									borderRadius: "8px",
									boxShadow: "3px 3px 0px #111",
								}}>
								{hero.highlight}
							</span>
						</h1>

						<p
							className='about-prose fade-in-up text-lg text-gray-600 max-w-2xl leading-relaxed'
							style={{ fontFamily: "var(--font-body)", transitionDelay: "0.2s" }}
							dangerouslySetInnerHTML={{ __html: hero.lead_html }}
						/>

						<div
							className='fade-in-up flex flex-wrap justify-center gap-4'
							style={{ transitionDelay: "0.3s" }}>
							<Link
								to={hero.primary_link}
								className='neo-btn neo-btn-primary text-base px-6 py-3'>
								<Users className='w-5 h-5' />
								{hero.primary_label}
							</Link>
							<Link
								to={hero.secondary_link}
								className='neo-btn neo-btn-secondary text-base px-6 py-3'>
								{hero.secondary_label}
								<ArrowRight className='w-5 h-5' />
							</Link>
						</div>
					</div>
				</div>

				{/* SVG trang trí nổi */}
				<div className='absolute inset-0 pointer-events-none overflow-hidden' style={{ zIndex: 1 }}>
					<img
						src='/assets/svg/20.svg'
						className='absolute top-[20%] left-[4%] w-24 md:w-36 opacity-70 animate-float'
						style={{ animationDelay: "0s" }}
					/>
					<img
						src='/assets/svg/23.svg'
						className='absolute top-[18%] right-[5%] w-28 md:w-40 opacity-70 animate-float'
						style={{ animationDelay: "1.5s" }}
					/>
					<img
						src='/assets/svg/25.svg'
						className='absolute bottom-[10%] right-[10%] w-20 md:w-28 opacity-80 animate-float'
						style={{ animationDelay: "3s" }}
					/>
					<img
						src='/assets/svg/22.svg'
						className='absolute bottom-[8%] left-[8%] w-20 md:w-28 opacity-80 animate-float'
						style={{ animationDelay: "4s" }}
					/>
				</div>
				<div className='absolute bottom-0 left-0 right-0 h-1 bg-black' />
			</section>

			{/* ============ 2. CÂU CHUYỆN CỦA CHÚNG TÔI ============ */}
			<section className='neo-section' style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div className='grid lg:grid-cols-2 gap-14 items-center'>
						<div className='fade-in-up space-y-6'>
							<div className='section-divider' style={{ margin: "0 0 1rem" }} />
							<h2
								className='text-3xl sm:text-4xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								{story.heading}
							</h2>
							{story.paragraphs.map((para, i) => (
								<p
									key={i}
									className={`about-prose text-gray-600 leading-relaxed${
										i === 0 ? " text-lg" : ""
									}`}
									dangerouslySetInnerHTML={{ __html: para }}
								/>
							))}
						</div>

						<div className='fade-in-up' style={{ transitionDelay: "0.15s" }}>
							<div
								className='neo-card neo-card-static overflow-hidden'
								style={{ background: "white", padding: 0 }}>
								<img
									src={story.image}
									alt={story.heading}
									className='w-full h-full object-cover'
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ============ 3. SỨ MỆNH & TẦM NHÌN ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Sứ mệnh & Tầm nhìn
						</h2>
						<p className='text-gray-500 mt-3'>Điều dẫn lối cho mọi việc chúng tôi làm</p>
					</div>

					<div className='grid md:grid-cols-2 gap-8'>
						<div
							className='fade-in-up neo-card p-8 space-y-4'
							style={{ background: "var(--color-pastel-green)" }}>
							<div
								className='w-14 h-14 rounded-xl flex items-center justify-center border-2 border-black'
								style={{ background: "white", boxShadow: "3px 3px 0 #111" }}>
								<Target className='w-7 h-7 text-black' />
							</div>
							<h3
								className='text-2xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								{mission.title}
							</h3>
							<p className='text-gray-700 leading-relaxed'>{mission.body}</p>
						</div>

						<div
							className='fade-in-up neo-card p-8 space-y-4'
							style={{ background: "var(--color-pastel-blue)", transitionDelay: "0.15s" }}>
							<div
								className='w-14 h-14 rounded-xl flex items-center justify-center border-2 border-black'
								style={{ background: "white", boxShadow: "3px 3px 0 #111" }}>
								<Telescope className='w-7 h-7 text-black' />
							</div>
							<h3
								className='text-2xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								{vision.title}
							</h3>
							<p className='text-gray-700 leading-relaxed'>{vision.body}</p>
						</div>
					</div>
				</div>
			</section>

			{/* ============ 4. GIÁ TRỊ CỐT LÕI ============ */}
			<section className='neo-section' style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Giá trị cốt lõi
						</h2>
						<p className='text-gray-500 mt-3'>Bốn điều làm nên tinh thần CKC IT CLUB</p>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5'>
						{values.map((val, i) => (
							<div
								key={val.title}
								className='fade-in-up neo-card p-6 flex flex-col gap-3'
								style={{ background: val.bg, transitionDelay: `${i * 0.1}s` }}>
								<div className='text-4xl'>{val.emoji}</div>
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
			</section>

			{/* ============ 5. CON SỐ ẤN TƯỢNG ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div
						className='fade-in-up neo-card neo-card-static p-10'
						style={{ background: "var(--color-primary)" }}>
						<div className='grid grid-cols-2 lg:grid-cols-4 gap-8'>
							{stats.map((stat) => (
								<div key={stat.label} className='text-center'>
									<div
										className='text-4xl sm:text-5xl font-extrabold text-white'
										style={{
											fontFamily: "var(--font-heading)",
											WebkitTextStroke: "1.5px #111",
										}}>
										{stat.value}
									</div>
									<div className='text-sm font-bold text-black mt-2 uppercase tracking-wide'>
										{stat.label}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ============ 6. HÀNH TRÌNH PHÁT TRIỂN (TIMELINE) ============ */}
			<section className='neo-section' style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Hành trình phát triển
						</h2>
						<p className='text-gray-500 mt-3'>Những cột mốc đáng nhớ của chúng tôi</p>
					</div>

					<div className='relative max-w-3xl mx-auto'>
						{/* Đường dọc timeline */}
						<div className='absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-black md:-translate-x-1/2' />

						<div className='space-y-8'>
							{timeline.map((item, i) => {
								const Icon = resolveAboutIcon(item.icon);
								const isLeft = i % 2 === 0;
								return (
									<div
										key={`${item.year}-${i}`}
										className={`fade-in-up relative flex items-start gap-6 md:gap-0 ${
											isLeft ? "md:flex-row" : "md:flex-row-reverse"
										}`}
										style={{ transitionDelay: `${i * 0.05}s` }}>
										{/* Chấm mốc + icon */}
										<div
											className='relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2 border-black md:absolute md:left-1/2 md:-translate-x-1/2'
											style={{ background: item.bg, boxShadow: "2px 2px 0 #111" }}>
											<Icon className='w-5 h-5 text-black' />
										</div>

										{/* Nội dung */}
										<div
											className={`neo-card p-5 flex-1 md:w-[calc(50%-2.5rem)] md:flex-none ${
												isLeft ? "md:mr-auto" : "md:ml-auto"
											}`}
											style={{ background: "white" }}>
											<span className='neo-tag' style={{ background: item.bg }}>
												{item.year}
											</span>
											<h3
												className='font-extrabold text-lg text-black mt-3'
												style={{ fontFamily: "var(--font-heading)" }}>
												{item.title}
											</h3>
											<p className='text-sm text-gray-600 leading-relaxed mt-1.5'>
												{item.desc}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			{/* ============ 7. CƠ CẤU CÁC BAN ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Cơ cấu các ban
						</h2>
						<p className='text-gray-500 mt-3'>
							Mỗi ban là một mảnh ghép tạo nên CKC IT CLUB
						</p>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
						{departments.map((dept, i) => {
							const Icon = resolveAboutIcon(dept.icon);
							return (
								<div
									key={dept.title}
									className='fade-in-up neo-card p-6 space-y-4'
									style={{ background: dept.bg, transitionDelay: `${(i % 3) * 0.1}s` }}>
									<div
										className='w-12 h-12 rounded-xl flex items-center justify-center border-2 border-black'
										style={{ background: "white", boxShadow: "2px 2px 0 #111" }}>
										<Icon className='w-6 h-6 text-black' />
									</div>
									<h3
										className='font-extrabold text-lg text-black'
										style={{ fontFamily: "var(--font-heading)" }}>
										{dept.title}
									</h3>
									<p className='text-sm text-gray-700 leading-relaxed'>{dept.desc}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ============ 8. BAN CHỦ NHIỆM (tái dùng component landing) ============ */}
			<BoardSection />

			{/* ============ 9. FAQ ============ */}
			<section className='neo-section'>
				<div className='neo-container'>
					<div className='text-center mb-14 fade-in-up'>
						<div className='section-divider' />
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
							style={{ fontFamily: "var(--font-heading)" }}>
							Câu hỏi thường gặp
						</h2>
						<p className='text-gray-500 mt-3'>Những điều bạn có thể đang thắc mắc</p>
					</div>

					<div className='max-w-3xl mx-auto space-y-4'>
						{faqs.map((faq, i) => {
							const isOpen = openFaq === i;
							return (
								<div
									key={i}
									className='fade-in-up neo-card neo-card-static overflow-hidden'
									style={{ background: "white", padding: 0 }}>
									<button
										type='button'
										onClick={() => setOpenFaq(isOpen ? null : i)}
										className='flex w-full items-center justify-between gap-4 p-5 text-left'>
										<span
											className='font-bold text-black'
											style={{ fontFamily: "var(--font-heading)" }}>
											{faq.q}
										</span>
										<ChevronDown
											className={`w-5 h-5 shrink-0 text-black transition-transform duration-200 ${
												isOpen ? "rotate-180" : ""
											}`}
										/>
									</button>
									{isOpen && (
										<div className='px-5 pb-5 -mt-1'>
											<div className='border-t-2 border-black/10 pt-3 text-sm text-gray-600 leading-relaxed'>
												{faq.a}
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* ============ 10. CTA CUỐI ============ */}
			<section className='neo-section' style={{ background: "var(--color-surface)" }}>
				<div className='neo-container'>
					<div
						className='fade-in-up neo-card neo-card-static p-12 text-center flex flex-col items-center gap-6'
						style={{ background: "var(--color-pastel-green)" }}>
						<div
							className='w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-black'
							style={{ background: "white", boxShadow: "4px 4px 0 #111" }}>
							<GraduationCap className='w-8 h-8 text-black' />
						</div>
						<h2
							className='text-3xl sm:text-4xl font-extrabold text-black max-w-2xl'
							style={{ fontFamily: "var(--font-heading)" }}>
							{cta.title}
						</h2>
						<p
							className='about-prose text-gray-700 max-w-xl'
							dangerouslySetInnerHTML={{ __html: cta.body_html }}
						/>
						<div className='flex flex-wrap justify-center gap-4'>
							<Link to={cta.primary_link} className='neo-btn neo-btn-primary text-base px-8 py-4'>
								<Users className='w-5 h-5' />
								{cta.primary_label}
							</Link>
							<Link
								to={cta.secondary_link}
								className='neo-btn neo-btn-secondary text-base px-8 py-4'>
								{cta.secondary_label}
								<ArrowRight className='w-5 h-5' />
							</Link>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
};

export default AboutPage;
