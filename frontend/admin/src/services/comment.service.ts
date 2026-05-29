import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { CommentRecord, CommentStats } from "@/pages/community/CommentListPage";

const commentService = {
	async getComments(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		visibility?: "all" | "visible" | "hidden";
		type?: "all" | "post" | "blog";
	}): Promise<PaginatedResponse<CommentRecord>> {
		return api.get("/comments", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<CommentStats>> {
		return api.get("/comments/stats");
	},

	async updateVisibility(id: number | string, isHidden: boolean): Promise<ApiResponse<{ is_hidden: boolean }>> {
		return api.patch(`/comments/${id}/visibility`, { is_hidden: isHidden });
	},

	async deleteComment(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/comments/${id}`);
	},
};

export default commentService;
