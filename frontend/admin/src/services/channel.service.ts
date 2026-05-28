import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ChannelRecord } from "@/pages/community/ChannelListPage";

const channelService = {
	async getChannels(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<ChannelRecord>> {
		return api.get("/channels", params as Record<string, unknown>);
	},

	async createChannel(payload: {
		name: string;
		slug?: string;
		description?: string | null;
		image?: string | null;
	}): Promise<ApiResponse<ChannelRecord>> {
		return api.post<ApiResponse<ChannelRecord>, typeof payload>("/channels", payload);
	},

	async updateChannel(
		id: number | string,
		payload: { name: string; slug?: string; description?: string | null; image?: string | null },
	): Promise<ApiResponse<ChannelRecord>> {
		return api.put<ApiResponse<ChannelRecord>, typeof payload>(`/channels/${id}`, payload);
	},

	async deleteChannel(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/channels/${id}`);
	},
};

export default channelService;
