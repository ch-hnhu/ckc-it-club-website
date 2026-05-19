import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Major } from "@/types/major.type";

const majorService = {
	async getMajors(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Major>> {
		return api.get("/majors", params);
	},

	async createMajor(payload: {
		label: string;
		value: string;
		faculty_id: number;
	}): Promise<ApiResponse<Major>> {
		return api.post<ApiResponse<Major>, typeof payload>("/majors", payload);
	},

	async getMajor(id: number | string): Promise<ApiResponse<Major>> {
		return api.get(`/majors/${id}`);
	},

	async updateMajor(
		id: number | string,
		payload: {
			label: string;
			value: string;
			faculty_id: number;
		},
	): Promise<ApiResponse<Major>> {
		return api.put<ApiResponse<Major>, typeof payload>(`/majors/${id}`, payload);
	},

	async deleteMajor(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/majors/${id}`);
	},
};

export default majorService;
