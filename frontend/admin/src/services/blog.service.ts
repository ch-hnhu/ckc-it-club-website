import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { BlogDetail, BlogRecord, BlogStats, BlogStatus } from "@/pages/community/BlogListPage";

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

	async getBlog(id: number | string): Promise<ApiResponse<BlogDetail>> {
		return api.get(`/blogs/${id}`);
	},

	async createBlog(payload: FormData): Promise<ApiResponse<BlogRecord>> {
		return api.post<ApiResponse<BlogRecord>, FormData>("/blogs", payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
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
