import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

export interface ReportPost {
	id: number;
	title: string;
	status: string;
}

export interface ReportUser {
	id: number;
	full_name: string;
	email: string;
	username: string | null;
}

export interface PostReportRecord {
	id: number;
	post: ReportPost | null;
	reporter: ReportUser | null;
	resolver: { id: number; full_name: string } | null;
	reason: "spam" | "offensive" | "misinformation" | "inappropriate" | "other";
	description: string | null;
	status: "pending" | "reviewing" | "resolved" | "dismissed" | "superseded";
	resolved_at: string | null;
	created_at: string;
}

export interface ReportStats {
	total: number;
	pending: number;
	reviewing: number;
	resolved: number;
	dismissed: number;
	superseded: number;
}

const reportService = {
	async getStats(): Promise<ApiResponse<ReportStats>> {
		return api.get("/reports/stats");
	},

	async getReports(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		status?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<PostReportRecord>> {
		return api.get("/reports", params as Record<string, unknown>);
	},

	async updateStatus(
		id: number,
		status: PostReportRecord["status"],
	): Promise<ApiResponse<PostReportRecord>> {
		return api.patch(`/reports/${id}/status`, { status });
	},

	async hidePost(id: number): Promise<ApiResponse<PostReportRecord>> {
		return api.post(`/reports/${id}/hide-post`);
	},
};

export default reportService;
