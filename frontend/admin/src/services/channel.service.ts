import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ChannelRecord } from "@/pages/community/ChannelListPage";

export interface ChannelPayload {
	name: string;
	slug?: string;
	description?: string | null;
	image?: File | null;
}

function toFormData(payload: ChannelPayload) {
	const formData = new FormData();
	formData.append("name", payload.name);

	if (payload.slug) {
		formData.append("slug", payload.slug);
	}

	if (payload.description) {
		formData.append("description", payload.description);
	}

	if (payload.image) {
		formData.append("image", payload.image);
	}

	return formData;
}

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

	async createChannel(payload: ChannelPayload): Promise<ApiResponse<ChannelRecord>> {
		return api.post<ApiResponse<ChannelRecord>, FormData>("/channels", toFormData(payload), {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async updateChannel(
		id: number | string,
		payload: ChannelPayload,
	): Promise<ApiResponse<ChannelRecord>> {
		const formData = toFormData(payload);
		formData.append("_method", "PUT");

		return api.post<ApiResponse<ChannelRecord>, FormData>(`/channels/${id}`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	},

	async deleteChannel(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/channels/${id}`);
	},

	async getTrash(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<ChannelRecord>> {
		return api.get("/channels/trash", params as Record<string, unknown>);
	},

	async restoreChannel(id: number | string): Promise<ApiResponse<ChannelRecord>> {
		return api.patch(`/channels/${id}/restore`);
	},

	async forceDeleteChannel(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/channels/${id}/force-delete`);
	},
};

export default channelService;
