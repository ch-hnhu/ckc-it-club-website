import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	Course,
	CourseCategory,
	CourseDetail,
	CourseListParams,
	LessonDetail,
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
