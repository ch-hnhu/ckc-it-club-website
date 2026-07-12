import apiClient from "@/config/axios.config";
import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { AdminCourse, CourseListParams } from "@/pages/learning/course.types";
import type {
	AdminCourseDetail,
	CourseCertificateRow,
	CourseEnrollmentRow,
	EnrollmentTrack,
} from "@/pages/learning/course-detail.types";
import type { CourseStatus } from "@/pages/learning/course-meta";

/** Một user gợi ý khi tìm để ghi danh thay (chưa ghi danh khóa học). */
export interface EnrollableUserDTO {
	id: number;
	full_name: string | null;
	email: string | null;
	avatar: string | null;
}

export interface CourseCategoryOption {
	id: number;
	name: string;
	color: string | null;
}

/** Một user có thể chọn làm mentor cho khóa học. */
export interface MentorOption {
	id: number;
	full_name: string | null;
	avatar: string | null;
}

/** Buổi học đầy đủ field (cho form thêm/sửa buổi học) */
export interface LessonFull {
	id: number;
	course_id: number;
	order: number;
	title: string;
	slug: string;
	description: string | null;
	status: CourseStatus;
	session_start: string | null;
	session_end: string | null;
	resource_url: string | null;
	video_url: string | null;
	video_duration: number | null;
	live_url: string | null;
	live_duration: number | null;
	document: string | null;
	assignment_url: string | null;
	assignment_deadline: string | null;
}

export type LessonPayload = Record<string, string | number | null>;

export interface CheckInStudentDTO {
	id: number;
	full_name: string | null;
	email: string | null;
	avatar: string | null;
}

export interface LessonCheckInResult {
	already: boolean;
	student: CheckInStudentDTO;
}

/** Một học viên trong danh sách chấm bài tập của buổi học. */
export interface AssignmentGradeDTO {
	user_id: number;
	full_name: string | null;
	email: string | null;
	avatar: string | null;
	track: "offline" | "online";
	/** null = chưa chấm, true = đạt, false = không đạt */
	passed: boolean | null;
}

export interface GradeInput {
	user_id: number;
	passed: boolean | null;
}

/** Một đáp án của câu hỏi quiz (shape khớp backend QuizController). */
export interface QuizOptionDTO {
	id?: number;
	content: string | null;
	image: string | null;
	is_correct: boolean;
	order?: number;
	metadata?: Record<string, unknown> | null;
}

/** Một câu hỏi quiz. `type` là key đã lưu (DB), `ui_type` là template trên trình tạo. */
export interface QuizQuestionDTO {
	id?: number;
	type: string;
	ui_type?: string;
	content: string;
	explanation: string | null;
	image: string | null;
	order?: number;
	metadata?: Record<string, unknown> | null;
	options: QuizOptionDTO[];
}

export interface QuizDTO {
	id: number;
	lesson_id: number;
	is_published: boolean;
	questions: QuizQuestionDTO[];
}

/** Payload gửi lên khi lưu quiz. */
export interface QuizPayload {
	is_published: boolean;
	questions: QuizQuestionDTO[];
}

