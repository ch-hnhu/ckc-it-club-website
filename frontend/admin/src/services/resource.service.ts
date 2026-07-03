import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

export type ResourceStatus = "pending_review" | "published" | "rejected" | "hidden";
export type ResourceLinkType = "google_drive" | "youtube" | "github" | "document" | "other";

export interface ResourceUploader {
	id: number;
	full_name: string | null;
	email: string;
	avatar: string | null;
}

export interface ResourceRecord {
	id: number;
	uploader: ResourceUploader | null;
	title: string;
	description: string | null;
	link_type: ResourceLinkType;
	url: string;
	status: ResourceStatus;
	click_count: number;
	rejection_reason: string | null;
	reviewed_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface ResourceStats {
	total: number;
	pending_review: number;
	published: number;
	rejected: number;
	hidden: number;
}

const resourceService = {
	async getResources(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		status?: ResourceStatus | "all";
	}): Promise<PaginatedResponse<ResourceRecord>> {
		return api.get("/resources", params as Record<string, unknown>);
	},

	async getStats(): Promise<ApiResponse<ResourceStats>> {
		return api.get("/resources/stats");
	},

	async updateStatus(
		id: number,
		status: "published" | "rejected",
		notify: boolean,
		reason?: string,
	): Promise<ApiResponse<{ status: ResourceStatus }>> {
		return api.patch(`/resources/${id}/status`, { status, notify, reason });
	},

	async deleteResource(id: number): Promise<ApiResponse<null>> {
		return api.delete(`/resources/${id}`);
	},
};

export default resourceService;
