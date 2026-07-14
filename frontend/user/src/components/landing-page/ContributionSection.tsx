import React, { useEffect, useRef } from "react";
import { Upload } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { AuthUser } from "@/services/auth.service";

type MainLayoutOutletContext = {
	user: AuthUser | null;
};

const ContributionSection: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const { user } = useOutletContext<MainLayoutOutletContext>();

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
		<section ref={sectionRef} id='contribute' className='neo-section'>
			<div className='neo-container'>
				<div
					className='fade-in-up rounded-2xl p-12 flex flex-col sm:flex-row items-center justify-between gap-8 border-2 border-black'
					style={{
						background: "var(--color-pastel-green)",
						boxShadow: "var(--neo-shadow)",
					}}>
					{/* Text */}
					<div className='space-y-3 text-center sm:text-left'>
						<h2
							className='text-2xl sm:text-3xl font-extrabold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							Góp phần xây dựng kho tài nguyên chung
						</h2>
						<p className='text-gray-700 max-w-lg'>
							Chia sẻ tài liệu, code, slide hay bất kỳ thứ gì hữu ích với hơn{" "}
							<strong>1000+ sinh viên IT</strong> trong cộng đồng CKC IT CLUB.
						</p>
					</div>

					{/* CTA */}
					<Link
						to={user ? "/tai-nguyen/gui" : "/login"}
						className='neo-btn neo-btn-primary text-base px-8 py-4 shrink-0'>
						<Upload className='w-5 h-5' />
						Đóng góp tài nguyên
					</Link>
				</div>
			</div>
		</section>
	);
};

export default ContributionSection;