const courseService = {
	/**
	 * Danh sách khóa học (admin). Bỏ qua các tham số rỗng / "all" để URL gọn
	 * và để backend dùng mặc định.
	 */
	async getCourses(params: CourseListParams = {}): Promise<PaginatedResponse<AdminCourse>> {
		const query: Record<string, unknown> = {
			page: params.page,
			per_page: params.per_page,
		};

		if (params.search) query.search = params.search;
		if (params.status && params.status !== "all") query.status = params.status;
		if (params.level && params.level !== "all") query.level = params.level;
		if (params.audience && params.audience !== "all") query.audience = params.audience;
		if (params.offline && params.offline !== "all") query.offline = params.offline;
		if (params.sort) query.sort = params.sort;
		if (params.order) query.order = params.order;

		return api.get("/courses", query);
	},

	/** Chi tiết khóa học (admin): khóa + buổi học + học viên theo track + chứng chỉ. */
	async getCourse(slug: string): Promise<ApiResponse<AdminCourseDetail>> {
		return api.get(`/courses/${slug}`);
	},

	/** Tạo khóa học mới (multipart vì có thumbnail). */
	async createCourse(payload: FormData): Promise<ApiResponse<AdminCourse>> {
		return api.post("/courses", payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	/** Cập nhật khóa học. PHP không parse multipart với PUT nên dùng POST + _method. */
	async updateCourse(slug: string, payload: FormData): Promise<ApiResponse<AdminCourse>> {
		payload.append("_method", "PUT");
		return api.post(`/courses/${slug}`, payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	/** Danh mục (tag) khóa học để chọn khi tạo/sửa — dùng endpoint công khai. */
	async getCategories(): Promise<ApiResponse<CourseCategoryOption[]>> {
		return api.get("/learning/categories");
	},

	/** Danh sách user để chọn làm mentor khi tạo/sửa khóa học. */
	async getMentorOptions(): Promise<ApiResponse<MentorOption[]>> {
		return api.get("/courses/mentor-options");
	},

	/** Lấy thời lượng video YouTube (giây + nhãn "X tiếng Y phút") từ URL qua backend. */
	async getYoutubeDuration(url: string): Promise<ApiResponse<{ seconds: number; label: string }>> {
		return api.get("/lessons/youtube-duration", { url });
	},

	// ── Xóa / thùng rác ──
	async deleteCourse(slug: string): Promise<ApiResponse<null>> {
		return api.delete(`/courses/${slug}`);
	},

	async getDeletedCourses(params: CourseListParams = {}): Promise<PaginatedResponse<AdminCourse>> {
		const query: Record<string, unknown> = { page: params.page, per_page: params.per_page };
		if (params.search) query.search = params.search;
		if (params.sort) query.sort = params.sort;
		if (params.order) query.order = params.order;
		return api.get("/courses/trash", query);
	},

	async restoreCourse(id: number): Promise<ApiResponse<AdminCourse>> {
		return api.patch(`/courses/trash/${id}/restore`);
	},

	async forceDeleteCourse(id: number): Promise<ApiResponse<null>> {
		return api.delete(`/courses/trash/${id}/force`);
	},

	// ── Buổi học (lessons) ──
	async getLesson(courseSlug: string, lessonId: number): Promise<ApiResponse<LessonFull>> {
		return api.get(`/courses/${courseSlug}/lessons/${lessonId}`);
	},

	async createLesson(courseSlug: string, payload: LessonPayload): Promise<ApiResponse<LessonFull>> {
		return api.post(`/courses/${courseSlug}/lessons`, payload);
	},

	async updateLesson(
		courseSlug: string,
		lessonId: number,
		payload: LessonPayload,
	): Promise<ApiResponse<LessonFull>> {
		return api.put(`/courses/${courseSlug}/lessons/${lessonId}`, payload);
	},

	async deleteLesson(courseSlug: string, lessonId: number): Promise<ApiResponse<null>> {
		return api.delete(`/courses/${courseSlug}/lessons/${lessonId}`);
	},

	// ── Quiz của buổi học ──
	/** Lấy quiz hiện có của buổi học (data = null nếu chưa có). */
	async getQuiz(
		courseSlug: string,
		lessonId: number,
	): Promise<ApiResponse<QuizDTO | null>> {
		return api.get(`/courses/${courseSlug}/lessons/${lessonId}/quiz`);
	},

	/** Tạo mới hoặc thay thế toàn bộ nội dung quiz của buổi học. */
	async saveQuiz(
		courseSlug: string,
		lessonId: number,
		payload: QuizPayload,
	): Promise<ApiResponse<QuizDTO>> {
		return api.put(`/courses/${courseSlug}/lessons/${lessonId}/quiz`, payload);
	},

	/** Xoá toàn bộ quiz của buổi học. */
	async deleteQuiz(courseSlug: string, lessonId: number): Promise<ApiResponse<null>> {
		return api.delete(`/courses/${courseSlug}/lessons/${lessonId}/quiz`);
	},

	/** Điểm danh buổi học bằng mã QR (token trên vé học viên). */
	async checkInLesson(
		courseSlug: string,
		lessonId: number,
		qrToken: string,
	): Promise<ApiResponse<LessonCheckInResult>> {
		return api.post(`/courses/${courseSlug}/lessons/${lessonId}/check-in`, { qr_token: qrToken });
	},

	/** Điểm danh thủ công (toggle có mặt/vắng) một học viên cho buổi học offline. */
	async toggleAttendance(
		courseSlug: string,
		lessonId: number,
		userId: number,
		present: boolean,
		note?: string,
	): Promise<ApiResponse<{ user_id: number; lesson_id: number; present: boolean }>> {
		return api.post(`/courses/${courseSlug}/lessons/${lessonId}/attendance`, {
			user_id: userId,
			present,
			...(note ? { note } : {}),
		});
	},

	/** Danh sách học viên + điểm bài tập hiện tại của buổi học. */
	async getGrades(
		courseSlug: string,
		lessonId: number,
	): Promise<ApiResponse<AssignmentGradeDTO[]>> {
		return api.get(`/courses/${courseSlug}/lessons/${lessonId}/grades`);
	},

	/** Lưu điểm bài tập cho nhiều học viên cùng lúc. */
	async saveGrades(
		courseSlug: string,
		lessonId: number,
		grades: GradeInput[],
	): Promise<ApiResponse<AssignmentGradeDTO[]>> {
		return api.put(`/courses/${courseSlug}/lessons/${lessonId}/grades`, { grades });
	},

	// ── Ghi danh thủ công (admin) ──
	/** Tìm user chưa ghi danh khóa học (theo tên/email/username) để ghi danh thay. */
	async searchEnrollableUsers(
		courseSlug: string,
		search: string,
	): Promise<ApiResponse<EnrollableUserDTO[]>> {
		return api.get(`/courses/${courseSlug}/enrollable-users`, { search });
	},

	/** Ghi danh thay học viên. */
	async enrollStudent(
		courseSlug: string,
		userId: number,
		track: EnrollmentTrack,
	): Promise<ApiResponse<CourseEnrollmentRow>> {
		return api.post(`/courses/${courseSlug}/enrollments`, { user_id: userId, track });
	},

	/** Xoá ghi danh (cascade xoá tiến độ/điểm danh liên quan). */
	async removeEnrollment(courseSlug: string, enrollmentId: number): Promise<ApiResponse<null>> {
		return api.delete(`/courses/${courseSlug}/enrollments/${enrollmentId}`);
	},

	/** Thu hồi chứng chỉ (giữ lại bản ghi, chỉ đánh dấu đã thu hồi). */
	async revokeCertificate(
		courseSlug: string,
		certificateId: number,
	): Promise<ApiResponse<CourseCertificateRow>> {
		return api.post(`/courses/${courseSlug}/certificates/${certificateId}/revoke`);
	},

	/** Cấp lại chứng chỉ (sinh cert_code + PDF mới, gỡ trạng thái thu hồi). */
	async reissueCertificate(
		courseSlug: string,
		certificateId: number,
	): Promise<ApiResponse<CourseCertificateRow>> {
		return api.post(`/courses/${courseSlug}/certificates/${certificateId}/reissue`);
	},

	/** Tải file ZIP gom toàn bộ chứng chỉ bản in (has_physical, còn hiệu lực) của khoá học. */
	async exportPhysicalCertificates(courseSlug: string): Promise<Blob> {
		const response = await apiClient.get<Blob>(
			`/courses/${courseSlug}/certificates/export-physical`,
			{ responseType: "blob" },
		);

		return response.data;
	},
};

export default courseService;
