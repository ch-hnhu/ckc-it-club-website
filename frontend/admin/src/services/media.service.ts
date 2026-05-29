import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { MediaFileRecord, MediaFileStats } from "@/pages/community/MediaListPage";

const mediaService = {
	async getMediaFiles(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		file_type?: string;
		target_type?: string;
	}): Promise<PaginatedResponse<MediaFileRecord>> {
		return api.get("/media-files", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<MediaFileStats>> {
		return api.get("/media-files/stats");
	},

	async deleteMediaFile(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/media-files/${id}`);
	},
};

export default mediaService;
