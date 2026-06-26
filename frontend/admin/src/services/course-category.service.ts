import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

export interface CourseCategory {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	courses_count: number;
	created_at: string;
}

const courseCategoryService = {
	async getCategories(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<CourseCategory>> {
		return api.get("/course-categories", params as Record<string, unknown>);
	},

	async createCategory(payload: {
		name: string;
		slug?: string;
		description?: string | null;
	}): Promise<ApiResponse<CourseCategory>> {
		return api.post<ApiResponse<CourseCategory>, typeof payload>("/course-categories", payload);
	},

	async updateCategory(
		id: number | string,
		payload: { name: string; slug?: string; description?: string | null },
	): Promise<ApiResponse<CourseCategory>> {
		return api.put<ApiResponse<CourseCategory>, typeof payload>(`/course-categories/${id}`, payload);
	},

	async deleteCategory(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/course-categories/${id}`);
	},
};

export default courseCategoryService;
