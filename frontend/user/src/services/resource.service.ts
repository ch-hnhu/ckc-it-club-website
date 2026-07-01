import { api } from "@/services/api.service";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
	CreateResourcePayload,
	Resource,
	ResourceLinkType,
	ResourceReportReason,
} from "@/types/resource.types";

export const resourceService = {
	getResources: (params?: { page?: number; per_page?: number; search?: string; link_type?: ResourceLinkType | "all" }) =>
		api.get<PaginatedResponse<Resource>>("/community/resources", params as Record<string, unknown>),

	createResource: (payload: CreateResourcePayload) =>
		api.post<ApiResponse<Resource>>("/community/resources", payload),

	getMyResources: (page = 1) =>
		api.get<PaginatedResponse<Resource>>("/community/resources/my-resources", { page, per_page: 20 }),

	recordClick: (resourceId: number) =>
		api.post<ApiResponse<{ click_count: number }>>(`/community/resources/${resourceId}/click`),

	reportResource: (resourceId: number, reason: ResourceReportReason, description?: string) =>
		api.post<ApiResponse<null>>(`/community/resources/${resourceId}/report`, { reason, description }),
};
