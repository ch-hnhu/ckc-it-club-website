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
