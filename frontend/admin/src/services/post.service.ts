import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { PostRecord, PostStats, PostStatus } from "@/pages/community/PostListPage";

const postService = {
	async getPosts(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		status?: PostStatus | "all";
	}): Promise<PaginatedResponse<PostRecord>> {
		return api.get("/posts", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<PostStats>> {
		return api.get("/posts/stats");
	},

	async createPost(payload: FormData): Promise<ApiResponse<PostRecord>> {
		return api.post<ApiResponse<PostRecord>, FormData>("/posts", payload, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async updateStatus(
		id: number | string,
		status: PostStatus,
	): Promise<ApiResponse<{ status: PostStatus }>> {
		return api.patch<ApiResponse<{ status: PostStatus }>, { status: PostStatus }>(
			`/posts/${id}/status`,
			{ status },
		);
	},

	async deletePost(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/posts/${id}`);
	},
};

export default postService;
