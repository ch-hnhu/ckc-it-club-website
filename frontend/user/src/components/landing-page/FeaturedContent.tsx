import React, { useEffect, useRef } from "react";
import { ArrowRight, BookOpen, Calendar, Clock, MapPin, Tag, User } from "lucide-react";

const BLOG_POSTS = [
	{
		title: "Xây dựng REST API với Node.js và Express từ A đến Z",
		date: "24 tháng 3, 2025",
		tag: "Web Developer",
		tagBg: "var(--color-pastel-blue)",
		excerpt: "Hướng dẫn chi tiết từng bước xây dựng API backend cho dự án thực tế...",
		readTime: "8 phút đọc",
	},
	{
		title: "Giới thiệu Học máy cho người mới bắt đầu",
		date: "20 tháng 3, 2025",
		tag: "AI/Học máy",
		tagBg: "var(--color-pastel-green)",
		excerpt: "Bắt đầu hành trình AI không khó như bạn nghĩ. Cùng khám phá các khái niệm cơ bản...",
		readTime: "12 phút đọc",
	},
	{
		title: "Docker & Kubernetes: Đóng gói ứng dụng đơn giản",
		date: "16 tháng 3, 2025",
		tag: "DevOps",
		tagBg: "var(--color-pastel-yellow)",
		excerpt: "Đóng gói ứng dụng giúp triển khai nhanh hơn, ổn định hơn. Tìm hiểu ngay...",
		readTime: "10 phút đọc",
	},
];

const UPCOMING_EVENT = {
	title: "Cuộc thi lập trình CKC 2025 — Xây dựng sản phẩm tạo tác động",
	date: "15 tháng 4, 2025",
	time: "08:00 – 20:00",
	location: "Hội trường A — Cao Thắng",
	desc: "48 giờ để xây dựng sản phẩm giải quyết vấn đề thực tế. Giải thưởng 10 triệu đồng!",
	tag: "Cuộc thi lập trình",
	daysLeft: 18,
};

const COURSES = [
	{
		title: "React & TypeScript từ cơ bản đến nâng cao",
		instructor: "Nguyễn Văn An",
		level: "Trung cấp",
		levelBg: "var(--color-pastel-blue)",
		students: 234,
		lessons: 32,
	},
	{
		title: "Python Khoa học dữ liệu & Học máy",
		instructor: "Phạm Minh Châu",
		level: "Cơ bản",
		levelBg: "var(--color-pastel-green)",
		students: 189,
		lessons: 24,
	},
];

