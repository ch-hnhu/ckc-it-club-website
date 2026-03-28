import React, { useEffect, useRef } from "react";
import {
	BookOpen,
	FileText,
	Trophy,
	Calendar,
	GraduationCap,
	Lightbulb,
	ArrowRight,
} from "lucide-react";

const ACTIONS = [
	{
		icon: BookOpen,
		title: "Tài nguyên",
		desc: "Kho tài liệu phong phú: slide, code, video từ cộng đồng & mentor",
		href: "#resources",
		bg: "var(--color-pastel-green)",
		emoji: "📚",
	},
	{
		icon: FileText,
		title: "Blog",
		desc: "Bài viết kỹ thuật, kinh nghiệm học tập và chia sẻ từ các thành viên",
		href: "#blog",
		bg: "var(--color-pastel-blue)",
		emoji: "✍️",
	},
	{
		icon: Trophy,
		title: "Leaderboard",
		desc: "Xem bảng xếp hạng, tích lũy điểm XP qua các hoạt động của CLB",
		href: "#leaderboard",
		bg: "var(--color-pastel-yellow)",
		emoji: "🏆",
	},
	{
		icon: Calendar,
		title: "Event",
		desc: "Sự kiện workshop, hackathon, seminar hấp dẫn sắp diễn ra",
		href: "#events",
		bg: "var(--color-pastel-pink)",
		emoji: "🎉",
	},
	{
		icon: GraduationCap,
		title: "Course",
		desc: "Các khóa học chất lượng về Web, AI, Mobile, DevOps và hơn thế nữa",
		href: "#courses",
		bg: "var(--color-pastel-purple)",
		emoji: "🎓",
	},
	{
		icon: Lightbulb,
		title: "Đóng góp",
		desc: "Chia sẻ tài nguyên, viết blog, hoặc tổ chức workshop với cộng đồng",
		href: "#contribute",
		bg: "var(--color-pastel-orange)",
		emoji: "💡",
	},
];

const QuickActions: React.FC = () => {
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
		<section
			ref={sectionRef}
			className='neo-section relative overflow-visible'
			style={{ background: "var(--color-surface)" }}
			id='resources'>
			<div className='neo-container'>
				{/* Section header */}
				<div className='text-center mb-14 fade-in-up'>
					<div className='section-divider' />
					<h2
						className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
						style={{ fontFamily: "var(--font-heading)" }}>
						Khám phá CKC IT Club
					</h2>
					<p className='text-gray-500 mt-3 max-w-xl mx-auto'>
						Tất cả những gì bạn cần để học, chia sẻ và phát triển trong cộng đồng IT
					</p>
				</div>

				{/* Cards grid */}
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
					{ACTIONS.map((action, i) => (
						<a
							key={action.title}
							href={action.href}
							className='fade-in-up neo-card flex flex-col p-6 no-underline group'
							style={{
								background: action.bg,
								transitionDelay: `${i * 0.05}s`,
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
						</a>
					))}
				</div>
			</div>
		</section>
	);
};

export default QuickActions;
