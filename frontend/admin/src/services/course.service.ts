import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { AdminCourse, CourseListParams } from "@/pages/learning/course-mock";
import type { AdminCourseDetail } from "@/pages/learning/course-detail-mock";

export interface CourseCategoryOption {
	id: number;
	name: string;
	color: string | null;
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
		return api.post("/courses", payload);
	},

	/** Danh mục (tag) khóa học để chọn khi tạo/sửa — dùng endpoint công khai. */
	async getCategories(): Promise<ApiResponse<CourseCategoryOption[]>> {
		return api.get("/learning/categories");
	},
};

export default courseService;
