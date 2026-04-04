import React from "react";
import { Facebook, Github, Youtube, Instagram, Mail, MapPin, Code2 } from "lucide-react";

const FOOTER_NAV = {
	"Khám phá": [
		{ label: "Tài nguyên", href: "#resources" },
		{ label: "Blog", href: "#blog" },
		{ label: "Khóa học", href: "#courses" },
		{ label: "Sự kiện", href: "#events" },
	],
	"Cộng đồng": [
		{ label: "Leaderboard", href: "#leaderboard" },
		{ label: "Mentor", href: "#mentors" },
		{ label: "Ban Chủ Nhiệm", href: "#board" },
		{ label: "Đóng góp", href: "#contribute" },
	],
	CLB: [
		{ label: "Về chúng tôi", href: "#about" },
		{ label: "Tham gia CLB", href: "#join" },
		{ label: "Liên hệ", href: "mailto:contact@ckcitclub.edu.vn" },
		{ label: "Chính sách", href: "#" },
	],
};

const SOCIALS = [
	{ icon: Facebook, href: "#", label: "Facebook" },
	{ icon: Github, href: "#", label: "GitHub" },
	{ icon: Youtube, href: "#", label: "YouTube" },
	{ icon: Instagram, href: "#", label: "Instagram" },
	{ icon: Mail, href: "mailto:contact@ckcitclub.edu.vn", label: "Email" },
];

const Footer: React.FC = () => {
	return (
		<footer className='bg-black text-white border-t-2 border-black'>
			<div className='neo-container'>
				{/* Main footer content */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-16 px-6'>
					{/* Brand column */}
					<div className='space-y-5'>
						{/* Logo */}
						<div className='flex items-center gap-2.5'>
							<div
								className='w-9 h-9 rounded-lg flex items-center justify-center'
								style={{
									background: "var(--color-primary)",
									border: "2px solid rgba(255,255,255,0.2)",
								}}>
								<Code2 className='w-5 h-5 text-black' />
							</div>
							<span
								className='text-xl font-extrabold tracking-tight'
								style={{ fontFamily: "var(--font-heading)" }}>
								CKC IT CLUB
							</span>
						</div>

						<p className='text-gray-400 text-sm leading-relaxed'>
							Cộng đồng sinh viên IT năng động tại Trường Cao đẳng Kỹ thuật Cao Thắng.
							Học, chia sẻ và phát triển cùng nhau.
						</p>

						{/* Contact info */}
						<div className='space-y-2.5 text-sm text-gray-400'>
							<div className='flex items-start gap-2'>
								<MapPin className='w-4 h-4 mt-0.5 shrink-0 text-[#A3E635]' />
								<span>65 Huỳnh Thúc Kháng, Phường Bến Nghé, Quận 1, TP.HCM</span>
							</div>
							<div className='flex items-center gap-2'>
								<Mail className='w-4 h-4 text-[#A3E635]' />
								<a
									href='mailto:contact@ckcitclub.edu.vn'
									className='hover:text-white transition-colors'>
									contact@ckcitclub.edu.vn
								</a>
							</div>
						</div>

						{/* Social icons */}
						<div className='flex gap-3 pt-1'>
							{SOCIALS.map((s) => (
								<a
									key={s.label}
									href={s.href}
									aria-label={s.label}
									className='w-9 h-9 flex items-center justify-center rounded-lg border border-white/20 text-gray-400 hover:text-white hover:border-white/60 hover:scale-110 transition-all duration-200'>
									<s.icon className='w-4 h-4' />
								</a>
							))}
						</div>
					</div>

					{/* Nav links */}
					{Object.entries(FOOTER_NAV).map(([section, links]) => (
						<div key={section}>
							<h4
								className='font-bold text-white mb-5 text-sm uppercase tracking-wider'
								style={{ fontFamily: "var(--font-heading)" }}>
								{section}
							</h4>
							<ul className='space-y-3'>
								{links.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											className='text-gray-400 hover:text-[#A3E635] text-sm transition-colors duration-200'>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{/* Bottom bar */}
				<div className='border-t border-white/10 py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
					<p className='text-sm text-gray-500'>
						© {new Date().getFullYear()} CKC IT CLUB — Trường Cao đẳng Kỹ thuật Cao
						Thắng. All rights reserved.
					</p>
					<div
						className='flex items-center gap-1.5 text-sm font-medium'
						style={{ color: "var(--color-primary)" }}>
						<Code2 className='w-4 h-4' />
						Made with ♡︎ by CKC IT CLUB
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
