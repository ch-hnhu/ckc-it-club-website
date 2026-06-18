export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface CourseInstructor {
	id: number;
	full_name: string;
	avatar: string | null;
	username: string | null;
}

export interface CourseCategory {
	id: number;
	name: string;
	color: string | null;
}

export interface Course {
	id: number;
	slug: string;
	title: string;
	excerpt: string | null;
	thumbnail: string | null;
	level: CourseLevel;
	instructor: CourseInstructor | null;
	lessons_count: number;
	/** Tổng thời lượng (phút) */
	duration_minutes: number;
	enrolled_count: number;
	categories: CourseCategory[];
	is_featured?: boolean;
	/** Tiến độ của user hiện tại (0-100), null nếu chưa ghi danh */
	progress: number | null;
	created_at: string;
	updated_at: string;
}

export type CourseContentType = "video" | "reference" | "exercise" | "quiz";

export interface CourseContentItem {
	id: number;
	title: string;
	/** Thông tin phụ: thời lượng, số câu... vd "12 phút", "10 câu" */
	meta?: string;
	completed?: boolean;
}

/** Một buổi học (chương) trong khóa học */
export interface CourseLesson {
	id: number;
	slug: string;
	/** Thứ tự buổi học, bắt đầu từ 1 */
	order: number;
	title: string;
	/** Mô tả ngắn của buổi học */
	summary?: string | null;
	/** Chỉ dành cho thành viên CLB */
	club_only?: boolean;
	/** Khóa lại nếu chưa được mở */
	is_locked?: boolean;
	completed?: boolean;
	/** Tổng số mục nội dung trong buổi (video + bài tập + quiz...) */
	items_count?: number;
}

/** Thống kê tiến độ hiển thị ở sidebar trang tổng quan khóa học */
export interface CourseProgressStats {
	exercises_done: number;
	exercises_total: number;
	projects_done: number;
	projects_total: number;
	xp_earned: number;
	xp_total: number;
	badges_earned: number;
	badges_total: number;
}

/** Trang tổng quan khóa học: thông tin chung + danh sách buổi học + tiến độ */
export interface CourseDetail extends Course {
	description: string;
	lessons: CourseLesson[];
	stats: CourseProgressStats;
}

/** Chi tiết một buổi học: hub nội dung (video, tham khảo, bài tập, quiz) */
export interface LessonDetail {
	id: number;
	slug: string;
	order: number;
	title: string;
	summary?: string | null;
	/** Tiến độ riêng của buổi học (0-100), null nếu chưa bắt đầu */
	progress: number | null;
	course: {
		slug: string;
		title: string;
		level: CourseLevel;
	};
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
	videos: CourseContentItem[];
	references: CourseContentItem[];
	exercises: CourseContentItem[];
	quizzes: CourseContentItem[];
}

export interface CourseListParams {
	page?: number;
	per_page?: number;
	search?: string;
	category?: string;
	level?: CourseLevel;
	sort?: "created_at" | "enrolled_count";
	order?: "asc" | "desc";
}
