import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Github, Linkedin } from "lucide-react";
import { userService } from "@/services/user.service";
import { buildAvatar, buildProfileUrl } from "@/lib/utils";
import type { UserProfile } from "@/types/user.types";

// Username cố định của cố vấn / người thành lập CLB (được seed ở UserSeeder).
const ADVISOR_USERNAME = "lucaotien";

// Chuẩn hoá link social: cho phép lưu ở DB dạng URL đầy đủ hoặc chỉ handle.
const githubUrl = (v: string) => (v.startsWith("http") ? v : `https://github.com/${v}`);
const linkedinUrl = (v: string) => (v.startsWith("http") ? v : `https://www.linkedin.com/in/${v}`);

const MentorSection: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const [mentor, setMentor] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		userService
			.getProfile(ADVISOR_USERNAME)
			.then((res) => {
				if (!cancelled) setMentor(res.data ?? null);
			})
			.catch(() => {
				if (!cancelled) setMentor(null);
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
	}, [mentor, loading]);

	// Ẩn hẳn section nếu tải xong mà không có cố vấn (tránh khối trống)
	if (!loading && !mentor) {
		return null;
	}

	const profileUrl = mentor ? buildProfileUrl(mentor.username, null) : "#";

	return (
		<section ref={sectionRef} id='mentors' className='neo-section bg-white'>
			<div className='neo-container'>
				{/* Header */}
				<div className='text-center mb-14 fade-in-up'>
					<div className='section-divider' />
					<h2
						className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
						style={{ fontFamily: "var(--font-heading)" }}>
						Người thành lập
					</h2>
					<p className='text-gray-500 mt-3 max-w-xl mx-auto'>
						Người đã đặt nền móng cho CLB IT CKC, đồng thời là cố vấn cho các thành viên
						trong CLB.
					</p>
				</div>

				{/* Mentor card */}
				<div className='fade-in-up flex flex-wrap justify-center gap-8'>
					{loading || !mentor ? (
						// Skeleton khi đang tải
						<div className='neo-card bg-white flex flex-col items-center text-center p-8 gap-4 w-full max-w-sm animate-pulse'>
							<div className='w-20 h-20 rounded-full border-2 border-black bg-gray-200' />
							<div className='h-6 w-28 rounded-full bg-gray-100' />
							<div className='h-5 w-40 rounded bg-gray-200' />
							<div className='h-16 w-full rounded bg-gray-100' />
						</div>
					) : (
						<div className='neo-card bg-white flex flex-col items-center text-center p-8 gap-4 w-full max-w-sm'>
							{/* Avatar */}
							<Link
								to={profileUrl}
								className='w-20 h-20 rounded-full overflow-hidden border-2 border-black no-underline'
								style={{ boxShadow: "3px 3px 0px #111" }}>
								<img
									src={buildAvatar(mentor.full_name, mentor.avatar)}
									alt={mentor.full_name}
									referrerPolicy='no-referrer'
									className='w-full h-full object-cover'
									onError={(e) => {
										(e.target as HTMLImageElement).src = buildAvatar(
											mentor.full_name,
											null,
										);
									}}
								/>
							</Link>

							{/* Tag */}
							<span
								className='neo-tag text-xs'
								style={{ background: "var(--color-pastel-blue)" }}>
								Cố vấn
							</span>

							{/* Name + role */}
							<div>
								<h3
									className='text-lg font-bold text-black'
									style={{ fontFamily: "var(--font-heading)" }}>
									Thầy {mentor.full_name}
								</h3>
								<p className='text-sm font-medium text-gray-500 mt-0.5'>
									Người thành lập kiêm cố vấn CLB IT CKC
								</p>
							</div>

							{/* Bio */}
							{mentor.bio && (
								<p className='text-sm text-gray-600 leading-relaxed flex-grow'>
									{mentor.bio}
								</p>
							)}

							{/* Social icons + CTA */}
							<div className='w-full pt-4 flex items-center justify-center mt-auto'>
								<div className='flex gap-3'>
									{mentor.social_github && (
										<a
											href={githubUrl(mentor.social_github)}
											target='_blank'
											rel='noopener noreferrer'
											aria-label={`GitHub của ${mentor.full_name}`}
											className='p-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors'>
											<Github className='w-4 h-4' />
										</a>
									)}
									{mentor.social_linkedin && (
										<a
											href={linkedinUrl(mentor.social_linkedin)}
											target='_blank'
											rel='noopener noreferrer'
											aria-label={`LinkedIn của ${mentor.full_name}`}
											className='p-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors'>
											<Linkedin className='w-4 h-4' />
										</a>
									)}
								</div>
								<Link
									to={profileUrl}
									className='neo-btn neo-btn-primary text-sm px-4 py-2 no-underline'>
									Xem hồ sơ <ExternalLink className='w-3.5 h-3.5' />
								</Link>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default MentorSection;
