import React, { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

const TOP_USERS = [
	{
		rank: 1,
		name: "nguyenvanminh",
		displayName: "Nguyễn Văn Minh",
		score: 4850,
		medal: "🥇",
		bg: "white",
	},
	{
		rank: 2,
		name: "tranthibich",
		displayName: "Trần Thị Bích",
		score: 4320,
		medal: "🥈",
		bg: "white",
	},
	{
		rank: 3,
		name: "phamquocan",
		displayName: "Phạm Quốc An",
		score: 3975,
		medal: "🥉",
		bg: "white",
	},
	{
		rank: 4,
		name: "lehoangthu",
		displayName: "Lê Hoàng Thu",
		score: 3540,
		medal: "4",
		bg: "white",
	},
	{
		rank: 5,
		name: "vuminhtri",
		displayName: "Vũ Minh Trí",
		score: 3210,
		medal: "5",
		bg: "white",
	},
];

const LeaderboardPreview: React.FC = () => {
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
			id='leaderboard'
			className='neo-section'
			style={{ background: "var(--color-surface)" }}>
			<div className='neo-container'>
				<div className='max-w-2xl mx-auto'>
					{/* Header */}
					<div className='flex items-center justify-between mb-10 fade-in-up'>
						<div>
							<div className='section-divider' style={{ margin: "0 0 0.75rem" }} />
							<h2
								className='text-3xl sm:text-4xl font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								🏆 Bảng Xếp Hạng
							</h2>
						</div>
						<span
							className='neo-tag self-start mt-1'
							style={{ background: "var(--color-pastel-yellow)" }}>
							Tuần này
						</span>
					</div>

					{/* Leaderboard table */}
					<div
						className='fade-in-up rounded-2xl overflow-hidden border-2 border-black'
						style={{ boxShadow: "var(--neo-shadow)" }}>
						{TOP_USERS.map((user, i) => (
							<div
								key={user.name}
								className='flex items-center gap-4 px-6 py-4 border-b-2 border-black last:border-b-0 transition-all hover:scale-[1.01] cursor-pointer'
								style={{
									background: user.bg,
									transitionDelay: `${i * 0.07}s`,
								}}>
								{/* Rank */}
								<div className='w-10 text-center'>
									{user.rank <= 3 ? (
										<span className='text-2xl'>{user.medal}</span>
									) : (
										<span
											className='text-lg font-extrabold text-gray-400'
											style={{ fontFamily: "var(--font-heading)" }}>
											#{user.rank}
										</span>
									)}
								</div>

								{/* Avatar */}
								<img
									src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}&backgroundColor=ffffff`}
									alt={user.displayName}
									className='w-10 h-10 rounded-full border-2 border-black'
									onError={(e) => {
										(e.target as HTMLImageElement).src =
											`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=A3E635&color=111&bold=true&size=40`;
									}}
								/>

								{/* Name */}
								<div className='flex-grow'>
									<span
										className='font-bold text-black text-sm'
										style={{ fontFamily: "var(--font-heading)" }}>
										{user.displayName}
									</span>
									<span className='text-xs text-gray-400 block'>
										@{user.name}
									</span>
								</div>

								{/* Score */}
								<div className='text-right'>
									<span
										className='font-extrabold text-lg'
										style={{
											fontFamily: "var(--font-heading)",
											color:
												user.rank <= 3 ? "#111" : "var(--color-text-muted)",
										}}>
										{user.score.toLocaleString()}
									</span>
									<span className='text-xs text-gray-400 block'>XP</span>
								</div>
							</div>
						))}
					</div>

					{/* CTA */}
					<div className='text-center mt-8 fade-in-up'>
						<a href='#leaderboard' className='neo-btn neo-btn-primary px-8 py-3'>
							Xem bảng đầy đủ <ArrowRight className='w-5 h-5' />
						</a>
					</div>
				</div>
			</div>
		</section>
	);
};

export default LeaderboardPreview;
