import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

export interface UnifiedReportContent {
	id: number;
	slug: string | null;
	title: string;
	status: string;
}

export interface UnifiedReportUser {
	id: number;
	full_name: string;
	email: string;
	username: string | null;
}

export interface UnifiedReportRecord {
	id: number;
	type: "post" | "blog";
	content: UnifiedReportContent | null;
	reporter: UnifiedReportUser | null;
	resolver: { id: number; full_name: string } | null;
	reason: "spam" | "offensive" | "misinformation" | "inappropriate" | "other";
	description: string | null;
	status: "pending" | "reviewing" | "resolved" | "dismissed";
	resolved_at: string | null;
	created_at: string;
}

const unifiedReportService = {
	async getReports(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		status?: string;
		type?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<UnifiedReportRecord>> {
		return api.get("/unified-reports", params as Record<string, unknown>);
	},

	async updateStatus(
		type: "post" | "blog",
		id: number,
		status: UnifiedReportRecord["status"],
	): Promise<ApiResponse<UnifiedReportRecord>> {
		return api.patch(`/unified-reports/${type}/${id}/status`, { status });
	},

	async hideContent(
		type: "post" | "blog",
		id: number,
	): Promise<ApiResponse<UnifiedReportRecord>> {
		return api.post(`/unified-reports/${type}/${id}/hide`);
	},
};

export default unifiedReportService;
