import type { CourseAudience, CourseLevel, CourseStatus } from "@/pages/learning/course-meta";

// Types cho trang quản lý khóa học (admin). Dữ liệu lấy từ course.service.ts.
// Shape khớp với bảng `courses` (backend) + các count tổng hợp.
// Mô hình song song: mỗi khóa có nội dung dùng chung, học viên tự chọn track
// offline/online (course_enrollments.track). max_offline_slots = null nghĩa là
// khóa KHÔNG mở lớp offline (chỉ online).

export interface AdminCourseCreator {
	id: number;
	full_name: string | null;
	avatar: string | null;
}

export interface AdminCourseCategory {
	id: number;
	name: string;
	color: string | null;
}

export interface AdminCourseCertificateTemplate {
	id: number;
	name: string;
}

export interface AdminCourse {
	id: number;
	title: string;
	slug: string;
	description: string | null;
	thumbnail: string | null;
	level: CourseLevel;
	status: CourseStatus;
	/** Đối tượng được học khóa này */
	audience: CourseAudience;
	enrollment_start: string | null;
	enrollment_deadline: string | null;
	course_end: string | null;
	/** Sức chứa lớp offline; null = khóa không mở lớp offline (chỉ online) */
	max_offline_slots: number | null;
	max_absent_allowed: number;
	quiz_pass_threshold: number;
	certificate_template: AdminCourseCertificateTemplate | null;
	creator: AdminCourseCreator | null;
	categories: AdminCourseCategory[];
	lessons_count: number;
	/** Tổng học viên đã ghi danh (offline + online) */
	enrollments_count: number;
	/** Số học viên chọn track offline (so với max_offline_slots) */
	offline_enrollments_count: number;
	/** Số học viên chọn track online */
	online_enrollments_count: number;
	certificates_count: number;
	created_at: string;
	updated_at: string;
	/** Có giá trị khi khóa nằm trong thùng rác */
	deleted_at?: string | null;
}

export type CourseSortKey =
	| "id"
	| "title"
	| "level"
	| "status"
	| "audience"
	| "max_offline_slots"
	| "lessons_count"
	| "enrollments_count"
	| "enrollment_deadline"
	| "created_at"
	| "creator"
	| "deleted_at";

/** Lọc theo việc khóa có mở lớp offline hay chỉ online */
export type CourseOfflineFilter = "all" | "has_offline" | "online_only";
export type CourseAudienceFilter = CourseAudience | "all";

export interface CourseListParams {
	page?: number;
	per_page?: number;
	search?: string;
	status?: CourseStatus | "all";
	level?: CourseLevel | "all";
	audience?: CourseAudienceFilter;
	offline?: CourseOfflineFilter;
	sort?: CourseSortKey | null;
	order?: "asc" | "desc" | null;
}
