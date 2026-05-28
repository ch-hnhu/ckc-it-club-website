import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";

export interface CommunityChannel {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	image: string | null;
	posts_count: number;
	created_at: string | null;
	updated_at: string | null;
}

export interface CommunityChannelsQuery extends Record<string, unknown> {
	page?: number;
	per_page?: number;
	search?: string;
	sort?: "id" | "name" | "posts_count" | "created_at";
	order?: "asc" | "desc";
}

export const communityService = {
	getChannels: (params?: CommunityChannelsQuery) =>
		api.get<PaginatedResponse<CommunityChannel>>("/community/channels", params),
};
