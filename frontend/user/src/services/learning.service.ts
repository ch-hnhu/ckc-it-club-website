import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	CertificateVerifyResult,
	Course,
	CourseCategory,
	CourseCertificateInfo,
	CourseDetail,
	CourseListParams,
	LessonDetail,
	MyCertificate,
	QuizAnswerInput,
	QuizPlay,
	QuizSubmitResult,
	VideoDetail,
} from "@/types/learning.types";

// Learning Center API — backend: routes/api.php nhóm `/learning`.
export const learningService = {
	getCourses: (params?: CourseListParams) =>
		api.get<PaginatedResponse<Course>>(
			"/learning/courses",
			params as Record<string, unknown>,
		),

	getCategories: () =>
		api.get<ApiResponse<CourseCategory[]>>("/learning/categories"),

	getCourse: (slug: string) =>
		api.get<ApiResponse<CourseDetail>>(`/learning/courses/${slug}`),

	getLesson: (courseSlug: string, lessonSlug: string) =>
		api.get<ApiResponse<LessonDetail>>(
			`/learning/courses/${courseSlug}/lessons/${lessonSlug}`,
		),

	getVideo: (courseSlug: string, lessonSlug: string, videoSlug: string) =>
		api.get<ApiResponse<VideoDetail>>(
			`/learning/courses/${courseSlug}/lessons/${lessonSlug}/videos/${videoSlug}`,
		),

	// Ghi danh khoá học theo hình thức offline/online (yêu cầu đăng nhập).
	enroll: (slug: string, track: "offline" | "online") =>
		api.post<ApiResponse<{ track: "offline" | "online" }>>(
			`/learning/courses/${slug}/enroll`,
			{ track },
		),

	// Bật/tắt "quan tâm" khoá học (yêu cầu đăng nhập).
	toggleFollow: (slug: string) =>
		api.post<ApiResponse<{ is_interested: boolean; followers_count: number }>>(
			`/learning/courses/${slug}/follow`,
		),

	// Đăng ký "sẽ tham gia" buổi học offline → cấp vé QR điểm danh (yêu cầu đăng nhập).
	createQrTicket: (slug: string, lessonSlug: string) =>
		api.post<ApiResponse<{ token: string; used_at: string | null }>>(
			`/learning/courses/${slug}/lessons/${lessonSlug}/qr-ticket`,
		),

	// Ghi nhận % xem video bài giảng (hybrid: tự động qua YouTube IFrame API + nút đánh dấu tay).
	markVideoProgress: (courseSlug: string, lessonSlug: string, watchPercentage: number) =>
		api.post<ApiResponse<{ watch_percentage: number; is_completed: boolean }>>(
			`/learning/courses/${courseSlug}/lessons/${lessonSlug}/progress`,
			{ watch_percentage: watchPercentage },
		),

	// Chứng chỉ khoá học của user hiện tại (yêu cầu đăng nhập). 404 nếu chưa có.
	getCertificate: (slug: string) =>
		api.get<ApiResponse<CourseCertificateInfo>>(`/learning/courses/${slug}/certificate`),

	// Danh sách tất cả chứng chỉ (còn hiệu lực) của user hiện tại (yêu cầu đăng nhập).
	getMyCertificates: () =>
		api.get<ApiResponse<MyCertificate[]>>("/learning/certificates"),

	// Xác minh công khai chứng chỉ theo mã QR (không cần đăng nhập).
	verifyCertificate: (code: string) =>
		api.get<ApiResponse<CertificateVerifyResult>>(
			`/certificates/verify/${encodeURIComponent(code)}`,
		),

	getQuiz: (courseSlug: string, lessonSlug: string) =>
		api.get<ApiResponse<QuizPlay>>(
			`/learning/courses/${courseSlug}/lessons/${lessonSlug}/quiz`,
		),

	submitQuiz: (
		courseSlug: string,
		lessonSlug: string,
		answers: QuizAnswerInput[],
	) =>
		api.post<ApiResponse<QuizSubmitResult>>(
			`/learning/courses/${courseSlug}/lessons/${lessonSlug}/quiz/submit`,
			{ answers },
		),
};
