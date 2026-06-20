import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { AdminCourse, CourseListParams } from "@/pages/learning/course-mock";
import type { AdminCourseDetail } from "@/pages/learning/course-detail-mock";

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
};

export default courseService;
