import React, { useEffect, useRef } from "react";
import { Facebook, Github, Linkedin } from "lucide-react";

const BOARD_MEMBERS = [
	{
		name: "Trần Quốc Bảo",
		role: "Chủ Nhiệm",
		bg: "var(--color-pastel-green)",
		avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=board1&backgroundColor=#ffffff",
	},
	{
		name: "Nguyễn Thị Mai",
		role: "Phó Chủ Nhiệm",
		bg: "var(--color-pastel-blue)",
		avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=board2&backgroundColor=#ffffff",
	},
	{
		name: "Lê Văn Hùng",
		role: "Trưởng Ban Tech",
		bg: "var(--color-pastel-yellow)",
		avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=board3&backgroundColor=#ffffff",
	},
	{
		name: "Phạm Thu Hà",
		role: "Trưởng Ban Design",
		bg: "var(--color-pastel-pink)",
		avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=board4&backgroundColor=#ffffff",
	},
	{
		name: "Đỗ Minh Tuấn",
		role: "Trưởng Ban Truyền Thông",
		bg: "var(--color-pastel-purple)",
		avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=board5&backgroundColor=#ffffff",
	},
	{
		name: "Võ Kim Ngân",
		role: "Trưởng Ban Sự Kiện",
		bg: "var(--color-pastel-orange)",
		avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=board6&backgroundColor=#ffffff",
	},
];

const BoardSection: React.FC = () => {
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
			id='board'
			className='neo-section'
			style={{ background: "var(--color-surface)" }}>
			<div className='neo-container'>
				{/* Header */}
				<div className='relative text-center mb-14 fade-in-up'>
					{/* Decorative images */}
					<img
						src='/assets/img/11.png'
						alt=''
						className='absolute -left-10 -top-5 w-20 h-20 opacity-30 animate-float hidden lg:block rotate-[-12deg]'
					/>
					<img
						src='/assets/img/12.png'
						alt=''
						className='absolute -right-8 bottom-0 w-18 h-18 opacity-30 animate-float-delayed hidden lg:block rotate-[15deg]'
					/>

					<div className='section-divider' />
					<h2
						className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
						style={{ fontFamily: "var(--font-heading)" }}>
						Ban Chủ Nhiệm
					</h2>
					<p className='text-gray-500 mt-3'>
						Những người dẫn dắt và xây dựng CKC IT Club
					</p>
				</div>

				{/* Board grid */}
				<div className='fade-in-up grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5'>
					{BOARD_MEMBERS.map((member) => (
						<div
							key={member.name}
							className='neo-card flex flex-col items-center text-center p-5 gap-3'
							style={{ background: member.bg }}>
							{/* Avatar */}
							<div
								className='w-16 h-16 rounded-full overflow-hidden border-2 border-black'
								style={{ boxShadow: "2px 2px 0px #111" }}>
								<img
									src={member.avatar}
									alt={member.name}
									className='w-full h-full object-cover'
									onError={(e) => {
										(e.target as HTMLImageElement).src =
											`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=A3E635&color=111&bold=true&size=64`;
									}}
								/>
							</div>

							{/* Info */}
							<div>
								<h4
									className='font-bold text-black text-sm leading-tight'
									style={{ fontFamily: "var(--font-heading)" }}>
									{member.name}
								</h4>
								<p className='text-xs text-gray-600 mt-1 font-medium'>
									{member.role}
								</p>
							</div>

							{/* Social icons */}
							<div className='flex gap-2 mt-auto'>
								<a
									href='#'
									className='p-1.5 rounded-md border border-black/30 hover:border-black hover:bg-white/50 transition-colors'>
									<Facebook className='w-3 h-3 text-gray-600' />
								</a>
								<a
									href='#'
									className='p-1.5 rounded-md border border-black/30 hover:border-black hover:bg-white/50 transition-colors'>
									<Github className='w-3 h-3 text-gray-600' />
								</a>
								<a
									href='#'
									className='p-1.5 rounded-md border border-black/30 hover:border-black hover:bg-white/50 transition-colors'>
									<Linkedin className='w-3 h-3 text-gray-600' />
								</a>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default BoardSection;
