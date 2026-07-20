import React, { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";
import { homeService, DEFAULT_HOME_CONTENT } from "@/services/home.service";

type MainLayoutOutletContext = {
	user: AuthUser | null;
};

const ContributionSection: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const { user } = useOutletContext<MainLayoutOutletContext>();
	const [content, setContent] = useState(DEFAULT_HOME_CONTENT.contribution);

	useEffect(() => {
		let cancelled = false;
		homeService.getHomeContent().then((c) => {
			if (!cancelled) setContent(c.contribution);
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
							{content.heading}
						</h2>
						<p
							className='about-prose text-gray-700 max-w-lg'
							dangerouslySetInnerHTML={{ __html: content.body_html }}
						/>
					</div>

					{/* CTA */}
					<Link
						to={user ? "/tai-nguyen/gui" : "/login"}
						className='neo-btn neo-btn-primary text-base px-8 py-4 shrink-0'>
						<Upload className='w-5 h-5' />
						{content.button_label}
					</Link>
				</div>
			</div>
		</section>
	);
};

export default ContributionSection;
