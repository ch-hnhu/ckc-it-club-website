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
									className='neo-card neo-card-static bg-white flex flex-col overflow-hidden animate-pulse'>
									<div className='aspect-[16/9] w-full border-b-2 border-black bg-gray-200' />
									<div className='p-6'>
										<div className='h-6 w-3/4 rounded bg-gray-200' />
										<div className='mt-3 h-4 w-1/2 rounded bg-gray-100' />
										<div className='mt-4 h-4 w-full rounded bg-gray-100' />
										<div className='mt-2 h-4 w-5/6 rounded bg-gray-100' />
									</div>
								</div>
							))
						: awards.map((award, i) => {
								const Icon = resolveAboutIcon(award.icon);
								return (
									<div
										key={`${award.title}-${i}`}
										className='neo-card neo-card-static bg-white flex flex-col overflow-hidden'>
										{/* Banner ảnh (nếu có) hoặc icon, chiếm full width + năm dạng badge */}
										<div
											className='relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden border-b-2 border-black'
											style={{ background: award.bg }}>
											{award.image ? (
												<img
													src={award.image}
													alt={award.title}
													className='h-full w-full object-cover'
												/>
											) : (
												<Icon className='h-16 w-16 text-black' />
											)}
											{award.year ? (
												<span
													className='neo-tag text-xs absolute top-3 right-3'
													style={{ background: "white" }}>
													{award.year}
												</span>
											) : null}
										</div>

										{/* Nội dung */}
										<div className='flex flex-col p-6'>
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
										</div>
									</div>
								);
							})}
				</div>
			</div>
		</section>
	);
};

export default AwardsSection;
