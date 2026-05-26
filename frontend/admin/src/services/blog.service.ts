import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { BlogRecord, BlogStats, BlogStatus } from "@/pages/community/BlogListPage";

const blogService = {
	async getBlogs(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		status?: BlogStatus | "all";
	}): Promise<PaginatedResponse<BlogRecord>> {
		return api.get("/blogs", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<BlogStats>> {
		return api.get("/blogs/stats");
	},

	async updateStatus(
		id: number | string,
		status: BlogStatus,
	): Promise<ApiResponse<{ status: BlogStatus }>> {
		return api.patch<ApiResponse<{ status: BlogStatus }>, { status: BlogStatus }>(
			`/blogs/${id}/status`,
			{ status },
		);
	},

	async deleteBlog(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/blogs/${id}`);
	},
};

export default blogService;
