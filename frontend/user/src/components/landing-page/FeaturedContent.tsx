import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Calendar, Clock, Eye, MapPin, Tag, User } from "lucide-react";
import { Link } from "react-router-dom";
import { blogService } from "@/services/blog.service";
import { eventService } from "@/services/event.service";
import { learningService } from "@/services/learning.service";
import type { Blog } from "@/types/blog.types";
import type { EventItem } from "@/types/event.types";
import type { Course, CourseLevel } from "@/types/learning.types";

// Nền pastel gán luân phiên cho tag (không phụ thuộc dữ liệu)
const TAG_BG = [
	"var(--color-pastel-blue)",
	"var(--color-pastel-green)",
	"var(--color-pastel-yellow)",
	"var(--color-pastel-pink)",
	"var(--color-pastel-purple)",
];

const LEVEL_LABEL: Record<CourseLevel, string> = {
	beginner: "Cơ bản",
	intermediate: "Trung cấp",
	advanced: "Nâng cao",
};

const formatBlogDate = (iso: string): string =>
	new Date(iso).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" });

const daysUntil = (iso: string): number => {
	const diff = new Date(iso).getTime() - Date.now();
	return Math.max(0, Math.ceil(diff / 86_400_000));
};

const formatTime = (iso: string): string =>
	new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

