import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { homeService, DEFAULT_HOME_CONTENT } from "@/services/home.service";

type MainLayoutOutletContext = {
	user: AuthUser | null;
};

const QuickActions: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const { user } = useOutletContext<MainLayoutOutletContext>();
	const [content, setContent] = useState(DEFAULT_HOME_CONTENT.quick_actions);

	useEffect(() => {
		let cancelled = false;
		homeService.getHomeContent().then((c) => {
			if (!cancelled) setContent(c.quick_actions);
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
			className='neo-section relative overflow-visible'
			style={{ background: "var(--color-surface)" }}
			id='resources'>
			<div className='neo-container'>
				{/* Section header */}
				<div className='relative text-center mb-14 fade-in-up'>
					{/* Decorative images */}
					<img
						src='/assets/img/9.png'
						alt=''
						className='absolute -left-12 top-0 w-24 h-24 opacity-30 animate-float-delayed hidden xl:block rotate-[15deg]'
					/>
					<img
						src='/assets/img/10.png'
						alt=''
						className='absolute -right-12 top-5 w-20 h-20 opacity-30 animate-float hidden xl:block rotate-[-10deg]'
					/>

					<div className='section-divider' />
					<h2
						className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
						style={{ fontFamily: "var(--font-heading)" }}>
						{content.heading}
					</h2>
					<p className='text-gray-500 mt-3 max-w-xl mx-auto'>{content.subheading}</p>
				</div>

				{/* Cards grid */}
				<div className='fade-in-up grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
					{content.items.map((action) => (
						<Link
							key={action.title}
							to={action.requireAuth && !user ? "/login" : action.link}
							className='neo-card flex flex-col p-6 no-underline group'
							style={{
								background: action.bg,
								textDecoration: "none",
							}}>
							{/* Icon + emoji */}
							<div className='flex items-center gap-3 mb-4'>
								<div
									className='w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 border-black bg-white'
									style={{ boxShadow: "2px 2px 0px #111" }}>
									{action.emoji}
								</div>
								<h3
									className='text-lg font-bold text-black'
									style={{ fontFamily: "var(--font-heading)" }}>
									{action.title}
								</h3>
							</div>

							{/* Description */}
							<p
								className='text-sm text-gray-700 flex-grow leading-relaxed'
								style={{ fontFamily: "var(--font-body)" }}>
								{action.desc}
							</p>

							{/* CTA at bottom */}
							<div className='mt-5 pt-4 border-t-2 border-black/20'>
								<span
									className='inline-flex items-center gap-1.5 text-sm font-bold text-black transition-all group-hover:gap-2.5'
									style={{ fontFamily: "var(--font-heading)" }}>
									Xem ngay <ArrowRight className='w-4 h-4' />
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
};

export default QuickActions;
