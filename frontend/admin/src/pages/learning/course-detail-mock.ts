import type { AdminCourse } from "@/pages/learning/course-mock";
import type { CourseStatus } from "@/pages/learning/course-meta";

// Types cho trang chi tiết khóa học (admin). Dữ liệu lấy từ course.service.ts.

export type EnrollmentTrack = "offline" | "online";

/** Một buổi học (lessons) trong khóa */
export interface CourseLessonRow {
	id: number;
	order: number;
	title: string;
	status: CourseStatus;
	/** Lịch buổi học offline; null với khóa chỉ online hoặc buổi chưa xếp lịch */
	session_start: string | null;
	session_end: string | null;
	has_video: boolean;
	has_document: boolean;
	has_assignment: boolean;
	/** Số học viên offline đã điểm danh buổi này */
	attendances_count: number;
}

/** Một bản ghi ghi danh (course_enrollments) */
export interface CourseEnrollmentRow {
	id: number;
	user: { id: number; full_name: string; email: string; avatar: string | null };
	track: EnrollmentTrack;
	/** Tiến độ 0-100 */
	progress: number;
	/** Số buổi vắng (chỉ áp với track offline) */
	absent_count: number;
	completed_at: string | null;
	enrolled_at: string;
}

/** Một chứng chỉ đã cấp (course_certificates) */
export interface CourseCertificateRow {
	id: number;
	cert_code: string;
	user: { id: number; full_name: string; email: string };
	track: EnrollmentTrack;
	issued_at: string;
}

export interface AdminCourseDetail extends AdminCourse {
	lessons: CourseLessonRow[];
	enrollments: CourseEnrollmentRow[];
	certificates: CourseCertificateRow[];
}