const FeaturedContent: React.FC = () => {
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
		<section ref={sectionRef} id='blog' className='neo-section bg-white'>
			<div className='neo-container'>
				<div className='relative mb-14 text-center fade-in-up'>
					<img
						src='/assets/img/4.png'
						alt=''
						className='absolute top-90 -left-40 hidden h-50 w-50 rotate-[-15deg] animate-float opacity-20 lg:block'
					/>
					<div className='section-divider' />
					<h2
						className='mt-4 text-3xl font-extrabold text-black sm:text-4xl'
						style={{ fontFamily: "var(--font-heading)" }}>
						Nội dung nổi bật
					</h2>
					<p className='mt-3 text-gray-500'>
						Bài viết, sự kiện và khóa học được cộng đồng yêu thích nhất
					</p>
				</div>

				<div className='flex flex-col gap-8 lg:flex-row'>
					<div className='space-y-5 fade-in-up'>
						<h3
							className='border-b-2 border-black pb-3 text-xl font-bold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							✍️ Bài viết nổi bật
						</h3>
						{BLOG_POSTS.map((post, i) => (
							<a
								key={i}
								href='#blog'
								className='neo-card block bg-white p-5 no-underline'
								style={{ transitionDelay: `${i * 0.1}s` }}>
								<span
									className='neo-tag mb-3 inline-block text-[10px]'
									style={{ background: post.tagBg }}>
									{post.tag}
								</span>
								<h4
									className='mb-2 line-clamp-2 text-sm font-bold text-black'
									style={{ fontFamily: "var(--font-heading)" }}>
									{post.title}
								</h4>
								<p className='mb-3 line-clamp-2 text-xs text-gray-500'>{post.excerpt}</p>
								<div className='flex items-center justify-between text-xs text-gray-400'>
									<span className='flex items-center gap-1'>
										<Clock className='h-3 w-3' />
										{post.readTime}
									</span>
									<span>{post.date}</span>
								</div>
							</a>
						))}
						<a href='#blog' className='neo-btn neo-btn-secondary w-full justify-center text-sm'>
							Xem tất cả bài viết <ArrowRight className='h-4 w-4' />
						</a>
					</div>

					<div className='space-y-5 fade-in-up' style={{ transitionDelay: "0.1s" }}>
						<h3
							className='mb-5 border-b-2 border-black pb-3 text-xl font-bold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							🎉 Sự kiện sắp diễn ra
						</h3>
						<div
							className='neo-card flex h-full flex-col gap-4 p-6'
							style={{ background: "var(--color-pastel-pink)" }}>
							<div className='flex items-start justify-between'>
								<div
									className='rounded-xl border-2 border-black bg-white px-3 py-2 text-center'
									style={{ boxShadow: "2px 2px 0px #111" }}>
									<div
										className='text-2xl font-extrabold text-black'
										style={{ fontFamily: "var(--font-heading)" }}>
										15
									</div>
									<div className='text-xs font-bold uppercase text-gray-500'>Tháng 4</div>
								</div>
								<span className='neo-tag' style={{ background: "var(--color-primary)" }}>
									{UPCOMING_EVENT.tag}
								</span>
							</div>

							<h4
								className='text-lg font-extrabold text-black'
								style={{ fontFamily: "var(--font-heading)" }}>
								{UPCOMING_EVENT.title}
							</h4>
							<p className='text-sm text-gray-700'>{UPCOMING_EVENT.desc}</p>

							<div className='space-y-2'>
								<div className='flex items-center gap-2 text-xs text-gray-600'>
									<Clock className='h-3.5 w-3.5' /> {UPCOMING_EVENT.time}
								</div>
								<div className='flex items-center gap-2 text-xs text-gray-600'>
									<MapPin className='h-3.5 w-3.5' /> {UPCOMING_EVENT.location}
								</div>
							</div>

							<div
								className='mt-auto rounded-xl border-2 border-black bg-white p-3 text-center'
								style={{ boxShadow: "2px 2px 0px #111" }}>
								<span className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
									Còn lại
								</span>
								<div
									className='text-3xl font-extrabold'
									style={{
										fontFamily: "var(--font-heading)",
										color: "var(--color-primary)",
										WebkitTextStroke: "1px #111",
									}}>
									{UPCOMING_EVENT.daysLeft} ngày
								</div>
							</div>

							<a
								href='#events'
								className='neo-btn neo-btn-primary w-full justify-center text-sm'>
								<Calendar className='h-4 w-4' /> Đăng ký tham gia
							</a>
						</div>
					</div>

					<div className='space-y-5 fade-in-up' style={{ transitionDelay: "0.2s" }}>
						<h3
							className='border-b-2 border-black pb-3 text-xl font-bold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							🎓 Khóa học nổi bật
						</h3>
						{COURSES.map((course, i) => (
							<a key={i} href='#courses' className='neo-card block bg-white p-5 no-underline'>
								<div
									className='mb-4 flex h-28 w-full items-center justify-center rounded-xl border-2 border-black'
									style={{
										background: `var(--color-pastel-${i === 0 ? "blue" : "green"})`,
									}}>
									<BookOpen className='h-10 w-10 text-black/40' />
								</div>
								<span
									className='neo-tag mb-2 inline-block text-[10px]'
									style={{ background: course.levelBg }}>
									{course.level}
								</span>
								<h4
									className='mb-2 line-clamp-2 text-sm font-bold text-black'
									style={{ fontFamily: "var(--font-heading)" }}>
									{course.title}
								</h4>
								<div className='flex items-center justify-between text-xs text-gray-400'>
									<span className='flex items-center gap-1'>
										<User className='h-3 w-3' />
										{course.instructor}
									</span>
									<span className='flex items-center gap-1'>
										<Tag className='h-3 w-3' />
										{course.lessons} bài
									</span>
								</div>
							</a>
						))}
						<a href='#courses' className='neo-btn neo-btn-secondary w-full justify-center text-sm'>
							Xem tất cả khóa học <ArrowRight className='h-4 w-4' />
						</a>
					</div>
				</div>
			</div>
		</section>
	);
};

export default FeaturedContent;
