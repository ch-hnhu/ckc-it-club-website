import React, { useEffect, useRef } from "react";
import { BookOpen, Heart, Trophy, Sprout, ArrowRight } from "lucide-react";

const VALUES = [
	{
		icon: BookOpen,
		emoji: "📚",
		title: "Learn",
		subtitle: "Học không ngừng",
		desc: "Tiếp cận tài nguyên, khóa học và kiến thức từ mentor chuyên nghiệp.",
		bg: "var(--color-pastel-green)",
	},
	{
		icon: Heart,
		emoji: "🤝",
		title: "Share",
		subtitle: "Chia sẻ cùng nhau",
		desc: "Văn hóa open-source: chia sẻ code, tài liệu, kinh nghiệm với cả cộng đồng.",
		bg: "var(--color-pastel-blue)",
	},
	{
		icon: Trophy,
		emoji: "🏆",
		title: "Compete",
		subtitle: "Cạnh tranh lành mạnh",
		desc: "Tham gia hackathon, leaderboard và thử thách bản thân qua các sự kiện.",
		bg: "var(--color-pastel-yellow)",
	},
	{
		icon: Sprout,
		emoji: "🌱",
		title: "Grow",
		subtitle: "Phát triển bản thân",
		desc: "Xây dựng portfolio, kỹ năng mềm và mạng lưới chuyên nghiệp từ trường.",
		bg: "var(--color-pastel-purple)",
	},
];

const AboutValues: React.FC = () => {
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
					className='absolute -bottom-[0%] -left-[20%] w-[700px] opacity-100 animate-float'
					style={{ animationDelay: "0s" }}
				/>
				<img
					src='/assets/svg/28.svg'
					className='absolute bottom-[0%] -left-[20%] w-[520px] opacity-100 animate-float'
					style={{ animationDelay: "2s" }}
				/>
				<img
					src='/assets/svg/29.svg'
					className='absolute bottom-[0%] left-[20%] w-[480px] opacity-100 animate-float'
					style={{ animationDelay: "1s" }}
				/>

				{/* Right Side Bubbles */}
				<img
					src='/assets/svg/32.svg'
					className='absolute -bottom-[15%] -right-[10%] w-[450px] opacity-100 animate-float'
					style={{ animationDelay: "4s" }}
				/>
				<img
					src='/assets/svg/33.svg'
					className='absolute bottom-[0%] -right-[5%] w-[480px] opacity-100 animate-float'
					style={{ animationDelay: "2.5s" }}
				/>
				<img
					src='/assets/svg/35.svg'
					className='absolute bottom-[8%] right-[2%] w-[400px] opacity-100 animate-float'
					style={{ animationDelay: "3.5s" }}
				/>

				{/* Center-Bottom Accents */}
				<img
					src='/assets/svg/30.svg'
					className='absolute -bottom-[20%] left-[40%] w-[450px] opacity-100 animate-float'
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
								Về CKC IT Club
							</h2>
						</div>
						<p className='text-gray-600 text-lg leading-relaxed'>
							CKC IT Club là cộng đồng sinh viên IT năng động tại{" "}
							<strong className='text-black'>
								Trường Cao đẳng Kỹ thuật Cao Thắng
							</strong>
							. Chúng tôi học, chia sẻ và cùng nhau phát triển — tin rằng mọi sinh
							viên đều có tiềm năng to lớn khi được hỗ trợ đúng cách.
						</p>
						<p className='text-gray-600 leading-relaxed'>
							Từ năm 2018, chúng tôi đã kết nối hàng nghìn sinh viên với tài nguyên,
							mentor và cơ hội việc làm thực tế. Đây không chỉ là câu lạc bộ — đây là{" "}
							<span
								className='font-bold px-1 rounded text-black'
								style={{
									background: "var(--color-primary)",
									border: "1px solid #111",
									whiteSpace: "nowrap",
								}}>
								ngôi nhà thứ hai
							</span>{" "}
							của bạn trong hành trình IT.
						</p>

						{/* Milestones */}
						<div className='grid grid-cols-3 gap-4'>
							{[
								{ value: "2018", label: "Năm thành lập" },
								{ value: "50+", label: "Workshops" },
								{ value: "95%", label: "Có việc sau học" },
							].map((m) => (
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

						<a href='#events' className='neo-btn neo-btn-secondary inline-flex'>
							Xem thêm về chúng tôi
							<ArrowRight className='w-4 h-4' />
						</a>
					</div>

					{/* Right: Value cards 2x2 grid */}
					<div className='fade-in-up grid grid-cols-2 gap-5'>
						{VALUES.map((val) => (
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
