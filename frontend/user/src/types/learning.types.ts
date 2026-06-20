export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseTrack = "offline" | "online";

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
	/** Slug để điều hướng (vd video → trang xem video) */
	slug?: string;
	/** Thông tin phụ: thời lượng, số câu... vd "12 phút", "10 câu" */
	meta?: string;
	completed?: boolean;
	/** URL ngoài (Google Drive, Google Forms...) */
	url?: string;
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
	/** Thời gian bắt đầu buổi học offline */
	session_start?: string | null;
	/** Thời gian kết thúc buổi học offline — dùng để tính QR còn hợp lệ không */
	session_end?: string | null;
	/** Vé QR của user cho buổi này (chỉ có với track offline, null = chưa đăng ký tham gia) */
	qr_ticket?: { token: string; used_at: string | null } | null;
	/** Đã được điểm danh (qr hoặc admin thủ công) */
	is_attended?: boolean;
}

/** Thống kê tiến độ hiển thị ở sidebar trang tổng quan khóa học */
export interface CourseProgressStats {
	attendance_done: number;
	attendance_total: number;
	exercises_done: number;
	exercises_total: number;
	projects_done: number;
	projects_total: number;
	quizzes_done: number;
	quizzes_total: number;
	xp_earned: number;
	xp_total: number;
	badges_earned: number;
	badges_total: number;
}

/** Trang tổng quan khóa học: thông tin chung + danh sách buổi học + tiến độ */
export interface CourseDetail extends Course {
	description: string;
	/** Track học của user hiện tại trong khóa này */
	enrollment_track: CourseTrack | null;
	/** Ngày mở đăng ký học offline */
	enrollment_start: string | null;
	/** Hạn cuối đăng ký học offline — sau mốc này chỉ còn học online */
	enrollment_deadline: string | null;
	/** Khoá học kết thúc hoàn toàn — sau mốc này content thành kho tự học */
	course_end: string | null;
	/** User đang quan tâm khoá học này (chưa đăng ký, chưa có lesson) */
	is_interested: boolean;
	lessons: CourseLesson[];
	stats: CourseProgressStats;
}

/** Chi tiết một buổi học: mỗi phần chỉ có đúng 1 nội dung */
export interface LessonDetail {
	id: number;
	slug: string;
	order: number;
	title: string;
	summary?: string | null;
	/** Thời gian bắt đầu buổi học (offline) — dùng để kiểm tra chưa diễn ra */
	session_start?: string | null;
	/** Tiến độ riêng của buổi học (0-100), null nếu chưa bắt đầu */
	progress: number | null;
	course: {
		slug: string;
		title: string;
		level: CourseLevel;
	};
	prev: { slug: string; title: string } | null;
	next: { slug: string; title: string } | null;
	/** 1 video bài giảng */
	video: CourseContentItem | null;
	/** 1 link tài nguyên (Google Drive) */
	reference: CourseContentItem | null;
	/** 1 link nộp bài (Google Forms) */
	exercise: CourseContentItem | null;
	/** 1 quiz kiểm tra */
	quiz: CourseContentItem | null;
}

/** Trang xem video bài giảng: tài liệu (markdown) bên trái + video 2 tab bên phải */
export interface VideoDetail {
	id: number;
	slug: string;
	title: string;
	/** Tài liệu markdown của buổi học (cột trái) */
	document: string | null;
	/** Video bài giảng chính thức (mentor quay lại) — tab ưu tiên */
	lecture_url: string | null;
	/** Video bản ghi livestream — chỉ hiện tab khi có */
	live_url: string | null;
	duration: string;
	xp: number;
	completed: boolean;
	course: { slug: string; title: string };
	lesson: { slug: string; title: string; order: number };
	/** Buổi trước (điều hướng) */
	prev_lesson: { slug: string; title: string } | null;
	/** Buổi kế tiếp (điều hướng) */
	next_lesson: { slug: string; title: string } | null;
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
