import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { SchoolClass } from "@/types/school-class.type";

const schoolClassService = {
	async getSchoolClasses(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<SchoolClass>> {
		return api.get("/school-classes", params);
	},

	async createSchoolClass(payload: {
		label: string;
		value: string;
		major_id: number;
	}): Promise<ApiResponse<SchoolClass>> {
		return api.post<ApiResponse<SchoolClass>, typeof payload>(
			"/school-classes",
			payload,
		);
	},

	async getSchoolClass(id: number | string): Promise<ApiResponse<SchoolClass>> {
		return api.get(`/school-classes/${id}`);
	},

	async updateSchoolClass(
		id: number | string,
		payload: {
			label: string;
			value: string;
			major_id: number;
		},
	): Promise<ApiResponse<SchoolClass>> {
		return api.put<ApiResponse<SchoolClass>, typeof payload>(
			`/school-classes/${id}`,
			payload,
		);
	},

	async deleteSchoolClass(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/school-classes/${id}`);
	},
};

export default schoolClassService;
