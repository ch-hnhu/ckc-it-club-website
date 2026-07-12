import React, { useEffect, useRef } from "react";
import { ExternalLink, Github, Linkedin } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const MENTORS = [
	{
		name: "Thầy Lữ Cao Tiến",
		role: "Giảng viên khoa Công nghệ thông tin",
		bio: "Người thầy tận tâm, truyền cảm hứng cho sinh viên trong lĩnh vực lập trình và phát triển phần mềm.",
		tag: "Web Developer",
		tagBg: "var(--color-pastel-blue)",
		avatar: `${BACKEND_URL}/storage/avatars/mentor.jpg`,
	},
];

const MentorSection: React.FC = () => {
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
		<section ref={sectionRef} id='mentors' className='neo-section bg-white'>
			<div className='neo-container'>
				{/* Header */}
				<div className='text-center mb-14 fade-in-up'>
					<div className='section-divider' />
					<h2
						className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
						style={{ fontFamily: "var(--font-heading)" }}>
						Mentor của chúng tôi
					</h2>
					<p className='text-gray-500 mt-3 max-w-xl mx-auto'>
						Được hướng dẫn bởi những chuyên gia có kinh nghiệm thực chiến trong ngành
					</p>
				</div>

				{/* Mentor cards */}
				<div className='fade-in-up flex flex-wrap justify-center gap-8'>
					{MENTORS.map((mentor) => (
						<div
							key={mentor.name}
							className='neo-card bg-white flex flex-col items-center text-center p-8 gap-4 w-full max-w-sm'>
							{/* Avatar */}
							<div
								className='w-20 h-20 rounded-full overflow-hidden border-2 border-black'
								style={{ boxShadow: "3px 3px 0px #111" }}>
								<img
									src={mentor.avatar}
									alt={mentor.name}
									className='w-full h-full object-cover'
									onError={(e) => {
										(e.target as HTMLImageElement).src =
											`https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=A3E635&color=111&bold=true&size=80`;
									}}
								/>
							</div>

							{/* Tag */}
							<span className='neo-tag text-xs' style={{ background: mentor.tagBg }}>
								{mentor.tag}
							</span>

							{/* Name + role */}
							<div>
								<h3
									className='text-lg font-bold text-black'
									style={{ fontFamily: "var(--font-heading)" }}>
									{mentor.name}
								</h3>
								<p className='text-sm font-medium text-gray-500 mt-0.5'>
									{mentor.role}
								</p>
							</div>

							{/* Bio */}
							<p className='text-sm text-gray-600 leading-relaxed flex-grow'>
								{mentor.bio}
							</p>

							{/* Social icons + CTA */}
							<div className='w-full pt-4 border-t-2 border-black/10 flex items-center justify-between mt-auto'>
								<div className='flex gap-3'>
									<a
										href='#'
										className='p-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors'>
										<Github className='w-4 h-4' />
									</a>
									<a
										href='#'
										className='p-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors'>
										<Linkedin className='w-4 h-4' />
									</a>
								</div>
								<a href='#' className='neo-btn neo-btn-primary text-sm px-4 py-2'>
									Xem hồ sơ <ExternalLink className='w-3.5 h-3.5' />
								</a>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default MentorSection;
