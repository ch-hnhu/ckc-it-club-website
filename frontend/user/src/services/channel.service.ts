import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { Channel } from "@/types/channel.types";

export const channelService = {
	/** Fetch all channels with published post counts. */
	getChannels: () => api.get<ApiResponse<Channel[]>>("/community/channels"),
};
