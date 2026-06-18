import React from "react";
import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course, CourseLevel } from "@/types/learning.types";

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

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
	<div className='flex h-full w-full items-center justify-center bg-[var(--color-pastel-green)]'>
		<span className='font-heading text-6xl font-extrabold text-[var(--color-text-primary)] opacity-20'>
			{title.charAt(0).toUpperCase()}
		</span>
	</div>
);

const LevelPill: React.FC<{ level: CourseLevel }> = ({ level }) => (
	<span className='inline-flex items-center gap-2 rounded-full border-2 border-black bg-[var(--color-pastel-green)] px-3.5 py-1.5 font-heading text-[11px] font-extrabold uppercase tracking-[0.1em] text-black shadow-[2px_2px_0_#111]'>
		<BarChart3 className='h-3.5 w-3.5' strokeWidth={2.5} />
		{LEVEL_LABEL[level]}
	</span>
);

// Card light theme giống blog card: nền trắng, viền đen, shadow cứng, hover dịch nhẹ
const CARD_BASE =
	"group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111] transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none";

export const CourseCard: React.FC<CourseCardProps> = ({ course, featured = false, linkTo }) => {
	const detailUrl = linkTo ?? `/khoa-hoc/${course.slug}`;

	return (
		<Link to={detailUrl} className={CARD_BASE}>
			<div
				className={`overflow-hidden border-b-2 border-black bg-gray-100 ${
					featured ? "aspect-[21/9]" : "aspect-[16/9]"
				}`}>
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

			<div className={`flex flex-1 flex-col ${featured ? "p-7 md:p-8" : "p-6"}`}>
				<h3
					className={`font-heading font-extrabold leading-tight text-black transition-colors group-hover:text-[var(--color-text-primary)] ${
						featured ? "text-2xl md:text-3xl" : "text-2xl"
					}`}>
					{course.title}
				</h3>

				{course.excerpt && (
					<p
						className={`mt-3 line-clamp-2 leading-7 text-gray-600 ${
							featured ? "text-base md:text-lg" : "text-base"
						}`}>
						{course.excerpt}
					</p>
				)}

				<div className='min-h-4 flex-1' />

				<div className='mt-6'>
					<LevelPill level={course.level} />
				</div>
			</div>
		</Link>
	);
};

export default CourseCard;
