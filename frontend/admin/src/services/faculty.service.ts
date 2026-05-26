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

	async getDeletedFaculties(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Faculty>> {
		return api.get("/faculties/trash", params);
	},

	async createFaculty(payload: {
		label: string;
		value: string;
	}): Promise<ApiResponse<Faculty>> {
		return api.post<ApiResponse<Faculty>, typeof payload>("/faculties", payload);
	},

	async restoreFaculty(id: number | string): Promise<ApiResponse<Faculty>> {
		return api.patch<ApiResponse<Faculty>, undefined>(`/faculties/${id}/restore`);
	},

	async forceDeleteFaculty(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/faculties/${id}/force`);
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

	async bulkDeleteFaculties(
		ids: number[],
	): Promise<ApiResponse<{ deleted: number; errors: string[] }>> {
		return api.post<ApiResponse<{ deleted: number; errors: string[] }>, { ids: number[] }>(
			"/faculties/bulk-delete",
			{ ids },
		);
	},
};

export default facultyService;
