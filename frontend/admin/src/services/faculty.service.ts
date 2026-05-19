import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Faculty } from "@/types/faculty.type";

const facultyService = {
	async getFaculties(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Faculty>> {
		return api.get("/faculties", params);
	},

	async createFaculty(payload: {
		label: string;
		value: string;
	}): Promise<ApiResponse<Faculty>> {
		return api.post<ApiResponse<Faculty>, typeof payload>("/faculties", payload);
	},

	async getFaculty(id: number | string): Promise<ApiResponse<Faculty>> {
		return api.get(`/faculties/${id}`);
	},

	async updateFaculty(
		id: number | string,
		payload: {
			label: string;
			value: string;
		},
	): Promise<ApiResponse<Faculty>> {
		return api.put<ApiResponse<Faculty>, typeof payload>(`/faculties/${id}`, payload);
	},

	async deleteFaculty(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/faculties/${id}`);
	},
};

export default facultyService;
