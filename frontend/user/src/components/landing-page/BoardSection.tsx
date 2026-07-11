import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { clubService } from "@/services/club.service";
import { buildProfileUrl } from "@/lib/utils";
import type { BoardMember } from "@/types/club.types";

// Nền pastel gán luân phiên cho từng thẻ (DB không lưu màu)
const CARD_BG = [
	"var(--color-pastel-green)",
	"var(--color-pastel-blue)",
	"var(--color-pastel-yellow)",
	"var(--color-pastel-pink)",
	"var(--color-pastel-purple)",
	"var(--color-pastel-orange)",
];

const BoardSection: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const [members, setMembers] = useState<BoardMember[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		clubService
			.getBoard()
			.then((res) => {
				if (!cancelled) setMembers(res.data ?? []);
			})
			.catch(() => {
				if (!cancelled) setMembers([]);
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
	}, [members, loading]);

	// Ẩn hẳn section nếu tải xong mà không có dữ liệu (tránh khối trống)
	if (!loading && members.length === 0) {
		return null;
	}

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
						Những người dẫn dắt và xây dựng CKC IT CLUB
					</p>
				</div>

				{/* Board grid */}
				<div className='fade-in-up grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5'>
					{loading
						? // Skeleton khi đang tải
							Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className='neo-card neo-card-static flex flex-col items-center text-center p-5 gap-3 animate-pulse'
									style={{ background: "white" }}>
									<div className='w-16 h-16 rounded-full border-2 border-black bg-gray-200' />
									<div className='h-4 w-20 rounded bg-gray-200' />
									<div className='h-3 w-16 rounded bg-gray-100' />
								</div>
							))
						: members.map((member, i) => {
								const bg = CARD_BG[i % CARD_BG.length];
								const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
									member.full_name,
								)}&background=A3E635&color=111&bold=true&size=64`;
								return (
									<Link
										key={`${member.role_name}-${member.username ?? i}`}
										to={buildProfileUrl(member.username, null)}
										className='neo-card flex flex-col items-center text-center p-5 gap-3 no-underline'
										style={{ background: bg }}>
										{/* Avatar */}
										<div
											className='w-16 h-16 rounded-full overflow-hidden border-2 border-black'
											style={{ boxShadow: "2px 2px 0px #111" }}>
											<img
												src={member.avatar || fallbackAvatar}
												alt={member.full_name}
												referrerPolicy='no-referrer'
												className='w-full h-full object-cover'
												onError={(e) => {
													(e.target as HTMLImageElement).src = fallbackAvatar;
												}}
											/>
										</div>

										{/* Info */}
										<div>
											<h4
												className='font-bold text-black text-sm leading-tight'
												style={{ fontFamily: "var(--font-heading)" }}>
												{member.full_name}
											</h4>
											<p className='text-xs text-gray-600 mt-1 font-medium'>
												{member.role_label}
											</p>
										</div>
									</Link>
								);
							})}
				</div>
			</div>
		</section>
	);
};

export default BoardSection;
