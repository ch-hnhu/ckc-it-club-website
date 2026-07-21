import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Facebook, Github, Linkedin } from "lucide-react";
import { clubService } from "@/services/club.service";
import { homeService, DEFAULT_HOME_CONTENT } from "@/services/home.service";
import { buildProfileUrl } from "@/lib/utils";
import type { BoardMember } from "@/types/club.types";

// Tên hiển thị: Chủ nhiệm CLB là giáo viên cố vấn nên thêm kính ngữ "Thầy"
// (chỉ ở hiển thị, không đổi full_name trong DB vì đó là tên tài khoản dùng chung)
const displayName = (member: BoardMember): string =>
	member.role_name === "president" ? `Thầy ${member.full_name}` : member.full_name;

// Nền pastel gán luân phiên cho từng thẻ (DB không lưu màu)
const CARD_BG = [
	"var(--color-pastel-green)",
	"var(--color-pastel-blue)",
	"var(--color-pastel-yellow)",
	"var(--color-pastel-pink)",
	"var(--color-pastel-purple)",
	"var(--color-pastel-orange)",
];

// Ngắt dòng nhãn vai trò đúng ngữ nghĩa: "Trưởng ban" ở dòng trên,
// tên ban nằm trọn dòng dưới (tránh kiểu "TRƯỞNG BAN HỌC / THUẬT").
const renderRoleLabel = (label: string): React.ReactNode => {
	const match = label.match(/^(Trưởng ban)\s+(.+)$/i);
	if (!match) return label;
	return (
		<>
			{match[1]}
			<br />
			{match[2]}
		</>
	);
};

const BoardSection: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const [members, setMembers] = useState<BoardMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [header, setHeader] = useState(DEFAULT_HOME_CONTENT.headers.board);

	useEffect(() => {
		let cancelled = false;
		homeService.getHomeContent().then((c) => {
			if (!cancelled) setHeader(c.headers.board);
		});
		return () => {
			cancelled = true;
		};
	}, []);

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
						{header.title}
					</h2>
					<p className='text-gray-500 mt-3'>{header.subtitle}</p>
				</div>

				{/* Board cards — style giống thẻ Mentor, căn giữa */}
				<div className='fade-in-up flex flex-wrap justify-center gap-5'>
					{loading
						? // Skeleton khi đang tải
							Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className='neo-card neo-card-static bg-white flex flex-col items-center text-center p-6 gap-3 w-[calc(50%-0.625rem)] sm:w-[224px] animate-pulse'>
									<div className='w-20 h-20 rounded-full border-2 border-black bg-gray-200' />
									<div className='h-6 w-28 rounded-full bg-gray-100' />
									<div className='h-5 w-24 rounded bg-gray-200' />
									<div className='mt-2 flex gap-2'>
										<div className='h-8 w-8 rounded-lg border-2 border-black bg-gray-100' />
										<div className='h-8 w-8 rounded-lg border-2 border-black bg-gray-100' />
										<div className='h-8 w-8 rounded-lg border-2 border-black bg-gray-100' />
									</div>
								</div>
							))
						: members.map((member, i) => {
								const bg = CARD_BG[i % CARD_BG.length];
								const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
									member.full_name,
								)}&background=A3E635&color=111&bold=true&size=80`;
								return (
									<div
										key={`${member.role_name}-${member.username ?? i}`}
										className='neo-card neo-card-static bg-white flex flex-col items-center text-center p-6 gap-3 w-[calc(50%-0.625rem)] sm:w-[224px]'>
										<Link
											to={buildProfileUrl(member.username, null)}
											className='flex w-full flex-col items-center gap-3 no-underline'>
										{/* Avatar */}
										<div
											className='w-20 h-20 rounded-full overflow-hidden border-2 border-black'
											style={{ boxShadow: "3px 3px 0px #111" }}>
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

										{/* Vai trò */}
										<div className='flex w-full items-center justify-center'>
											<span
												className='neo-tag flex h-12 w-full items-center justify-center text-center text-xs leading-tight'
												style={{ background: bg }}>
												{renderRoleLabel(member.role_label)}
											</span>
										</div>

										{/* Tên */}
										<h3
											className='text-lg font-bold text-black leading-tight text-balance'
											style={{ fontFamily: "var(--font-heading)" }}>
											{displayName(member)}
										</h3>
										</Link>

										{/* Social */}
										<div className='mt-auto flex items-center gap-2 pt-1'>
											<a
												href='#'
												aria-label={`GitHub của ${member.full_name}`}
												className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black transition-colors hover:bg-gray-100'>
												<Github className='h-4 w-4' />
											</a>
											<a
												href='#'
												aria-label={`Facebook của ${member.full_name}`}
												className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black transition-colors hover:bg-gray-100'>
												<Facebook className='h-4 w-4' />
											</a>
											<a
												href='#'
												aria-label={`LinkedIn của ${member.full_name}`}
												className='flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black transition-colors hover:bg-gray-100'>
												<Linkedin className='h-4 w-4' />
											</a>
										</div>

										{/* CTA Xem hồ sơ */}
										<Link
											to={buildProfileUrl(member.username, null)}
											className='neo-btn neo-btn-primary text-sm px-4 py-2 no-underline'>
											Xem hồ sơ <ExternalLink className='h-3.5 w-3.5' />
										</Link>
									</div>
								);
							})}
				</div>
			</div>
		</section>
	);
};

export default BoardSection;
