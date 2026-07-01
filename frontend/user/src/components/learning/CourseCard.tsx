import React from "react";
import { ArrowRight, BarChart3, Globe2, School, Users } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course, CourseAudience, CourseLevel } from "@/types/learning.types";

interface CourseCardProps {
	course: Course;
	featured?: boolean;
	linkTo?: string;
}

// Nhãn cấp độ tiếng Việt (course tag)
const LEVEL_LABEL: Record<CourseLevel, string> = {
	beginner: "Cơ bản",
	intermediate: "Trung cấp",
	advanced: "Nâng cao",
};

const AUDIENCE_META: Record<
	CourseAudience,
	{
		label: string;
		icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
		className: string;
	}
> = {
	club_member: {
		label: "Thành viên CLB",
		icon: Users,
		className: "bg-[var(--color-pastel-green)]",
	},
	cao_thang_student: {
		label: "Sinh viên Cao Thắng",
		icon: School,
		className: "bg-[var(--color-pastel-blue)]",
	},
	public: {
		label: "Công khai",
		icon: Globe2,
		className: "bg-[var(--color-pastel-purple)]",
	},
};

const Placeholder: React.FC<{ title: string; size?: string }> = ({ title, size = "text-6xl" }) => (
	<div className='flex h-full w-full items-center justify-center bg-[var(--color-pastel-green)]'>
		<span
			className={`font-heading font-extrabold text-[var(--color-text-primary)] opacity-20 ${size}`}>
			{title.charAt(0).toUpperCase()}
		</span>
	</div>
);

const LevelPill: React.FC<{ level: CourseLevel }> = ({ level }) => (
	<span className='inline-flex items-center gap-2 rounded-full border-2 border-black bg-[var(--color-pastel-green)] px-3 py-1 font-heading text-[10px] font-extrabold uppercase tracking-[0.1em] text-black'>
		<BarChart3 className='h-3.5 w-3.5' strokeWidth={2.5} />
		{LEVEL_LABEL[level]}
	</span>
);

const AudiencePill: React.FC<{ audience: CourseAudience }> = ({ audience }) => {
	const meta = AUDIENCE_META[audience];
	const Icon = meta.icon;

	return (
		<span
			className={`inline-flex items-center gap-2 rounded-full border-2 border-black px-3 py-1 font-heading text-[10px] font-extrabold uppercase tracking-[0.1em] text-black ${meta.className}`}>
			<Icon className='h-3.5 w-3.5' strokeWidth={2.5} />
			{meta.label}
		</span>
	);
};

// Card light theme giống blog card: nền trắng, viền đen, shadow cứng, hover dịch nhẹ
const CARD_BASE =
	"group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-black bg-white";

export const CourseCard: React.FC<CourseCardProps> = ({ course, featured = false, linkTo }) => {
	const detailUrl = linkTo ?? `/khoa-hoc/${course.slug}`;

	// ── Featured: layout ngang giống thẻ blog highlight (ảnh 58% trái, nội dung phải) ──
	if (featured) {
		return (
			<Link
				to={detailUrl}
				className='group block overflow-hidden rounded-2xl border-2 border-black bg-white'>
				<div className='flex flex-col md:flex-row'>
					{/* Image — full width on mobile, 58% on desktop */}
					<div className='relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100 md:aspect-auto md:min-h-[380px] md:w-[58%] md:self-stretch lg:min-h-[420px]'>
						{course.thumbnail ? (
							<img
								src={course.thumbnail}
								alt={course.title}
								className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
							/>
						) : (
							<Placeholder title={course.title} size='text-8xl' />
						)}
					</div>

					{/* Text — 42% width on desktop */}
					<div className='flex flex-col justify-center p-7 md:flex-1 md:p-10 lg:p-12'>
						<div className='mb-4'>
							<span className='inline-flex items-center gap-1 rounded-full border-2 border-black bg-[var(--color-primary)] px-3 py-1 font-heading text-[11px] font-extrabold uppercase tracking-wide text-black shadow-[2px_2px_0_#111]'>
								✦ Mới
							</span>
						</div>

						<h2 className='font-heading text-2xl font-extrabold leading-tight text-black group-hover:text-[var(--color-text-primary)] md:text-3xl lg:text-[2rem]'>
							{course.title}
						</h2>

						{course.excerpt && (
							<p className='mt-4 line-clamp-3 text-base leading-7 text-gray-600'>
								{course.excerpt}
							</p>
						)}

						<div className='mt-4 flex flex-wrap items-center gap-3'>
							<LevelPill level={course.level} />
							<AudiencePill audience={course.audience} />
						</div>
						<div className='mt-7 flex flex-wrap items-center gap-3'>
							<span className='inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
								Vào học
								<ArrowRight className='h-4 w-4' />
							</span>
						</div>
					</div>
				</div>
			</Link>
		);
	}

	// ── Mặc định: card dọc trong grid ──
	return (
		<Link to={detailUrl} className={CARD_BASE}>
			<div className='overflow-hidden border-b-2 border-black bg-gray-100 aspect-[16/9]'>
				{course.thumbnail ? (
					<img
						src={course.thumbnail}
						alt={course.title}
						className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
					/>
				) : (
					<Placeholder title={course.title} />
				)}
			</div>

			<div className='flex flex-1 flex-col p-6'>
				<h3 className='font-heading text-2xl font-extrabold leading-tight text-black transition-colors group-hover:text-[var(--color-text-primary)]'>
					{course.title}
				</h3>

				{course.excerpt && (
					<p className='mt-3 line-clamp-2 text-base leading-7 text-gray-600'>
						{course.excerpt}
					</p>
				)}

				<div className='min-h-4 flex-1' />

				<div className='mt-6'>
					<div className='flex flex-wrap gap-2'>
						<LevelPill level={course.level} />
						<AudiencePill audience={course.audience} />
					</div>
				</div>
			</div>
		</Link>
	);
};

export default CourseCard;
