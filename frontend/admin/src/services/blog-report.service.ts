import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

export interface ReportBlog {
	id: number;
	slug: string;
	title: string;
	status: string;
}

export interface BlogReportRecord {
	id: number;
	blog: ReportBlog | null;
	reporter: { id: number; full_name: string; email: string; username: string | null } | null;
	resolver: { id: number; full_name: string } | null;
	reason: "spam" | "offensive" | "misinformation" | "inappropriate" | "other";
	description: string | null;
	status: "pending" | "reviewing" | "resolved" | "dismissed";
	resolved_at: string | null;
	created_at: string;
}

export interface BlogReportStats {
	total: number;
	pending: number;
	reviewing: number;
	resolved: number;
	dismissed: number;
}

const blogReportService = {
	async getStats(): Promise<ApiResponse<BlogReportStats>> {
		return api.get("/blog-reports/stats");
	},

	async getReports(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		status?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<BlogReportRecord>> {
		return api.get("/blog-reports", params as Record<string, unknown>);
	},

	async updateStatus(
		id: number,
		status: BlogReportRecord["status"],
	): Promise<ApiResponse<BlogReportRecord>> {
		return api.patch(`/blog-reports/${id}/status`, { status });
	},

	async hideBlog(id: number): Promise<ApiResponse<BlogReportRecord>> {
		return api.post(`/blog-reports/${id}/hide-blog`);
	},
};

export default blogReportService;
