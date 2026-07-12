import React, { useEffect, useRef, useState } from "react";
import { aboutService } from "@/services/about.service";
import { resolveAboutIcon } from "@/lib/aboutIcons";
import type { AboutAward } from "@/types/about.types";

/**
 * Phần "Giải thưởng & Thành tích" ở trang chủ, hiển thị ngay dưới Ban Chủ Nhiệm.
 * Dữ liệu lấy từ config trang About (GET /api/v1/about-page → data.awards),
 * quản lý qua trang admin /about-page.
 */
const AwardsSection: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);
	const [awards, setAwards] = useState<AboutAward[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		aboutService
			.getAboutContent()
			.then((content) => {
				if (!cancelled) setAwards(content.awards ?? []);
			})
			.catch(() => {
				if (!cancelled) setAwards([]);
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
	}, [awards, loading]);

	// Ẩn hẳn section nếu tải xong mà không có dữ liệu (tránh khối trống)
	if (!loading && awards.length === 0) {
		return null;
	}

	return (
		<section
			ref={sectionRef}
			id='awards'
			className='neo-section'
			style={{ background: "white" }}>
			<div className='neo-container'>
				{/* Header */}
				<div className='relative text-center mb-14 fade-in-up'>
					<div className='section-divider' />
					<h2
						className='text-3xl sm:text-4xl font-extrabold text-black mt-4'
						style={{ fontFamily: "var(--font-heading)" }}>
						Giải Thưởng & Thành Tích
					</h2>
					<p className='text-gray-500 mt-3'>
						Những dấu ấn tự hào trên hành trình phát triển của CKC IT CLUB
					</p>
				</div>

				{/* Award cards */}
				<div className='fade-in-up grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
					{loading
						? // Skeleton khi đang tải
							Array.from({ length: 3 }).map((_, i) => (
								<div
									key={i}
									className='neo-card neo-card-static bg-white p-6 animate-pulse'>
									<div className='mb-4 h-14 w-14 rounded-xl border-2 border-black bg-gray-200' />
									<div className='h-6 w-3/4 rounded bg-gray-200' />
									<div className='mt-3 h-4 w-1/2 rounded bg-gray-100' />
									<div className='mt-4 h-4 w-full rounded bg-gray-100' />
									<div className='mt-2 h-4 w-5/6 rounded bg-gray-100' />
								</div>
							))
						: awards.map((award, i) => {
								const Icon = resolveAboutIcon(award.icon);
								return (
									<div
										key={`${award.title}-${i}`}
										className='neo-card neo-card-static bg-white flex flex-col p-6'>
										{/* Icon + năm */}
										<div className='mb-4 flex items-start justify-between gap-3'>
											<div
												className='flex h-14 w-14 items-center justify-center rounded-xl border-2 border-black'
												style={{
													background: award.bg,
													boxShadow: "3px 3px 0px #111",
												}}>
												<Icon className='h-7 w-7 text-black' />
											</div>
											{award.year ? (
												<span className='neo-tag text-xs' style={{ background: "white" }}>
													{award.year}
												</span>
											) : null}
										</div>

										{/* Tên giải */}
										<h3
											className='text-lg font-bold text-black leading-tight text-balance'
											style={{ fontFamily: "var(--font-heading)" }}>
											{award.title}
										</h3>

										{/* Cuộc thi / đơn vị */}
										{award.event ? (
											<p className='mt-1 text-sm font-semibold text-gray-500'>
												{award.event}
											</p>
										) : null}

										{/* Mô tả */}
										{award.desc ? (
											<p className='mt-3 text-sm text-gray-700 leading-relaxed'>
												{award.desc}
											</p>
										) : null}
									</div>
								);
							})}
				</div>
			</div>
		</section>
	);
};

export default AwardsSection;
