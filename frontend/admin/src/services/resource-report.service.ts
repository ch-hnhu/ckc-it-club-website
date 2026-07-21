import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

export interface ReportResource {
	id: number;
	title: string;
	url: string | null;
	status: string;
}

export interface ResourceReportRecord {
	id: number;
	resource: ReportResource | null;
	reporter: { id: number; full_name: string; email: string; username: string | null } | null;
	resolver: { id: number; full_name: string } | null;
	reason: "inappropriate" | "broken_link" | "copyright" | "other";
	description: string | null;
	status: "pending" | "dismissed" | "resolved_hidden";
	resolution_note: string | null;
	resolved_at: string | null;
	created_at: string;
}

export interface ResourceReportStats {
	total: number;
	pending: number;
	dismissed: number;
	resolved_hidden: number;
}

const resourceReportService = {
	async getStats(): Promise<ApiResponse<ResourceReportStats>> {
		return api.get("/resource-reports/stats");
	},

	async getReports(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		status?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<ResourceReportRecord>> {
		return api.get("/resource-reports", params as Record<string, unknown>);
	},

	async dismiss(id: number): Promise<ApiResponse<ResourceReportRecord>> {
		return api.post(`/resource-reports/${id}/dismiss`);
	},

	async hide(id: number, resolutionNote: string): Promise<ApiResponse<ResourceReportRecord>> {
		return api.post(`/resource-reports/${id}/hide`, { resolution_note: resolutionNote });
	},
};

export default resourceReportService;