const FeaturedContent: React.FC = () => {
	const sectionRef = useRef<HTMLElement>(null);

	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [event, setEvent] = useState<EventItem | null>(null);
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		Promise.allSettled([
			blogService.getBlogs({ per_page: 3, sort: "reactions_count", order: "desc" }),
			eventService.getEvents({ status: "published", per_page: 6 }),
			learningService.getCourses({ per_page: 2, sort: "enrolled_count", order: "desc" }),
		])
			.then(([blogRes, eventRes, courseRes]) => {
				if (cancelled) return;

				if (blogRes.status === "fulfilled") setBlogs(blogRes.value.data ?? []);

				if (eventRes.status === "fulfilled") {
					// Sự kiện sắp diễn ra có thời gian bắt đầu gần nhất
					const upcoming = (eventRes.value.data ?? [])
						.filter((e) => e.start_at)
						.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
					setEvent(upcoming[0] ?? null);
				}

				if (courseRes.status === "fulfilled") setCourses(courseRes.value.data ?? []);
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
					{/* ── Bài viết nổi bật ── */}
					<div className='flex-1 space-y-5 fade-in-up'>
						<h3
							className='border-b-2 border-black pb-3 text-xl font-bold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							✍️ Bài viết nổi bật
						</h3>

						{loading ? (
							Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className='neo-card block bg-white p-5'>
									<div className='mb-3 h-5 w-24 animate-pulse rounded bg-gray-200' />
									<div className='mb-2 h-4 w-full animate-pulse rounded bg-gray-200' />
									<div className='h-3 w-4/5 animate-pulse rounded bg-gray-100' />
								</div>
							))
						) : blogs.length === 0 ? (
							<p className='rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-400'>
								Chưa có bài viết nào.
							</p>
						) : (
							blogs.map((blog, i) => {
								const date = blog.published_at ?? blog.created_at;
								const tag = blog.tags[0];
								return (
									<Link
										key={blog.id}
										to={`/blog/${blog.slug}`}
										className='neo-card block bg-white p-5 no-underline'
										style={{ transitionDelay: `${i * 0.1}s` }}>
										{tag && (
											<span
												className='neo-tag mb-3 inline-block text-[10px]'
												style={{ background: TAG_BG[i % TAG_BG.length] }}>
												{tag.name}
											</span>
										)}
										<h4
											className='mb-2 line-clamp-2 text-sm font-bold text-black'
											style={{ fontFamily: "var(--font-heading)" }}>
											{blog.title}
										</h4>
										{blog.excerpt && (
											<p className='mb-3 line-clamp-2 text-xs text-gray-500'>{blog.excerpt}</p>
										)}
										<div className='flex items-center justify-between text-xs text-gray-400'>
											<span className='flex items-center gap-1'>
												<Eye className='h-3 w-3' />
												{blog.view_count} lượt xem
											</span>
											<span>{formatBlogDate(date)}</span>
										</div>
									</Link>
								);
							})
						)}
						<Link to='/blog' className='neo-btn neo-btn-secondary w-full justify-center text-sm'>
							Xem tất cả bài viết <ArrowRight className='h-4 w-4' />
						</Link>
					</div>

					{/* ── Sự kiện sắp diễn ra ── */}
					<div className='flex-1 space-y-5 fade-in-up' style={{ transitionDelay: "0.1s" }}>
						<h3
							className='mb-5 border-b-2 border-black pb-3 text-xl font-bold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							🎉 Sự kiện sắp diễn ra
						</h3>

						{loading ? (
							<div className='neo-card h-80 animate-pulse bg-gray-100' />
						) : !event ? (
							<p className='rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-400'>
								Hiện chưa có sự kiện sắp diễn ra.
							</p>
						) : (
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
											{new Date(event.start_at).getDate()}
										</div>
										<div className='text-xs font-bold uppercase text-gray-500'>
											Tháng {new Date(event.start_at).getMonth() + 1}
										</div>
									</div>
									{event.is_members_only && (
										<span className='neo-tag' style={{ background: "var(--color-primary)" }}>
											Thành viên CLB
										</span>
									)}
								</div>

								<h4
									className='text-lg font-extrabold text-black'
									style={{ fontFamily: "var(--font-heading)" }}>
									{event.title}
								</h4>
								{event.description && (
									<p className='line-clamp-3 text-sm text-gray-700'>{event.description}</p>
								)}

								<div className='space-y-2'>
									<div className='flex items-center gap-2 text-xs text-gray-600'>
										<Clock className='h-3.5 w-3.5' /> {formatTime(event.start_at)} –{" "}
										{formatTime(event.end_at)}
									</div>
									{event.location && (
										<div className='flex items-center gap-2 text-xs text-gray-600'>
											<MapPin className='h-3.5 w-3.5' /> {event.location}
										</div>
									)}
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
										{daysUntil(event.start_at)} ngày
									</div>
								</div>

								<Link
									to={`/su-kien/${event.slug}`}
									className='neo-btn neo-btn-primary w-full justify-center text-sm'>
									<Calendar className='h-4 w-4' /> Xem chi tiết
								</Link>
							</div>
						)}
					</div>

					{/* ── Khóa học nổi bật ── */}
					<div className='flex-1 space-y-5 fade-in-up' style={{ transitionDelay: "0.2s" }}>
						<h3
							className='border-b-2 border-black pb-3 text-xl font-bold text-black'
							style={{ fontFamily: "var(--font-heading)" }}>
							🎓 Khóa học nổi bật
						</h3>

						{loading ? (
							Array.from({ length: 2 }).map((_, i) => (
								<div key={i} className='neo-card block bg-white p-5'>
									<div className='mb-4 h-28 w-full animate-pulse rounded-xl bg-gray-200' />
									<div className='h-4 w-4/5 animate-pulse rounded bg-gray-200' />
								</div>
							))
						) : courses.length === 0 ? (
							<p className='rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-400'>
								Chưa có khóa học nào.
							</p>
						) : (
							courses.map((course, i) => (
								<Link
									key={course.id}
									to={`/khoa-hoc/${course.slug}`}
									className='neo-card block bg-white p-5 no-underline'>
									<div
										className='mb-4 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-black'
										style={{ background: `var(--color-pastel-${i === 0 ? "blue" : "green"})` }}>
										{course.thumbnail ? (
											<img
												src={course.thumbnail}
												alt={course.title}
												className='h-full w-full object-cover'
											/>
										) : (
											<BookOpen className='h-10 w-10 text-black/40' />
										)}
									</div>
									<span
										className='neo-tag mb-2 inline-block text-[10px]'
										style={{ background: TAG_BG[i % TAG_BG.length] }}>
										{LEVEL_LABEL[course.level]}
									</span>
									<h4
										className='mb-2 line-clamp-2 text-sm font-bold text-black'
										style={{ fontFamily: "var(--font-heading)" }}>
										{course.title}
									</h4>
									<div className='flex items-center justify-between text-xs text-gray-400'>
										<span className='flex items-center gap-1'>
											<User className='h-3 w-3' />
											{course.instructor?.full_name ?? "CKC IT CLUB"}
										</span>
										<span className='flex items-center gap-1'>
											<Tag className='h-3 w-3' />
											{course.lessons_count} bài
										</span>
									</div>
								</Link>
							))
						)}
						<Link to='/khoa-hoc' className='neo-btn neo-btn-secondary w-full justify-center text-sm'>
							Xem tất cả khóa học <ArrowRight className='h-4 w-4' />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
};

export default FeaturedContent;
