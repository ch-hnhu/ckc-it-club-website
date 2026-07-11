import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { gamificationService } from "@/services/gamification.service";
import { buildAvatar, buildProfileUrl, getHandle } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/gamification.types";

const MEDALS = ["🥇", "🥈", "🥉"];

const LeaderboardPreview: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const [users, setUsers] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		gamificationService
			.getWeeklyLeaderboard(1, 5)
			.then((res) => {
				if (!cancelled) setUsers(res.data ?? []);
			})
			.catch(() => {
				if (!cancelled) setUsers([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
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
	}, [loading]);

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
					{loading ? (
						<div
							className='fade-in-up rounded-2xl overflow-hidden border-2 border-black'
							style={{ boxShadow: "var(--neo-shadow)" }}>
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className='flex items-center gap-4 px-6 py-4 border-b-2 border-black last:border-b-0 bg-white'>
									<div className='w-10 h-6 animate-pulse rounded bg-gray-200' />
									<div className='w-10 h-10 animate-pulse rounded-full bg-gray-200' />
									<div className='flex-grow h-4 animate-pulse rounded bg-gray-200' />
									<div className='w-12 h-4 animate-pulse rounded bg-gray-200' />
								</div>
							))}
						</div>
					) : users.length === 0 ? (
						<div
							className='fade-in-up rounded-2xl border-2 border-black bg-white px-6 py-16 text-center'
							style={{ boxShadow: "var(--neo-shadow)" }}>
							<p className='text-sm text-gray-500'>Chưa có dữ liệu xếp hạng tuần này.</p>
						</div>
					) : (
						<div
							className='fade-in-up rounded-2xl overflow-hidden border-2 border-black'
							style={{ boxShadow: "var(--neo-shadow)" }}>
							{users.map((user) => {
								const handle = getHandle(user.username, user.email ?? "");
								return (
									<Link
										key={user.user_id}
										to={buildProfileUrl(user.username, user.email)}
										className='flex items-center gap-4 px-6 py-4 border-b-2 border-black last:border-b-0 bg-white transition-all cursor-pointer hover:bg-gray-50 no-underline'>
										{/* Rank */}
										<div className='w-10 text-center'>
											{user.rank <= 3 ? (
												<span className='text-2xl'>{MEDALS[user.rank - 1]}</span>
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
											src={buildAvatar(user.full_name, user.avatar)}
											alt={user.full_name}
											referrerPolicy='no-referrer'
											className='w-10 h-10 rounded-full border-2 border-black object-cover'
											onError={(e) => {
												(e.target as HTMLImageElement).src = buildAvatar(user.full_name, null);
											}}
										/>

										{/* Name */}
										<div className='flex-grow min-w-0'>
											<span
												className='font-bold text-black text-sm block truncate'
												style={{ fontFamily: "var(--font-heading)" }}>
												{user.full_name}
											</span>
											<span className='text-xs text-gray-400 block truncate'>{handle}</span>
										</div>

										{/* Score */}
										<div className='text-right'>
											<span
												className='font-extrabold text-lg'
												style={{
													fontFamily: "var(--font-heading)",
													color: user.rank <= 3 ? "#111" : "var(--color-text-muted)",
												}}>
												{user.points.toLocaleString()}
											</span>
											<span className='text-xs text-gray-400 block'>XP</span>
										</div>
									</Link>
								);
							})}
						</div>
					)}

					{/* CTA */}
					<div className='text-center mt-8 fade-in-up'>
						<Link to='/cong-dong/bang-xep-hang' className='neo-btn neo-btn-primary px-8 py-3'>
							Xem bảng đầy đủ <ArrowRight className='w-5 h-5' />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
};

export default LeaderboardPreview;
