import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { TagRecord } from "@/pages/community/TagListPage";

const tagService = {
	async getTags(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<TagRecord>> {
		return api.get("/tags", params as Record<string, unknown>);
	},

	async createTag(payload: {
		name: string;
		slug?: string;
		description?: string | null;
	}): Promise<ApiResponse<TagRecord>> {
		return api.post<ApiResponse<TagRecord>, typeof payload>("/tags", payload);
	},

	async updateTag(
		id: number | string,
		payload: { name: string; slug?: string; description?: string | null },
	): Promise<ApiResponse<TagRecord>> {
		return api.put<ApiResponse<TagRecord>, typeof payload>(`/tags/${id}`, payload);
	},

	async deleteTag(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/tags/${id}`);
	},
};

export default tagService;
